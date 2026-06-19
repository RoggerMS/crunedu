import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { DocumentVisibility, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateDocumentDto, DocumentVisibilityDto } from "./dto/create-document.dto";
import { GetDocumentsQueryDto } from "./dto/get-documents-query.dto";
import { RateDocumentDto } from "./dto/rate-document.dto";
import { UpdateDocumentDto } from "./dto/update-document.dto";
import { UploadDocumentFileResponseDto } from "./dto/upload-document-file-response.dto";
import {
  DOCUMENT_PUBLIC_PATH,
  DOCUMENT_UPLOAD_FOLDER,
  findUploadRule,
} from "./documents.constants";
import { PAGINATION_LIMITS } from "../common/pagination.constants";

type Author = { id: number; email: string; profile: { firstName: string | null; lastName: string | null } | null };

type DocumentRow = {
  id: number;
  title: string;
  description: string | null;
  course: string;
  cycle: string | null;
  materialType: string | null;
  fileUrl: string;
  storageKey: string;
  fileType: string;
  mimeType: string | null;
  originalName: string | null;
  sizeBytes: number;
  visibility: DocumentVisibility;
  status: string;
  downloadsCount: number;
  viewsCount: number;
  createdAt: Date;
  updatedAt: Date;
  userId: number;
  communityId: number | null;
  community: { id: number; name: string; slug: string } | null;
  user: Author;
  tags: Array<{ tag: { id: number; name: string; slug: string } }>;
  savedBy: Array<{ userId: number }>;
  ratings: Array<{ userId: number; value: number }>;
  _count: { savedBy: number; ratings: number };
};

