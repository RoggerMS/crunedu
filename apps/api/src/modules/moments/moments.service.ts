import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { createReadStream } from "node:fs";
import { access, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { PrismaService } from "../prisma/prisma.service";
import { HotReadCacheService } from "../cache/hot-read-cache.service";
import { PAGINATION_LIMITS } from "../common/pagination.constants";
import {
  CreateMomentDto,
  UpdateMomentDto,
  GetMomentsQueryDto,
  GetGalleryQueryDto,
  GetSavedMomentsQueryDto,
  GetTrendsQueryDto,
} from "./dto";
import { CreateMomentCommentDto } from "./dto/create-moment-comment.dto";
import {
  MomentResponseDto,
  MomentCommentResponseDto,
  MomentNewsSummaryDto,
  MomentTrendDto,
  MomentTopicDto,
  MomentRow,
  MomentCommentRow,
  mapMoment,
  mapComment,
  slugifyTag,
  computeMomentStatus,
} from "./moments.types";

const MAX_TITLE = 140;
const MAX_DESCRIPTION = 1000;
const MAX_COMMENT = 1000;
const MAX_TAGS = 8;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const ALLOWED_VIDEO_TYPES = new Set(["video/mp4", "video/webm"]);
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_VIDEO_SIZE = 25 * 1024 * 1024;

const momentSelect = {
  id: true,
  title: true,
  description: true,
  type: true,
  location: true,
  status: true,
  expiresAt: true,
  shareCount: true,
  viewCount: true,
  deletedAt: true,
  createdAt: true,
  updatedAt: true,
  userId: true,
  user: {
    select: {
      id: true,
      email: true,
      role: true,
      profile: { select: { firstName: true, lastName: true, avatarUrl: true } },
    },
  },
  media: {
    select: { id: true, imageUrl: true, mimeType: true, sizeBytes: true, position: true },
    orderBy: { position: "asc" as const },
  },
  tags: { select: { tag: { select: { name: true, slug: true } } } },
  _count: {
    select: {
      boosts: true,
      confirmations: true,
      comments: { where: { status: "PUBLISHED" as const } },
      savedBy: true,
    },
  },
} satisfies Prisma.MomentSelect;

const commentSelect = {
  id: true,
  content: true,
  createdAt: true,
  updatedAt: true,
  userId: true,
  user: {
    select: {
      id: true,
      email: true,
      profile: { select: { firstName: true, lastName: true, avatarUrl: true } },
    },
  },
} satisfies Prisma.MomentCommentSelect;

type ViewerStateRow = { momentId: number; userId: number; boosted: boolean; saved: boolean; confirmed: boolean };

@Injectable()
export class MomentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: HotReadCacheService,
  ) {}

  private readonly createRateLimit = new Map<number, number[]>();
  private readonly commentRateLimit = new Map<number, number[]>();
  private readonly boostRateLimit = new Map<number, number[]>();
  private readonly mediaRateLimit = new Map<number, number[]>();

  private checkRateLimit(bucket: Map<number, number[]>, userId: number, maxEvents: number, windowMs: number, message: string): void {
    const now = Date.now();
    const windowStart = now - windowMs;
    const timestamps = (bucket.get(userId) ?? []).filter((ts) => ts >= windowStart);
    if (timestamps.length >= maxEvents) throw new HttpException(message, HttpStatus.TOO_MANY_REQUESTS);
    timestamps.push(now);
    bucket.set(userId, timestamps);
  }

  // --- LIST ---
  async list(query: GetMomentsQueryDto, viewerUserId?: number): Promise<{ items: MomentResponseDto[]; nextCursor: number | null }> {
    const limit = Math.min(query.limit ?? PAGINATION_LIMITS.momentsFeed.default, PAGINATION_LIMITS.momentsFeed.max);
    const sort = query.sort ?? "recent";
    const now = new Date();

    const where: Prisma.MomentWhereInput = {
      status: "PUBLISHED",
      deletedAt: null,
      expiresAt: { gt: now },
    };
    if (query.q) {
      const search = query.q.trim();
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
      ];
    }
    if (query.type) where.type = query.type;
    if (query.location) where.location = { contains: query.location, mode: "insensitive" };
    if (query.tag) where.tags = { some: { tag: { slug: slugifyTag(query.tag) } } };
    if (query.withMedia) where.media = { some: {} };

    const take = sort === "relevant" ? 100 : limit + 1;
    const rows = await this.prisma.moment.findMany({
      where,
      select: momentSelect,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      take,
    });

    let ordered = rows;
    if (sort === "relevant") {
      const nowMs = Date.now();
      ordered = [...rows].sort((a, b) => this.relevanceScore(b, nowMs) - this.relevanceScore(a, nowMs));
    }

    const sliced = ordered.slice(0, limit);
    const nextCursor = ordered.length > limit ? sliced[sliced.length - 1]?.id ?? null : null;

    const viewerStates = await this.fetchViewerStates(sliced.map((r) => r.id), viewerUserId);
    const items = sliced.map((row) => mapMoment(row as unknown as MomentRow, viewerStates.get(row.id) ?? null));

    return { items, nextCursor };
  }

  // --- DETAIL ---
  async findOne(id: number, viewerUserId?: number): Promise<MomentResponseDto & { recentComments: MomentCommentResponseDto[] }> {
    const moment = await this.prisma.moment.findFirst({
      where: { id, status: "PUBLISHED", deletedAt: null },
      select: momentSelect,
    });
    if (!moment) throw new NotFoundException("Momento no encontrado o ya no disponible.");

    const viewer = await this.fetchViewerStates([id], viewerUserId);
    const mapped = mapMoment(moment as unknown as MomentRow, viewer.get(id) ?? null);

    const comments = await this.prisma.momentComment.findMany({
      where: { momentId: id, status: "PUBLISHED" },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: commentSelect,
    });

    this.prisma.moment
      .update({ where: { id }, data: { viewCount: { increment: 1 } } })
      .catch(() => undefined);

    return {
      ...mapped,
      stats: { ...mapped.stats, views: mapped.stats.views + 1 },
      recentComments: comments.map((c) => {
        const mappedComment = mapComment(c as unknown as MomentCommentRow, viewerUserId);
        return { ...mappedComment, momentId: String(id) };
      }),
    };
  }

  // --- CREATE ---
  async create(dto: CreateMomentDto, userId: number): Promise<MomentResponseDto> {
    this.checkRateLimit(this.createRateLimit, userId, 5, 60_000, "Estás publicando demasiado rápido. Espera un minuto.");

    const durationHours = dto.durationHours ?? 24;
    const expiresAt = new Date(Date.now() + durationHours * 3600_000);

    const tagNames = (dto.tags ?? [])
      .map((t) => t.trim())
      .filter((t) => t.length > 0)
      .slice(0, MAX_TAGS);
    const tagSlugs = tagNames.map((t) => slugifyTag(t));

    const moment = await this.prisma.$transaction(async (tx) => {
      const created = await tx.moment.create({
        data: {
          userId,
          title: dto.title.trim(),
          description: dto.description?.trim() ?? null,
          type: dto.type ?? "NOW",
          location: dto.location?.trim() || null,
          expiresAt,
          media: dto.media?.length
            ? {
                create: dto.media.slice(0, 4).map((m, index) => ({
                  imageUrl: m.imageUrl,
                  storageKey: m.storageKey,
                  mimeType: m.mimeType,
                  sizeBytes: m.sizeBytes,
                  position: index,
                })),
              }
            : undefined,
        },
        select: momentSelect,
      });

      if (tagSlugs.length) {
        await Promise.all(
          tagSlugs.map(async (slug, index) => {
            const tag = await tx.momentTag.upsert({
              where: { slug },
              update: {},
              create: { name: tagNames[index], slug },
            });
            await tx.momentTagAssignment.create({
              data: { momentId: created.id, tagId: tag.id },
            });
          }),
        );
      }

      return created;
    });

    this.cache.invalidate("hot:moments");
    return mapMoment(moment as unknown as MomentRow, { userId, boosted: false, saved: false, confirmed: false });
  }

  // --- UPDATE ---
  async update(id: number, dto: UpdateMomentDto, userId: number, role: string): Promise<MomentResponseDto> {
    const existing = await this.prisma.moment.findUnique({ where: { id }, select: { id: true, userId: true, deletedAt: true } });
    if (!existing || existing.deletedAt) throw new NotFoundException("Momento no encontrado.");
    const isAuthor = existing.userId === userId;
    const isStaff = role === "ADMIN" || role === "MODERATOR";
    if (!isAuthor && !isStaff) throw new ForbiddenException("No tienes permisos para editar este momento.");

    const data: Prisma.MomentUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title.trim();
    if (dto.description !== undefined) data.description = dto.description?.trim() ?? null;
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.location !== undefined) data.location = dto.location?.trim() || null;
    if (dto.durationHours !== undefined) data.expiresAt = new Date(Date.now() + dto.durationHours * 3600_000);

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.moment.update({ where: { id }, data, select: momentSelect });

      if (dto.tags !== undefined) {
        await tx.momentTagAssignment.deleteMany({ where: { momentId: id } });
        const tagNames = dto.tags.map((t) => t.trim()).filter((t) => t.length > 0).slice(0, MAX_TAGS);
        for (const name of tagNames) {
          const slug = slugifyTag(name);
          const tag = await tx.momentTag.upsert({ where: { slug }, update: {}, create: { name, slug } });
          await tx.momentTagAssignment.create({ data: { momentId: id, tagId: tag.id } });
        }
      }

      return result;
    });

    this.cache.invalidate("hot:moments");
    const viewer = await this.fetchViewerStates([id], userId);
    return mapMoment(updated as unknown as MomentRow, viewer.get(id) ?? null);
  }

  // --- DELETE (soft) ---
  async remove(id: number, userId: number, role: string): Promise<{ message: string }> {
    const existing = await this.prisma.moment.findUnique({ where: { id }, select: { id: true, userId: true, deletedAt: true } });
    if (!existing || existing.deletedAt) throw new NotFoundException("Momento no encontrado.");
    const isAuthor = existing.userId === userId;
    const isStaff = role === "ADMIN" || role === "MODERATOR";
    if (!isAuthor && !isStaff) throw new ForbiddenException("No tienes permisos para eliminar este momento.");

    await this.prisma.moment.update({ where: { id }, data: { status: "DELETED", deletedAt: new Date() } });
    this.cache.invalidate("hot:moments");
    return { message: "Momento eliminado correctamente." };
  }

  // --- MEDIA UPLOAD ---
  async uploadMedia(file: unknown, userId: number): Promise<{ imageUrl: string; storageKey: string; mimeType: string; sizeBytes: number }> {
    this.checkRateLimit(this.mediaRateLimit, userId, 10, 60_000, "Demasiadas subidas. Espera un minuto.");
    const f = file as { mimetype?: string; size?: number; originalname?: string; buffer?: Buffer };
    if (!f || !f.buffer) throw new BadRequestException("Debes adjuntar un archivo.");
    const mimeType = f.mimetype ?? "";
    const isImage = ALLOWED_IMAGE_TYPES.has(mimeType);
    const isVideo = ALLOWED_VIDEO_TYPES.has(mimeType);
    if (!isImage && !isVideo) throw new BadRequestException("Formato no permitido. Solo JPG, PNG, WEBP, MP4 o WEBM.");
    const max = isImage ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;
    if ((f.size ?? 0) > max) throw new BadRequestException(isImage ? "La imagen supera el límite de 5MB." : "El video supera el límite de 25MB.");

    const ext = (f.originalname ?? "file").split(".").pop()?.toLowerCase() ?? (isImage ? "jpg" : "mp4");
    const safeExt = /^[a-z0-9]{1,5}$/.test(ext) ? ext : isImage ? "jpg" : "mp4";
    const filename = `moment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeExt}`;
    const storageKey = `moments/${filename}`;
    const targetDir = join(process.cwd(), "tmp", "uploads", "moments");
    await mkdir(targetDir, { recursive: true });
    await writeFile(join(targetDir, filename), f.buffer);
    return { imageUrl: `/api/moments/media/${filename}`, storageKey, mimeType, sizeBytes: f.size ?? 0 };
  }

  async serveMedia(filename: string): Promise<{ stream: ReturnType<typeof createReadStream>; mimeType: string }> {
    if (!/^[a-zA-Z0-9._-]+$/.test(filename)) throw new BadRequestException("Archivo inválido.");
    const filePath = join(process.cwd(), "tmp", "uploads", "moments", filename);
    await access(filePath);
    let mimeType = "application/octet-stream";
    if (filename.endsWith(".png")) mimeType = "image/png";
    else if (filename.endsWith(".webp")) mimeType = "image/webp";
    else if (filename.endsWith(".jpg") || filename.endsWith(".jpeg")) mimeType = "image/jpeg";
    else if (filename.endsWith(".mp4")) mimeType = "video/mp4";
    else if (filename.endsWith(".webm")) mimeType = "video/webm";
    return { stream: createReadStream(filePath), mimeType };
  }

  // --- BOOST ---
  async boost(id: number, userId: number): Promise<{ boosted: boolean; count: number }> {
    this.checkRateLimit(this.boostRateLimit, userId, 20, 60_000, "Demasiadas acciones. Espera un minuto.");
    await this.ensureVisibleMoment(id);
    try {
      await this.prisma.$transaction([
        this.prisma.momentBoost.create({ data: { momentId: id, userId } }),
      ]);
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new BadRequestException("Ya impulsaste este momento.");
      }
      throw error;
    }
    const count = await this.prisma.momentBoost.count({ where: { momentId: id } });
    this.cache.invalidate("hot:moments");
    return { boosted: true, count };
  }

  async unboost(id: number, userId: number): Promise<{ boosted: boolean; count: number }> {
    await this.ensureVisibleMoment(id);
    await this.prisma.momentBoost.deleteMany({ where: { momentId: id, userId } });
    const count = await this.prisma.momentBoost.count({ where: { momentId: id } });
    this.cache.invalidate("hot:moments");
    return { boosted: false, count };
  }

  // --- CONFIRM ---
  async confirm(id: number, userId: number): Promise<{ confirmed: boolean; count: number }> {
    this.checkRateLimit(this.boostRateLimit, userId, 20, 60_000, "Demasiadas acciones. Espera un minuto.");
    await this.ensureVisibleMoment(id);
    try {
      await this.prisma.momentConfirmation.create({ data: { momentId: id, userId } });
    } catch (error) {
      if (this.isUniqueViolation(error)) throw new BadRequestException("Ya confirmaste este momento.");
      throw error;
    }
    const count = await this.prisma.momentConfirmation.count({ where: { momentId: id } });
    this.cache.invalidate("hot:moments");
    return { confirmed: true, count };
  }

  async unconfirm(id: number, userId: number): Promise<{ confirmed: boolean; count: number }> {
    await this.ensureVisibleMoment(id);
    await this.prisma.momentConfirmation.deleteMany({ where: { momentId: id, userId } });
    const count = await this.prisma.momentConfirmation.count({ where: { momentId: id } });
    this.cache.invalidate("hot:moments");
    return { confirmed: false, count };
  }

  // --- SAVE ---
  async save(id: number, userId: number): Promise<{ saved: boolean }> {
    await this.ensureVisibleMoment(id);
    try {
      await this.prisma.savedMoment.create({ data: { momentId: id, userId } });
      return { saved: true };
    } catch (error) {
      if (this.isUniqueViolation(error)) return { saved: true };
      throw error;
    }
  }

  async unsave(id: number, userId: number): Promise<{ saved: boolean }> {
    await this.prisma.savedMoment.deleteMany({ where: { momentId: id, userId } });
    return { saved: false };
  }

  // --- SHARE ---
  async share(id: number): Promise<{ shares: number }> {
    await this.ensureVisibleMoment(id);
    const updated = await this.prisma.moment.update({ where: { id }, data: { shareCount: { increment: 1 } }, select: { shareCount: true } });
    return { shares: Math.max(0, updated.shareCount) };
  }

  // --- COMMENTS ---
  async getComments(momentId: number, viewerUserId?: number): Promise<MomentCommentResponseDto[]> {
    await this.ensureVisibleMoment(momentId);
    const comments = await this.prisma.momentComment.findMany({
      where: { momentId, status: "PUBLISHED" },
      orderBy: [{ createdAt: "asc" }],
      select: commentSelect,
    });
    return comments.map((c) => {
      const mapped = mapComment(c as unknown as MomentCommentRow, viewerUserId);
      return { ...mapped, momentId: String(momentId) };
    });
  }

  async createComment(momentId: number, dto: CreateMomentCommentDto, userId: number): Promise<MomentCommentResponseDto> {
    await this.ensureVisibleMoment(momentId);
    this.checkRateLimit(this.commentRateLimit, userId, 8, 60_000, "Estás comentando demasiado rápido. Espera un minuto.");
    const content = dto.content.trim();
    if (content.length < 2 || content.length > MAX_COMMENT) throw new BadRequestException("El comentario debe tener entre 2 y 1000 caracteres.");

    const comment = await this.prisma.momentComment.create({
      data: { momentId, userId, content },
      select: commentSelect,
    });
    this.cache.invalidate("hot:moments");
    const mapped = mapComment(comment as unknown as MomentCommentRow, userId);
    return { ...mapped, momentId: String(momentId) };
  }

  async deleteComment(momentId: number, commentId: number, userId: number, role: string): Promise<{ message: string }> {
    const comment = await this.prisma.momentComment.findUnique({ where: { id: commentId }, select: { id: true, momentId: true, userId: true } });
    if (!comment || comment.momentId !== momentId) throw new NotFoundException("Comentario no encontrado.");
    const isAuthor = comment.userId === userId;
    const isStaff = role === "ADMIN" || role === "MODERATOR";
    if (!isAuthor && !isStaff) throw new ForbiddenException("No tienes permisos para eliminar este comentario.");
    await this.prisma.momentComment.update({ where: { id: commentId }, data: { status: "DELETED" } });
    this.cache.invalidate("hot:moments");
    return { message: "Comentario eliminado." };
  }

  // --- NEWS ---
  async getNews(viewerUserId?: number): Promise<{ items: MomentNewsSummaryDto[] }> {
    const since = new Date(Date.now() - 7 * 24 * 3600_000);
    const moments = await this.prisma.moment.findMany({
      where: { status: "PUBLISHED", deletedAt: null, createdAt: { gte: since } },
      select: momentSelect,
      orderBy: [{ createdAt: "desc" }],
      take: 60,
    });

    const viewerStates = await this.fetchViewerStates(moments.map((m) => m.id), viewerUserId);
    const mapped = moments.map((m) => mapMoment(m as unknown as MomentRow, viewerStates.get(m.id) ?? null));

    const groups = new Map<string, MomentNewsSummaryDto>();
    for (const moment of mapped) {
      const primaryTag = moment.tags[0] ?? "General";
      const key = primaryTag.toLowerCase();
      const existing = groups.get(key);
      const photoCount = moment.media.filter((m) => m.type === "image").length;
      if (!existing) {
        groups.set(key, {
          id: `news-${key}`,
          title: this.newsTitleForTag(primaryTag),
          summary: moment.title,
          tags: moment.tags,
          status: moment.status === "expired" ? "resolved" : "active",
          relatedMomentIds: [moment.id],
          updatedAt: moment.createdAt,
          stats: { boosts: moment.stats.boosts, confirmations: moment.stats.confirmations, comments: moment.stats.comments, photos: photoCount },
          coverImageUrl: moment.media[0]?.url ?? null,
        });
      } else {
        existing.relatedMomentIds.push(moment.id);
        existing.stats.boosts += moment.stats.boosts;
        existing.stats.confirmations += moment.stats.confirmations;
        existing.stats.comments += moment.stats.comments;
        existing.stats.photos += photoCount;
        if (moment.createdAt > existing.updatedAt) {
          existing.updatedAt = moment.createdAt;
          existing.summary = moment.title;
        }
        if (!existing.coverImageUrl && moment.media[0]?.url) existing.coverImageUrl = moment.media[0].url;
        for (const tag of moment.tags) if (!existing.tags.includes(tag)) existing.tags.push(tag);
      }
    }

    const items = Array.from(groups.values())
      .sort((a, b) => b.stats.boosts + b.stats.confirmations * 2 - (a.stats.boosts + a.stats.confirmations * 2))
      .slice(0, 12);

    return { items };
  }

  // --- GALLERY ---
  async getGallery(query: GetGalleryQueryDto, viewerUserId?: number): Promise<{ items: MomentResponseDto[]; nextCursor: number | null }> {
    const limit = Math.min(query.limit ?? 12, 40);
    const where: Prisma.MomentWhereInput = {
      status: "PUBLISHED",
      deletedAt: null,
      media: { some: {} },
    };
    if (query.q) {
      const search = query.q.trim();
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
      ];
    }
    if (query.type) where.type = query.type;
    if (query.location) where.location = { contains: query.location, mode: "insensitive" };

    const rows = await this.prisma.moment.findMany({
      where,
      select: momentSelect,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      take: limit + 1,
    });

    const nextCursor = rows.length > limit ? rows[limit - 1]?.id ?? null : null;
    const sliced = rows.slice(0, limit);
    const viewerStates = await this.fetchViewerStates(sliced.map((r) => r.id), viewerUserId);
    return { items: sliced.map((r) => mapMoment(r as unknown as MomentRow, viewerStates.get(r.id) ?? null)), nextCursor };
  }

  // --- SAVED ---
  async getSaved(query: GetSavedMomentsQueryDto, userId: number): Promise<{ items: MomentResponseDto[]; nextCursor: number | null }> {
    const limit = Math.min(query.limit ?? 12, 40);
    const status = query.status ?? "all";
    const now = new Date();

    const saved = await this.prisma.savedMoment.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      take: limit + 1,
      include: {
        moment: { select: momentSelect },
      },
    });

    let entries = saved.filter((s) => s.moment && s.moment.deletedAt === null && s.moment.status !== "DELETED");
    if (query.q) {
      const search = query.q.trim().toLowerCase();
      entries = entries.filter((s) => `${s.moment.title} ${s.moment.location ?? ""}`.toLowerCase().includes(search));
    }
    if (status === "active") entries = entries.filter((s) => s.moment.expiresAt > now);
    if (status === "expired") entries = entries.filter((s) => s.moment.expiresAt <= now);
    if (status === "with_photo") entries = entries.filter((s) => s.moment.media.length > 0);

    const nextCursor = saved.length > limit ? saved[limit - 1]?.id ?? null : null;
    const viewerStates = await this.fetchViewerStates(entries.map((s) => s.moment.id), userId);
    const items = entries.map((s) => {
      const mapped = mapMoment(s.moment as unknown as MomentRow, viewerStates.get(s.moment.id) ?? null);
      return { ...mapped, viewerState: { ...mapped.viewerState, saved: true } };
    });
    return { items, nextCursor };
  }

  // --- TRENDS ---
  async getTrends(query: GetTrendsQueryDto): Promise<{ items: MomentTrendDto[]; period: string }> {
    const period = query.period ?? "week";
    const limit = Math.min(query.limit ?? 10, 50);
    const since = new Date(Date.now() - (period === "day" ? 24 : period === "month" ? 30 : 7) * 3600_000);

    const assignments = await this.prisma.momentTagAssignment.findMany({
      where: { moment: { status: "PUBLISHED", deletedAt: null, createdAt: { gte: since } } },
      select: {
        tag: { select: { name: true, slug: true } },
        moment: { select: { id: true, boosts: { select: { id: true } } } },
      },
    });

    const byTag = new Map<string, { tag: string; moments: Set<number>; boosts: number }>();
    for (const a of assignments) {
      const key = a.tag.slug;
      const entry = byTag.get(key) ?? { tag: a.tag.name, moments: new Set<number>(), boosts: 0 };
      entry.moments.add(a.moment.id);
      entry.boosts += a.moment.boosts.length;
      byTag.set(key, entry);
    }

    const currentTotal = assignments.length;

    const items: MomentTrendDto[] = Array.from(byTag.entries())
      .map(([, v]) => ({
        tag: v.tag,
        moments: v.moments.size,
        boosts: v.boosts,
        growth: currentTotal > 0 ? Math.round((v.moments.size / Math.max(1, currentTotal)) * 100) : 0,
      }))
      .sort((a, b) => b.boosts - a.boosts || b.moments - a.moments)
      .slice(0, limit)
      .map((item, index) => ({ position: index + 1, ...item }));

    return { items, period };
  }

  // --- TOPICS ---
  async getTopics(): Promise<{ items: MomentTopicDto[] }> {
    const since = new Date(Date.now() - 30 * 24 * 3600_000);
    const grouped = await this.prisma.momentTagAssignment.groupBy({
      by: ["tagId"],
      where: { moment: { status: "PUBLISHED", deletedAt: null, createdAt: { gte: since } } },
      _count: { _all: true },
      orderBy: { _count: { tagId: "desc" } },
      take: 20,
    });

    const tagIds = grouped.map((g) => g.tagId);
    const tags = await this.prisma.momentTag.findMany({ where: { id: { in: tagIds } }, select: { id: true, name: true } });
    const tagMap = new Map(tags.map((t) => [t.id, t.name]));

    const items: MomentTopicDto[] = grouped.map((g) => ({ tag: tagMap.get(g.tagId) ?? "desconocido", count: g._count._all }));
    return { items };
  }

  // --- helpers ---
  private async ensureVisibleMoment(id: number): Promise<void> {
    const moment = await this.prisma.moment.findFirst({
      where: { id, status: "PUBLISHED", deletedAt: null },
      select: { id: true },
    });
    if (!moment) throw new NotFoundException("Momento no encontrado o ya no disponible.");
  }

  private async fetchViewerStates(momentIds: number[], viewerUserId?: number): Promise<Map<number, ViewerStateRow>> {
    const map = new Map<number, ViewerStateRow>();
    if (!viewerUserId || momentIds.length === 0) return map;
    for (const id of momentIds) map.set(id, { momentId: id, userId: viewerUserId, boosted: false, saved: false, confirmed: false });

    const [boosts, saves, confirms] = await Promise.all([
      this.prisma.momentBoost.findMany({ where: { userId: viewerUserId, momentId: { in: momentIds } }, select: { momentId: true } }),
      this.prisma.savedMoment.findMany({ where: { userId: viewerUserId, momentId: { in: momentIds } }, select: { momentId: true } }),
      this.prisma.momentConfirmation.findMany({ where: { userId: viewerUserId, momentId: { in: momentIds } }, select: { momentId: true } }),
    ]);
    for (const b of boosts) map.get(b.momentId)!.boosted = true;
    for (const s of saves) map.get(s.momentId)!.saved = true;
    for (const c of confirms) map.get(c.momentId)!.confirmed = true;
    return map;
  }

  private relevanceScore(moment: MomentRow, nowMs: number): number {
    const ageHours = Math.max(1, (nowMs - moment.createdAt.getTime()) / 3_600_000);
    const recency = 1 / (ageHours + 1);
    return moment._count.boosts * 3 + moment._count.confirmations * 4 + moment._count.comments * 2 + Math.max(0, moment.shareCount) * 1 - ageHours * 0.5 + recency * 5;
  }

  private isUniqueViolation(error: unknown): boolean {
    if (error && typeof error === "object" && "code" in error) {
      return (error as { code: string }).code === "P2002";
    }
    return false;
  }

  private newsTitleForTag(tag: string): string {
    const map: Record<string, string> = {
      comedor: "Actividad en el comedor universitario",
      matricula: "Novedades sobre matrícula",
      tesoreria: "Atención en Tesorería",
      eventos: "Eventos en el campus",
      cultura: "Actividad cultural",
      avisos: "Avisos del campus",
      campus: "Vida en el campus",
    };
    return map[tag.toLowerCase()] ?? `Lo más reciente sobre ${tag}`;
  }
}
