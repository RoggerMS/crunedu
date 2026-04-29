import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateAnswerDto } from "./dto/create-answer.dto";
import { CreateQuestionDto } from "./dto/create-question.dto";

@Injectable()
export class QuestionsService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly answerSelect = {
    id: true,
    content: true,
    createdAt: true,
    user: {
      select: {
        id: true,
        email: true,
        profile: { select: { firstName: true, lastName: true } },
      },
    },
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
      orderBy: { createdAt: "asc" },
      select: this.answerSelect,
    },
    _count: { select: { answers: { where: { status: "PUBLISHED" } } } },
  } as const;

  private mapAnswer(answer: { id: number; content: string; createdAt: Date; user: { id: number; email: string; profile: { firstName: string | null; lastName: string | null } | null } }) {
    return {
      id: answer.id,
      content: answer.content,
      createdAt: answer.createdAt,
      author: {
        id: answer.user.id,
        email: answer.user.email,
        firstName: answer.user.profile?.firstName ?? null,
        lastName: answer.user.profile?.lastName ?? null,
      },
    };
  }

  private mapQuestion(question: any) {
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
      answersCount: question._count.answers,
      answers: question.answers.map((answer: any) => this.mapAnswer(answer)),
    };
  }

  async index() {
    const questions = await this.prisma.question.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { createdAt: "desc" },
      select: this.questionSelect,
    });

    return questions.map((question: (typeof questions)[number]) => this.mapQuestion(question));
  }

  async create(dto: CreateQuestionDto, userId: number) {
    if (dto.communityId !== undefined) {
      const community = await this.prisma.community.findUnique({ where: { id: dto.communityId }, select: { id: true } });
      if (!community) throw new BadRequestException("La comunidad seleccionada no existe.");
    }

    const created = await this.prisma.question.create({
      data: { title: dto.title.trim(), content: dto.content.trim(), communityId: dto.communityId, userId },
      select: this.questionSelect,
    });

    return this.mapQuestion(created);
  }

  async createAnswer(questionId: number, dto: CreateAnswerDto, userId: number) {
    const question = await this.prisma.question.findFirst({ where: { id: questionId, status: "PUBLISHED" }, select: { id: true } });
    if (!question) throw new NotFoundException("Pregunta no encontrada.");

    const answer = await this.prisma.answer.create({
      data: { questionId, userId, content: dto.content.trim() },
      select: this.answerSelect,
    });

    return this.mapAnswer(answer);
  }
}
