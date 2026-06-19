import { BadRequestException, ForbiddenException, HttpException, HttpStatus, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateAnswerDto } from "./dto/create-answer.dto";
import { CreateQuestionDto } from "./dto/create-question.dto";
import { GetQuestionsQueryDto } from "./dto/get-questions-query.dto";
import { UpdateQuestionDto } from "./dto/update-question.dto";
import { PAGINATION_LIMITS } from "../common/pagination.constants";

@Injectable()
export class QuestionsService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly questionRateLimit = new Map<number, number[]>();
  private readonly answerRateLimit = new Map<number, number[]>();

  private readonly answerSelect = {
    id: true,
    content: true,
    createdAt: true,
    isUseful: true,
    user: {
      select: {
        id: true,
        email: true,
        profile: { select: { firstName: true, lastName: true } },
      },
    },
    images: { select: { id: true, imageUrl: true, mimeType: true, sizeBytes: true, position: true }, orderBy: { position: "asc" } },
    votes: { select: { userId: true, value: true } },
  } as const;

  private readonly questionSelect = {
    id: true,
    title: true,
    content: true,
    createdAt: true,
    isResolved: true,
    user: {
      select: {
        id: true,
        email: true,
        profile: { select: { firstName: true, lastName: true } },
      },
    },
    community: { select: { id: true, name: true, slug: true } },
    answers: {
      where: { status: "PUBLISHED" },
      orderBy: [{ isUseful: "desc" }, { createdAt: "asc" }] as any,
      select: this.answerSelect,
    },
    images: { select: { id: true, imageUrl: true, mimeType: true, sizeBytes: true, position: true }, orderBy: { position: "asc" } },
    _count: { select: { answers: { where: { status: "PUBLISHED" } } } },
  } as const;

  private mapAnswer(answer: any, viewerUserId?: number) {
    const votes: { userId: number; value: number }[] = answer.votes ?? [];
    const viewerVote = viewerUserId != null ? votes.find((vote) => vote.userId === viewerUserId)?.value ?? 0 : 0;
    return {
      id: answer.id,
      content: answer.content,
      createdAt: answer.createdAt,
      isUseful: answer.isUseful,
      images: answer.images ?? [],
      votesScore: votes.reduce((sum, vote) => sum + vote.value, 0),
      upvotes: votes.filter((vote) => vote.value === 1).length,
      downvotes: votes.filter((vote) => vote.value === -1).length,
      viewerVote: viewerVote as -1 | 0 | 1,
      author: {
        id: answer.user.id,
        email: answer.user.email,
        firstName: answer.user.profile?.firstName ?? null,
        lastName: answer.user.profile?.lastName ?? null,
      },
    };
  }

  private mapQuestion(question: any, viewerUserId?: number, viewerRole?: string) {
    const canMarkUseful = viewerUserId != null && (question.user.id === viewerUserId || viewerRole === "ADMIN" || viewerRole === "MODERATOR");
    return {
      id: question.id,
      title: question.title,
      content: question.content,
      createdAt: question.createdAt,
      isResolved: question.isResolved,
      author: {
        id: question.user.id,
        email: question.user.email,
        firstName: question.user.profile?.firstName ?? null,
        lastName: question.user.profile?.lastName ?? null,
      },
      community: question.community,
      images: question.images,
      answersCount: question._count.answers,
      answers: question.answers.map((answer: any) => this.mapAnswer(answer, viewerUserId)),
      isMine: viewerUserId != null && question.user.id === viewerUserId,
      canMarkUseful,
    };
  }

  async index(query: GetQuestionsQueryDto, viewerUserId?: number, viewerRole?: string) {
    const limit = query.limit ?? PAGINATION_LIMITS.questions.default;
    const safeLimit = Math.min(limit, PAGINATION_LIMITS.questions.max);

    const where: any = { status: "PUBLISHED" };
    if (query.communityId) where.communityId = query.communityId;
    if (query.q) {
      where.OR = [
        { title: { contains: query.q, mode: "insensitive" } },
        { content: { contains: query.q, mode: "insensitive" } },
      ];
    }
    if (query.status === "open") {
      where.isResolved = false;
      where.answers = { none: { status: "PUBLISHED" } };
    } else if (query.status === "answered") {
      where.isResolved = false;
      where.answers = { some: { status: "PUBLISHED" } };
    } else if (query.status === "resolved") {
      where.isResolved = true;
    }

    const questions = await this.prisma.question.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      take: safeLimit + 1,
      select: this.questionSelect,
    });

    const nextCursor = questions.length > safeLimit ? questions[safeLimit].id : null;
    return {
      items: questions.slice(0, safeLimit).map((question: (typeof questions)[number]) => this.mapQuestion(question, viewerUserId, viewerRole)),
      nextCursor,
    };
  }


  async findOne(id: number, viewerUserId?: number, viewerRole?: string) {
    const question = await this.prisma.question.findFirst({
      where: { id, status: "PUBLISHED" },
      select: this.questionSelect,
    });

    if (!question) throw new NotFoundException("Pregunta no encontrada.");

    return this.mapQuestion(question, viewerUserId, viewerRole);
  }

  async create(dto: CreateQuestionDto, userId: number) {
    this.checkRateLimit(this.questionRateLimit, userId, 5, 60_000, "Estás publicando preguntas demasiado rápido. Espera un minuto.");

    if (dto.communityId !== undefined) {
      const community = await this.prisma.community.findUnique({ where: { id: dto.communityId }, select: { id: true } });
      if (!community) throw new BadRequestException("La comunidad seleccionada no existe.");
    }

    const created = await this.prisma.question.create({
      data: {
        title: dto.title.trim(),
        content: dto.content.trim(),
        communityId: dto.communityId,
        userId,
        images: dto.images?.length
          ? {
              create: dto.images.slice(0, 4).map((image, index) => ({
                imageUrl: image.imageUrl,
                storageKey: image.storageKey,
                mimeType: image.mimeType,
                sizeBytes: image.sizeBytes,
                position: index,
              })),
            }
          : undefined,
      },
      select: this.questionSelect,
    });

    return this.mapQuestion(created, userId);
  }

  async uploadImage(file: any) {
    return this.saveUploadedImage(file, "question", "questions", "/api/questions/images");
  }

  async uploadAnswerImage(file: any) {
    return this.saveUploadedImage(file, "answer", "answers", "/api/questions/answers/images");
  }

  private async saveUploadedImage(file: any, prefix: string, folder: string, publicPath: string) {
    const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
    const maxSizeBytes = 3 * 1024 * 1024;
    if (!file) throw new BadRequestException("Debes adjuntar una imagen.");
    if (!allowedTypes.has(file.mimetype)) throw new BadRequestException("Formato no permitido. Solo JPG, PNG o WEBP.");
    if (file.size > maxSizeBytes) throw new BadRequestException("La imagen supera el límite de 3MB.");
    const extension = file.originalname.split(".").pop()?.toLowerCase() || "jpg";
    const filename = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
    const storageKey = `${folder}/${filename}`;
    const targetDir = `${process.cwd()}/tmp/uploads/${folder}`;
    await import("node:fs/promises").then((fs) => fs.mkdir(targetDir, { recursive: true }));
    await import("node:fs/promises").then((fs) => fs.writeFile(`${targetDir}/${filename}`, file.buffer));
    return { imageUrl: `${publicPath}/${filename}`, storageKey, mimeType: file.mimetype, sizeBytes: file.size };
  }

  async markAnswerUseful(questionId: number, answerId: number, userId: number, role: string) {
    const question = await this.prisma.question.findFirst({ where: { id: questionId, status: "PUBLISHED" }, select: { id: true, userId: true } });
    if (!question) throw new NotFoundException("Pregunta no encontrada.");
    if (question.userId !== userId && role !== "ADMIN" && role !== "MODERATOR") throw new ForbiddenException("Solo el autor de la pregunta puede marcar una respuesta como útil.");
    const answer = await this.prisma.answer.findFirst({ where: { id: answerId, questionId, status: "PUBLISHED" }, select: { id: true, isUseful: true } });
    if (!answer) throw new NotFoundException("Respuesta no encontrada.");
    if (answer.isUseful) {
      const updated = await this.prisma.answer.update({ where: { id: answerId }, data: { isUseful: false }, select: this.answerSelect });
      const remainingUseful = await this.prisma.answer.count({ where: { questionId, status: "PUBLISHED", isUseful: true } });
      await this.prisma.question.update({ where: { id: questionId }, data: { isResolved: remainingUseful > 0 } });
      return this.mapAnswer(updated);
    }
    await this.prisma.answer.updateMany({ where: { questionId }, data: { isUseful: false } });
    const updated = await this.prisma.answer.update({ where: { id: answerId }, data: { isUseful: true }, select: this.answerSelect });
    await this.prisma.question.update({ where: { id: questionId }, data: { isResolved: true } });
    return this.mapAnswer(updated);
  }


  async voteAnswer(questionId: number, answerId: number, value: -1 | 0 | 1, userId: number) {
    const answer = await this.prisma.answer.findFirst({ where: { id: answerId, questionId, status: "PUBLISHED" }, select: { id: true } });
    if (!answer) throw new NotFoundException("Respuesta no encontrada.");

    if (value === 0) {
      await this.prisma.answerVote.deleteMany({ where: { answerId, userId } });
    } else {
      await this.prisma.answerVote.upsert({
        where: { answerId_userId: { answerId, userId } },
        create: { answerId, userId, value },
        update: { value },
      });
    }

    const updated = await this.prisma.answer.findUnique({ where: { id: answerId }, select: this.answerSelect });
    if (!updated) throw new NotFoundException("Respuesta no encontrada.");
    return this.mapAnswer(updated);
  }

  async createAnswer(questionId: number, dto: CreateAnswerDto, userId: number) {
    this.checkRateLimit(this.answerRateLimit, userId, 10, 60_000, "Estás respondiendo demasiado rápido. Espera un minuto.");

    const question = await this.prisma.question.findFirst({ where: { id: questionId, status: "PUBLISHED" }, select: { id: true } });
    if (!question) throw new NotFoundException("Pregunta no encontrada.");

    const answer = await this.prisma.answer.create({
      data: {
        questionId,
        userId,
        content: dto.content.trim(),
        images: dto.images?.length
          ? {
              create: dto.images.slice(0, 4).map((image, index) => ({
                imageUrl: image.imageUrl,
                storageKey: image.storageKey,
                mimeType: image.mimeType,
                sizeBytes: image.sizeBytes,
                position: index,
              })),
            }
          : undefined,
      },
      select: this.answerSelect,
    });

    return this.mapAnswer(answer);
  }

  async update(id: number, dto: UpdateQuestionDto, userId: number, role: string) {
    const question = await this.prisma.question.findFirst({ where: { id, status: "PUBLISHED" }, select: { id: true, userId: true } });
    if (!question) throw new NotFoundException("Pregunta no encontrada.");
    const isAuthor = question.userId === userId;
    const isAdmin = role === "ADMIN";
    if (!isAuthor && !isAdmin) throw new ForbiddenException("No tienes permisos para editar esta pregunta.");

    if (dto.communityId !== undefined) {
      const community = await this.prisma.community.findUnique({ where: { id: dto.communityId }, select: { id: true } });
      if (!community) throw new BadRequestException("La comunidad seleccionada no existe.");
    }

    const updated = await this.prisma.question.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.content !== undefined ? { content: dto.content.trim() } : {}),
        ...(dto.communityId !== undefined ? { communityId: dto.communityId } : {}),
      },
      select: this.questionSelect,
    });

    return this.mapQuestion(updated, userId, role);
  }

  async remove(id: number, userId: number, role: string) {
    const question = await this.prisma.question.findFirst({ where: { id, status: "PUBLISHED" }, select: { id: true, userId: true } });
    if (!question) throw new NotFoundException("Pregunta no encontrada.");
    const isAuthor = question.userId === userId;
    const isAdmin = role === "ADMIN";
    if (!isAuthor && !isAdmin) throw new ForbiddenException("No tienes permisos para eliminar esta pregunta.");

    await this.prisma.question.update({ where: { id }, data: { status: "DELETED" } });
    return { message: "Pregunta eliminada correctamente." };
  }

  private checkRateLimit(bucket: Map<number, number[]>, userId: number, maxEvents: number, windowMs: number, message: string): void {
    const now = Date.now();
    const windowStart = now - windowMs;
    const timestamps = (bucket.get(userId) ?? []).filter((ts) => ts >= windowStart);
    if (timestamps.length >= maxEvents) throw new HttpException(message, HttpStatus.TOO_MANY_REQUESTS);
    timestamps.push(now);
    bucket.set(userId, timestamps);
  }
}