const documentSelect = {
  id: true,
  title: true,
  description: true,
  course: true,
  cycle: true,
  materialType: true,
  fileUrl: true,
  storageKey: true,
  fileType: true,
  mimeType: true,
  originalName: true,
  sizeBytes: true,
  visibility: true,
  status: true,
  downloadsCount: true,
  viewsCount: true,
  createdAt: true,
  updatedAt: true,
  userId: true,
  communityId: true,
  community: { select: { id: true, name: true, slug: true } },
  user: { select: { id: true, email: true, profile: { select: { firstName: true, lastName: true } } } },
  tags: { select: { tag: { select: { id: true, name: true, slug: true } } } },
  savedBy: { select: { userId: true } },
  ratings: { select: { userId: true, value: true } },
  _count: { select: { savedBy: true, ratings: true } },
} as const;

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly documentRateLimit = new Map<number, number[]>();
  private readonly uploadCache = new Map<string, { data: { fileUrl: string; storageKey: string; fileType: string; mimeType: string; sizeBytes: number; originalName: string }; expiresAt: number }>();

  async index(query: GetDocumentsQueryDto, viewerUserId?: number, viewerRole?: string) {
    const limit = query.limit ?? PAGINATION_LIMITS.questions.default;
    const safeLimit = Math.min(limit, PAGINATION_LIMITS.questions.max);
    const wantsMine = query.mine === "true";
    const wantsSaved = query.saved === "true";

    if ((wantsMine || wantsSaved) && !viewerUserId) {
      return { items: [], nextCursor: null };
    }

    const memberCommunityIds = viewerUserId ? await this.getViewerCommunityIds(viewerUserId) : [];
    const isAdmin = viewerRole === "ADMIN" || viewerRole === "MODERATOR";

    const where: Prisma.DocumentWhereInput = { status: "PUBLISHED" };

    if (query.communityId) where.communityId = query.communityId;
    if (query.course) where.course = { equals: query.course.trim(), mode: "insensitive" };
    if (query.materialType) where.materialType = { equals: query.materialType.trim(), mode: "insensitive" };
    if (query.fileType) where.fileType = { equals: query.fileType.trim().toLowerCase() };
    if (query.visibility) where.visibility = query.visibility.toUpperCase() as DocumentVisibility;
    if (query.q) {
      where.OR = [
        { title: { contains: query.q.trim(), mode: "insensitive" } },
        { description: { contains: query.q.trim(), mode: "insensitive" } },
        { course: { contains: query.q.trim(), mode: "insensitive" } },
      ];
    }

    if (wantsMine) {
      where.userId = viewerUserId;
    } else if (wantsSaved) {
      where.savedBy = { some: { userId: viewerUserId } };
      if (!isAdmin) this.applyVisibilityScoping(where, viewerUserId, memberCommunityIds);
    } else if (!isAdmin) {
      this.applyVisibilityScoping(where, viewerUserId, memberCommunityIds);
    }

    const sort = query.sort ?? "recent";

    if (sort === "most_saved" || sort === "best_rated") {
      const rows = await this.prisma.document.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 60,
        select: documentSelect,
      });
      const scored = rows
        .map((row) => ({ row, score: this.ratingAverage(row) }))
        .sort((a, b) => (sort === "best_rated" ? b.score - a.score : this.savesCount(b.row) - this.savesCount(a.row)));
      const page = scored.slice(0, safeLimit).map((item) => this.mapDocument(item.row, viewerUserId));
      return { items: page, nextCursor: null };
    }

    const orderBy: Prisma.DocumentOrderByWithRelationInput[] =
      sort === "most_downloaded"
        ? [{ downloadsCount: "desc" }, { id: "desc" }]
        : [{ createdAt: "desc" }, { id: "desc" }];

    const rows = await this.prisma.document.findMany({
      where,
      orderBy,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      take: safeLimit + 1,
      select: documentSelect,
    });

    const nextCursor = rows.length > safeLimit ? rows[safeLimit].id : null;
    return {
      items: rows.slice(0, safeLimit).map((row) => this.mapDocument(row, viewerUserId)),
      nextCursor,
    };
  }

  async findOne(id: number, viewerUserId?: number, viewerRole?: string) {
    const row = await this.prisma.document.findUnique({ where: { id }, select: documentSelect });
    if (!row || row.status !== "PUBLISHED") throw new NotFoundException("Apunte no encontrado.");

    const memberCommunityIds = viewerUserId ? await this.getViewerCommunityIds(viewerUserId) : [];
    if (!this.canViewerSee(row, viewerUserId, viewerRole, memberCommunityIds)) {
      throw new NotFoundException("Apunte no encontrado.");
    }

    await this.prisma.document.update({ where: { id }, data: { viewsCount: { increment: 1 } } }).catch(() => undefined);

    return this.mapDocument(row, viewerUserId, viewerRole);
  }

  async uploadFile(file: any): Promise<UploadDocumentFileResponseDto> {
    if (!file) throw new BadRequestException("Debes adjuntar un archivo.");
    const originalName = String(file.originalname ?? "archivo");
    const mimeType = String(file.mimetype ?? "");

    const rule = findUploadRule(originalName, mimeType);
    if (!rule) throw new BadRequestException("Formato no permitido. Verifica los tipos aceptados.");
    if (file.size > rule.maxBytes) {
      const maxMb = Math.round(rule.maxBytes / (1024 * 1024));
      throw new BadRequestException(`El archivo supera el límite de ${maxMb}MB para ${rule.category.toUpperCase()}.`);
    }

    const extension = originalName.split(".").pop()?.toLowerCase() ?? rule.extensions[0];
    const filename = `doc-${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${extension}`;
    const storageKey = `${DOCUMENT_UPLOAD_FOLDER}/${filename}`;
    const targetDir = `${process.cwd()}/tmp/uploads/${DOCUMENT_UPLOAD_FOLDER}`;
    const fs = await import("node:fs/promises");
    await fs.mkdir(targetDir, { recursive: true });
    await fs.writeFile(`${targetDir}/${filename}`, file.buffer);

    const result = {
      fileUrl: `${DOCUMENT_PUBLIC_PATH}/${filename}`,
      storageKey,
      fileType: rule.category,
      mimeType: mimeType || "application/octet-stream",
      sizeBytes: file.size,
      originalName,
    };

    this.uploadCache.set(storageKey, { data: result, expiresAt: Date.now() + 30 * 60 * 1000 });
    this.cleanupUploadCache();

    return result;
  }

  async create(dto: CreateDocumentDto, userId: number) {
    this.checkRateLimit(this.documentRateLimit, userId, 5, 60_000, "Estás publicando apuntes demasiado rápido. Espera un minuto.");

    const title = dto.title.trim();
    if (!title) throw new BadRequestException("Agrega un título.");

    let communityId: number | undefined;
    if (dto.visibility === DocumentVisibilityDto.COMMUNITY) {
      if (!dto.communityId) throw new BadRequestException("Selecciona una comunidad para publicar solo en comunidad.");
      const community = await this.prisma.community.findUnique({ where: { id: dto.communityId }, select: { id: true } });
      if (!community) throw new BadRequestException("La comunidad seleccionada no existe.");
      communityId = dto.communityId;
    } else if (dto.visibility === DocumentVisibilityDto.PRIVATE) {
      communityId = undefined;
    } else if (dto.communityId) {
      const community = await this.prisma.community.findUnique({ where: { id: dto.communityId }, select: { id: true } });
      if (!community) throw new BadRequestException("La comunidad seleccionada no existe.");
      communityId = dto.communityId;
    }

    const uploaded = dto.uploadedFile;
    if (!uploaded?.fileUrl || !uploaded?.storageKey) {
      throw new BadRequestException("Selecciona un archivo.");
    }

    const cached = this.uploadCache.get(uploaded.storageKey);
    if (!cached || cached.expiresAt < Date.now()) {
      throw new BadRequestException("El archivo subido ha expirado. Vuelve a subirlo.");
    }
    if (cached.data.sizeBytes !== uploaded.sizeBytes) {
      throw new BadRequestException("La metadata del archivo no coincide. Vuelve a subirlo.");
    }
    const verified = cached.data;

    const tagsInput = (dto.tags ?? []).map((tag) => tag.trim()).filter(Boolean).slice(0, 8);
    const tagRecords = tagsInput.length
      ? await Promise.all(
          tagsInput.map((name) =>
            this.prisma.tag.upsert({
              where: { slug: this.toSlug(name) },
              create: { name, slug: this.toSlug(name) },
              update: {},
              select: { id: true },
            }),
          ),
        )
      : [];

    const visibility = dto.visibility.toUpperCase() as DocumentVisibility;

    const created = await this.prisma.$transaction(async (tx) => {
      const doc = await tx.document.create({
        data: {
          title,
          description: dto.description?.trim() || null,
          course: dto.course?.trim() || "",
          cycle: dto.cycle?.trim() || null,
          materialType: dto.materialType?.trim() || null,
          fileUrl: verified.fileUrl,
          storageKey: verified.storageKey,
          fileType: verified.fileType,
          sizeBytes: verified.sizeBytes,
          mimeType: verified.mimeType ?? null,
          originalName: verified.originalName ?? null,
          visibility,
          communityId: communityId ?? null,
          userId,
          tags: tagRecords.length ? { create: tagRecords.map((tag) => ({ tagId: tag.id })) } : undefined,
        },
        select: documentSelect,
      });

      if (communityId && visibility !== "PRIVATE") {
        await tx.post.create({
          data: {
            userId,
            communityId,
            documentId: doc.id,
            title: "",
            content: `Compartió un apunte: ${title}`,
          },
        });
      }

      return doc;
    });

    return this.mapDocument(created, userId);
  }

  async update(id: number, dto: UpdateDocumentDto, userId: number, role: string) {
    const existing = await this.prisma.document.findUnique({ where: { id }, select: { id: true, userId: true, status: true, communityId: true, visibility: true, title: true } });
    if (!existing || existing.status !== "PUBLISHED") throw new NotFoundException("Apunte no encontrado.");
    const isAuthor = existing.userId === userId;
    const isAdmin = role === "ADMIN";
    if (!isAuthor && !isAdmin) throw new ForbiddenException("No tienes permisos para editar este apunte.");

    let communityId: number | null | undefined;
    const newVisibility = dto.visibility !== undefined ? (dto.visibility.toUpperCase() as DocumentVisibility) : existing.visibility;
    if (dto.visibility !== undefined) {
      if (dto.visibility === DocumentVisibilityDto.COMMUNITY) {
        if (!dto.communityId && !existing.communityId) {
          throw new BadRequestException("Selecciona una comunidad para publicar solo en comunidad.");
        }
        if (dto.communityId) {
          const community = await this.prisma.community.findUnique({ where: { id: dto.communityId }, select: { id: true } });
          if (!community) throw new BadRequestException("La comunidad seleccionada no existe.");
        }
        communityId = dto.communityId ?? existing.communityId;
      } else if (dto.visibility === DocumentVisibilityDto.PRIVATE) {
        communityId = null;
      }
    } else if (dto.communityId !== undefined) {
      const community = await this.prisma.community.findUnique({ where: { id: dto.communityId }, select: { id: true } });
      if (!community) throw new BadRequestException("La comunidad seleccionada no existe.");
      communityId = dto.communityId;
    }

    const tagsInput = dto.tags ? dto.tags.map((tag) => tag.trim()).filter(Boolean).slice(0, 8) : undefined;
    let tagRecords: { id: number }[] | undefined;
    if (tagsInput) {
      tagRecords = await Promise.all(
        tagsInput.map((name) =>
          this.prisma.tag.upsert({
            where: { slug: this.toSlug(name) },
            create: { name, slug: this.toSlug(name) },
            update: {},
            select: { id: true },
          }),
        ),
      );
    }

    const finalCommunityId = communityId !== undefined ? communityId : existing.communityId;
    const title = dto.title !== undefined ? dto.title.trim() : existing.title;
    const visibilityChangedFromPrivate = dto.visibility !== undefined && existing.visibility === "PRIVATE" && newVisibility !== "PRIVATE";
    const visibilityChangedToCommunity = dto.visibility !== undefined && existing.visibility === "PUBLIC" && newVisibility === "COMMUNITY";
    const communityAdded = dto.communityId !== undefined && !existing.communityId && newVisibility !== "PRIVATE";
    const shouldCreatePost = finalCommunityId != null && newVisibility !== "PRIVATE" && (visibilityChangedFromPrivate || visibilityChangedToCommunity || communityAdded);

    const updated = await this.prisma.$transaction(async (tx) => {
      const doc = await tx.document.update({
        where: { id },
        data: {
          ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
          ...(dto.description !== undefined ? { description: dto.description.trim() || null } : {}),
          ...(dto.course !== undefined ? { course: dto.course.trim() } : {}),
          ...(dto.cycle !== undefined ? { cycle: dto.cycle.trim() || null } : {}),
          ...(dto.materialType !== undefined ? { materialType: dto.materialType.trim() || null } : {}),
          ...(dto.visibility !== undefined ? { visibility: dto.visibility.toUpperCase() as DocumentVisibility } : {}),
          ...(communityId !== undefined ? { communityId } : {}),
          ...(tagRecords ? { tags: { deleteMany: {}, create: tagRecords.map((tag) => ({ tagId: tag.id })) } } : {}),
        },
        select: documentSelect,
      });

      if (shouldCreatePost && finalCommunityId != null) {
        const existingPost = await tx.post.findFirst({ where: { documentId: id, communityId: finalCommunityId }, select: { id: true } });
        if (!existingPost) {
          await tx.post.create({
            data: {
              userId,
              communityId: finalCommunityId,
              documentId: id,
              title: "",
              content: `Compartió un apunte: ${title}`,
            },
          });
        }
      }

      return doc;
    });

    return this.mapDocument(updated, userId, role);
  }

  async remove(id: number, userId: number, role: string) {
    const existing = await this.prisma.document.findUnique({ where: { id }, select: { id: true, userId: true, status: true } });
    if (!existing || existing.status !== "PUBLISHED") throw new NotFoundException("Apunte no encontrado.");
    const isAuthor = existing.userId === userId;
    const isAdmin = role === "ADMIN";
    if (!isAuthor && !isAdmin) throw new ForbiddenException("No tienes permisos para eliminar este apunte.");

    await this.prisma.document.update({ where: { id }, data: { status: "DELETED" } });
    return { message: "Apunte eliminado correctamente." };
  }

  async getDownload(id: number, viewerUserId?: number, viewerRole?: string) {
    const row = await this.prisma.document.findUnique({ where: { id }, select: documentSelect });
    if (!row || row.status !== "PUBLISHED") throw new NotFoundException("Apunte no encontrado.");
    const memberCommunityIds = viewerUserId ? await this.getViewerCommunityIds(viewerUserId) : [];
    if (!this.canViewerSee(row, viewerUserId, viewerRole, memberCommunityIds)) {
      throw new NotFoundException("Apunte no encontrado.");
    }

    await this.prisma.document.update({ where: { id }, data: { downloadsCount: { increment: 1 } } });

    const filename = row.storageKey.split("/").pop() ?? "";
    const filePath = `${process.cwd()}/tmp/uploads/${DOCUMENT_UPLOAD_FOLDER}/${filename}`;
    return {
      filePath,
      originalName: row.originalName ?? filename,
      mimeType: row.mimeType ?? "application/octet-stream",
      fileType: row.fileType,
    };
  }

  async save(id: number, userId: number) {
    const row = await this.prisma.document.findUnique({ where: { id }, select: documentSelect });
    if (!row || row.status !== "PUBLISHED") throw new NotFoundException("Apunte no encontrado.");
    const memberCommunityIds = await this.getViewerCommunityIds(userId);
    if (!this.canViewerSee(row, userId, undefined, memberCommunityIds)) throw new NotFoundException("Apunte no encontrado.");
    await this.prisma.savedDocument.upsert({
      where: { documentId_userId: { documentId: id, userId } },
      create: { documentId: id, userId },
      update: {},
    });
    return { saved: true };
  }

  async unsave(id: number, userId: number) {
    const row = await this.prisma.document.findUnique({ where: { id }, select: { id: true, status: true } });
    if (!row || row.status !== "PUBLISHED") throw new NotFoundException("Apunte no encontrado.");
    await this.prisma.savedDocument.deleteMany({ where: { documentId: id, userId } });
    return { saved: false };
  }

  async rate(id: number, dto: RateDocumentDto, userId: number) {
    const row = await this.prisma.document.findUnique({ where: { id }, select: documentSelect });
    if (!row || row.status !== "PUBLISHED") throw new NotFoundException("Apunte no encontrado.");
    const memberCommunityIds = await this.getViewerCommunityIds(userId);
    if (!this.canViewerSee(row, userId, undefined, memberCommunityIds)) throw new NotFoundException("Apunte no encontrado.");
    await this.prisma.documentRating.upsert({
      where: { documentId_userId: { documentId: id, userId } },
      create: { documentId: id, userId, value: dto.value },
      update: { value: dto.value },
    });
    const updatedRow = await this.prisma.document.findUnique({ where: { id }, select: documentSelect });
    if (!updatedRow) throw new NotFoundException("Apunte no encontrado.");
    return {
      average: this.ratingAverage(updatedRow),
      count: updatedRow._count.ratings,
      viewerRating: dto.value,
    };
  }

  async topContributors() {
    const docs = await this.prisma.document.findMany({
      where: { status: "PUBLISHED", visibility: "PUBLIC" },
      select: { userId: true },
    });

    const counts = new Map<number, number>();
    for (const doc of docs) counts.set(doc.userId, (counts.get(doc.userId) ?? 0) + 1);
    const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

    if (!top.length) return [];

    const users = await this.prisma.user.findMany({
      where: { id: { in: top.map((entry) => entry[0]) } },
      select: { id: true, profile: { select: { firstName: true, lastName: true } } },
    });

    return top.map(([userId, publicNotes]) => {
      const user = users.find((entry) => entry.id === userId);
      const name = [user?.profile?.firstName, user?.profile?.lastName].filter(Boolean).join(" ") || "Estudiante CrunEdu";
      return { userId, name, publicNotes };
    });
  }

  private applyVisibilityScoping(where: Prisma.DocumentWhereInput, viewerUserId: number | undefined, memberCommunityIds: number[]) {
    const access: Prisma.DocumentWhereInput = viewerUserId
      ? {
          OR: [
            { visibility: "PUBLIC" },
            { visibility: "COMMUNITY", communityId: { in: memberCommunityIds } },
            { visibility: "PRIVATE", userId: viewerUserId },
          ],
        }
      : { visibility: "PUBLIC" };
    const existingAnd = where.AND ? (Array.isArray(where.AND) ? where.AND : [where.AND]) : [];
    where.AND = [...existingAnd, access];
  }

  private canViewerSee(row: DocumentRow, viewerUserId?: number, viewerRole?: string, memberCommunityIds: number[] = []): boolean {
    if (row.status !== "PUBLISHED") return row.userId === viewerUserId || viewerRole === "ADMIN" || viewerRole === "MODERATOR";
    if (viewerRole === "ADMIN" || viewerRole === "MODERATOR") return true;
    if (row.userId === viewerUserId) return true;
    if (row.visibility === "PUBLIC") return true;
    if (row.visibility === "COMMUNITY") return row.communityId != null && memberCommunityIds.includes(row.communityId);
    return false;
  }

  private async getViewerCommunityIds(userId: number): Promise<number[]> {
    const memberships = await this.prisma.communityMember.findMany({ where: { userId }, select: { communityId: true } });
    return memberships.map((item) => item.communityId);
  }

  private async ensurePublished(id: number) {
    const doc = await this.prisma.document.findUnique({ where: { id }, select: { id: true, status: true } });
    if (!doc || doc.status !== "PUBLISHED") throw new NotFoundException("Apunte no encontrado.");
  }

  private checkRateLimit(bucket: Map<number, number[]>, userId: number, maxEvents: number, windowMs: number, message: string): void {
    const now = Date.now();
    const windowStart = now - windowMs;
    const timestamps = (bucket.get(userId) ?? []).filter((ts) => ts >= windowStart);
    if (timestamps.length >= maxEvents) {
      throw new HttpException(message, HttpStatus.TOO_MANY_REQUESTS);
    }
    timestamps.push(now);
    bucket.set(userId, timestamps);
  }

  private cleanupUploadCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.uploadCache) {
      if (entry.expiresAt < now) this.uploadCache.delete(key);
    }
  }

  private ratingAverage(row: DocumentRow): number {
    if (!row.ratings.length) return 0;
    const sum = row.ratings.reduce((acc, rating) => acc + rating.value, 0);
    return Math.round((sum / row.ratings.length) * 10) / 10;
  }

  private savesCount(row: DocumentRow): number {
    return row._count.savedBy;
  }

  private mapDocument(row: DocumentRow, viewerUserId?: number, viewerRole?: string | undefined) {
    const isMine = viewerUserId != null && row.userId === viewerUserId;
    const canEdit = isMine;
    const canDelete = isMine || viewerRole === "ADMIN";
    const canReport = viewerUserId != null && !isMine;
    const viewerRating = viewerUserId != null ? row.ratings.find((rating) => rating.userId === viewerUserId)?.value ?? null : null;
    const viewerSaved = viewerUserId != null && row.savedBy.some((entry) => entry.userId === viewerUserId);

    return {
      id: row.id,
      title: row.title,
      description: row.description,
      course: row.course || null,
      cycle: row.cycle,
      materialType: row.materialType,
      fileType: row.fileType,
      mimeType: row.mimeType,
      originalName: row.originalName,
      sizeBytes: row.sizeBytes,
      fileUrl: row.fileUrl,
      downloadUrl: `/api/apuntes/${row.id}/download`,
      visibility: row.visibility.toLowerCase(),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      author: {
        id: row.user.id,
        name: [row.user.profile?.firstName, row.user.profile?.lastName].filter(Boolean).join(" ") || row.user.email,
      },
      community: row.community,
      tags: row.tags.map((entry) => entry.tag.name),
      stats: {
        downloads: row.downloadsCount,
        saves: row._count.savedBy,
        views: row.viewsCount,
      },
      rating: {
        average: this.ratingAverage(row),
        count: row._count.ratings,
        viewerRating,
      },
      viewerState: {
        saved: viewerSaved,
        isMine,
        canEdit,
        canDelete,
        canReport,
      },
    };
  }

  private toSlug(name: string): string {
    return name
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 50) || `tag-${Date.now()}`;
  }
}
