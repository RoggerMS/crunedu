import { BadRequestException, ForbiddenException, HttpException, HttpStatus, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { HotReadCacheService } from "../cache/hot-read-cache.service";
import { JobsService } from "../jobs/jobs.service";
import { PAGINATION_LIMITS } from "../common/pagination.constants";
import { CreatePostDto } from "./dto/create-post.dto";
import { CreatePostCommentDto } from "./dto/create-post-comment.dto";
import { PostResponseDto } from "./dto/post-response.dto";
import { PostCommentResponseDto } from "./dto/post-comment-response.dto";
import { UpdatePostDto } from "./dto/update-post.dto";
import { GetPostsQueryDto } from "./dto/get-posts-query.dto";
import { GetDiscoveryQueryDto } from "./dto/get-discovery-query.dto";
import { UploadPostImageResponseDto } from "./dto/upload-post-image-response.dto";
import { ObservabilityService } from "../observability/observability.service";

interface FeedEventPayload {
  postId?: number;
  mode?: "recent" | "relevant";
}

type PostWithRelations = {
  id: number;
  title: string;
  content: string;
  createdAt: Date;
  user: { id: number; email: string; profile: { firstName: string | null; lastName: string | null } | null };
  community: { id: number; name: string; slug: string } | null;
  document: { id: number; title: string; fileType: string; sizeBytes: number; course: string } | null;
  comments: Array<{ createdAt: Date }>;
  _count: { comments: number } | null;
  images: Array<{ id:number; imageUrl:string; mimeType:string; sizeBytes:number; position:number }>;
};

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService, private readonly cache: HotReadCacheService, private readonly jobs: JobsService, private readonly observability: ObservabilityService) {}

  private readonly postRateLimit = new Map<number, number[]>();
  private readonly commentRateLimit = new Map<number, number[]>();
  private readonly MAX_POST_LENGTH = 5000;
  private readonly MAX_COMMENT_LENGTH = 1000;

  private readonly postSelect = {
    id: true,
    title: true,
    content: true,
    createdAt: true,
    user: {
      select: {
        id: true,
        email: true,
        profile: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    },
    community: {
      select: {
        id: true,
        name: true,
        slug: true,
      },
    },
    document: {
      select: {
        id: true,
        title: true,
        fileType: true,
        sizeBytes: true,
        course: true,
      },
    },
    comments: {
      where: {
        status: "PUBLISHED",
      },
      select: {
        createdAt: true,
      },
    },
    images: { select: { id: true, imageUrl: true, mimeType: true, sizeBytes: true, position: true }, orderBy: { position: "asc" } },
    _count: {
      select: {
        comments: true,
      },
    },
  } as const;

  private readonly commentSelect = { id: true, content: true, createdAt: true, user: { select: { id: true, email: true, profile: { select: { firstName: true, lastName: true } } } } } as const;

  private mapPostResponse(post: PostWithRelations, userId?: number): PostResponseDto {
    return { id: post.id, title: post.title, content: post.content, createdAt: post.createdAt, author: { id: post.user.id, email: post.user.email, firstName: post.user.profile?.firstName ?? null, lastName: post.user.profile?.lastName ?? null }, community: post.community, document: post.document, commentsCount: post._count?.comments ?? 0, images: post.images, isMine: Boolean(userId && post.user.id === userId) };
  }

  private mapCommentResponse(comment: any): PostCommentResponseDto {
    return { id: comment.id, content: comment.content, createdAt: comment.createdAt, author: { id: comment.user.id, email: comment.user.email, firstName: comment.user.profile?.firstName ?? null, lastName: comment.user.profile?.lastName ?? null } };
  }

  async index(query: GetPostsQueryDto, userId?: number): Promise<{ items: PostResponseDto[]; nextCursor: number | null; mode: "recent" | "relevant" }> {
    const mode = query.mode ?? "recent";
    const limit = query.limit ?? PAGINATION_LIMITS.postsFeed.default;
    const safeLimit = Math.min(limit, PAGINATION_LIMITS.postsFeed.max);
    const take = mode === "relevant" ? 100 : safeLimit + 1;

    const cacheKey = !query.cursor && mode === "recent" ? `hot:feed:initial:${safeLimit}` : null;
    if (cacheKey) {
      const cached = this.cache.get<{ items: PostResponseDto[]; nextCursor: number | null; mode: "recent" | "relevant" }>(cacheKey);
      if (cached) return cached;
    }

    const posts = await this.prisma.post.findMany({
      where: { status: "PUBLISHED" },
      select: this.postSelect,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      take,
    });

    const rankedPosts = mode === "relevant" ? await this.rankRelevant(posts, userId) : posts;
    const paginated = rankedPosts.slice(0, safeLimit);
    const nextCursor = rankedPosts.length > safeLimit ? rankedPosts[safeLimit].id : null;

    this.registerFeedEvent("impression", userId, { mode });

    const response = { items: paginated.map((post: PostWithRelations) => this.mapPostResponse(post, userId)), nextCursor, mode };
    if (cacheKey) this.cache.set(cacheKey, response, 20_000);
    return response;
  }



  async getDiscoveryFeed(query: GetDiscoveryQueryDto, userId?: number): Promise<{ sections: { key: "communities" | "friends" | "recommended"; title: string; items: PostResponseDto[] }[]; pagination: { page: number; perSection: number; hasNextPage: boolean } }> {
    const page = query.page ?? 1;
    const perSection = Math.min(query.perSection ?? 5, 10);
    const skip = (page - 1) * perSection;

    const affinityByCommunity = await this.getCommunityAffinity(userId);
    const affinityCommunityIds = Array.from(affinityByCommunity.entries()).sort((a, b) => b[1] - a[1]).map(([communityId]) => communityId);

    const communityPostsPromise = affinityCommunityIds.length
      ? this.prisma.post.findMany({
          where: { status: "PUBLISHED", communityId: { in: affinityCommunityIds } },
          select: this.postSelect,
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          skip,
          take: perSection + 1,
        })
      : Promise.resolve([] as PostWithRelations[]);

    const friendsPostsPromise = userId
      ? this.prisma.post.findMany({
          where: { status: "PUBLISHED", user: { followers: { some: { followerId: userId } } } },
          select: this.postSelect,
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          skip,
          take: perSection + 1,
        })
      : Promise.resolve([] as PostWithRelations[]);

    const recommendedRaw = await this.prisma.post.findMany({
      where: { status: "PUBLISHED" },
      select: this.postSelect,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 120,
    });

    const [communityPosts, friendsPosts] = await Promise.all([communityPostsPromise, friendsPostsPromise]);
    const rankedRecommended = [...recommendedRaw].sort((a, b) => this.computeRelevanceScore(b, Date.now(), affinityByCommunity) - this.computeRelevanceScore(a, Date.now(), affinityByCommunity));
    const recommendedSlice = rankedRecommended.slice(skip, skip + perSection + 1);

    const sections = [
      { key: "communities" as const, title: "De tus comunidades", items: communityPosts.slice(0, perSection).map((post: PostWithRelations) => this.mapPostResponse(post, userId)) },
      { key: "friends" as const, title: "De tus amigos", items: friendsPosts.slice(0, perSection).map((post: PostWithRelations) => this.mapPostResponse(post, userId)) },
      { key: "recommended" as const, title: "Recomendado para ti", items: recommendedSlice.slice(0, perSection).map((post: PostWithRelations) => this.mapPostResponse(post, userId)) },
    ];

    this.registerFeedEvent("impression", userId, { mode: "relevant" });
    for (const section of sections) this.registerFeedEvent("impression", userId, { mode: "relevant", postId: section.items[0]?.id });

    return {
      sections,
      pagination: {
        page,
        perSection,
        hasNextPage: communityPosts.length > perSection || friendsPosts.length > perSection || recommendedSlice.length > perSection,
      },
    };
  }
  async create(dto: CreatePostDto, userId: number): Promise<PostResponseDto> {
    this.checkRateLimit(this.postRateLimit, userId, 3, 60_000, "Estás publicando demasiado rápido. Intenta de nuevo en un minuto.");

    if (dto.communityId) {
      const community = await this.prisma.community.findUnique({ where: { id: dto.communityId }, select: { id: true } });
      if (!community) throw new BadRequestException("La comunidad seleccionada no está disponible.");
    }

    this.validateExtremeSize(dto.content, this.MAX_POST_LENGTH, "La publicación es demasiado extensa para el MVP.");
    await this.preventRepeatedPostContent(userId, dto.content);
    const post = await this.prisma.post.create({
      data: {
        title: dto.title?.trim() ?? "",
        content: dto.content.trim(),
        communityId: dto.communityId ?? null,
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
      select: this.postSelect,
    });
    this.cache.invalidate("hot:feed:initial");
    await this.jobs.enqueueNotification({ type: "POST_CREATED", userId, postId: post.id, communityId: dto.communityId });
    await this.jobs.enqueueRankingRecalculation({ trigger: "POST_CREATED", postId: post.id });
    this.observability.recordPostCreated(userId, post.id);
    this.registerFeedEvent("create_post", userId, { postId: post.id });
    return this.mapPostResponse(post, userId);
  }

  async uploadImage(file: any): Promise<UploadPostImageResponseDto> {
    const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
    const maxSizeBytes = 3 * 1024 * 1024;
    if (!file) throw new BadRequestException("Debes adjuntar una imagen.");
    if (!allowedTypes.has(file.mimetype)) throw new BadRequestException("Formato no permitido. Solo JPG, PNG o WEBP.");
    if (file.size > maxSizeBytes) throw new BadRequestException("La imagen supera el límite de 3MB.");
    const extension = file.originalname.split(".").pop()?.toLowerCase() || "jpg";
    const filename = `post-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
    const storageKey = `posts/${filename}`;
    const targetDir = process.cwd() + "/tmp/uploads/posts";
    await import("node:fs/promises").then((fs) => fs.mkdir(targetDir, { recursive: true }));
    await import("node:fs/promises").then((fs) => fs.writeFile(`${targetDir}/${filename}`, file.buffer));
    return { imageUrl: `/api/posts/images/${filename}`, storageKey, mimeType: file.mimetype, sizeBytes: file.size };
  }

  async findOne(id: number, userId?: number): Promise<PostResponseDto> {
    const post = await this.prisma.post.findFirst({ where: { id, status: "PUBLISHED" }, select: this.postSelect });
    if (!post) throw new NotFoundException("Publicación no encontrada.");
    this.registerFeedEvent("click", userId, { postId: id });
    return this.mapPostResponse(post, userId);
  }

  async update(id: number, dto: UpdatePostDto, userId: number): Promise<PostResponseDto> { const existingPost = await this.prisma.post.findUnique({ where: { id }, select: { id: true, userId: true } }); if (!existingPost) throw new NotFoundException("Publicación no encontrada."); if (existingPost.userId !== userId) throw new ForbiddenException("No tienes permisos para editar esta publicación."); if (dto.communityId) { const community = await this.prisma.community.findUnique({ where: { id: dto.communityId }, select: { id: true } }); if (!community) throw new BadRequestException("La comunidad seleccionada no existe."); } if (dto.content !== undefined) this.validateExtremeSize(dto.content, this.MAX_POST_LENGTH, "La publicación es demasiado extensa para el MVP."); const updatedPost = await this.prisma.post.update({ where: { id }, data: { ...(dto.title !== undefined ? { title: dto.title.trim() } : {}), ...(dto.content !== undefined ? { content: dto.content.trim() } : {}), ...(dto.communityId !== undefined ? { communityId: dto.communityId } : {}) }, select: this.postSelect }); this.cache.invalidate("hot:feed:initial"); return this.mapPostResponse(updatedPost, userId); }

  async remove(id: number, userId: number, role: string): Promise<{ message: string }> { const existingPost = await this.prisma.post.findUnique({ where: { id }, select: { id: true, userId: true } }); if (!existingPost) throw new NotFoundException("Publicación no encontrada."); const isAuthor = existingPost.userId === userId; const isAdmin = role === "ADMIN"; if (!isAuthor && !isAdmin) throw new ForbiddenException("No tienes permisos para eliminar esta publicación."); await this.prisma.post.update({ where: { id }, data: { status: "DELETED" } }); this.cache.invalidate("hot:feed:initial"); return { message: "Publicación eliminada correctamente." }; }

  async getComments(postId: number): Promise<PostCommentResponseDto[]> { await this.ensurePublishedPost(postId); const comments = await this.prisma.comment.findMany({ where: { postId, status: "PUBLISHED" }, orderBy: { createdAt: "asc" }, select: this.commentSelect }); return comments.map((comment: (typeof comments)[number]) => this.mapCommentResponse(comment)); }

  async createComment(postId: number, dto: CreatePostCommentDto, userId: number): Promise<PostCommentResponseDto> {
    await this.ensurePublishedPost(postId);
    this.checkRateLimit(this.commentRateLimit, userId, 8, 60_000, "Estás comentando demasiado rápido. Intenta de nuevo en un minuto.");
    this.validateUsefulContent(dto.content, 12, "El comentario es muy corto. Agrega más detalle útil.");
    this.validateExtremeSize(dto.content, this.MAX_COMMENT_LENGTH, "El comentario es demasiado extenso.");
    await this.preventRepeatedCommentContent(userId, postId, dto.content);
    const comment = await this.prisma.comment.create({ data: { postId, userId, content: dto.content.trim() }, select: this.commentSelect });
    this.observability.recordCommentCreated(userId, comment.id, postId);
    return this.mapCommentResponse(comment);
  }

  private registerFeedEvent(event: "impression" | "click" | "create_post", userId?: number, payload?: FeedEventPayload): void {
    console.info(`[feed_event] event=${event} userId=${userId ?? "anonymous"} payload=${JSON.stringify(payload ?? {})}`);
  }

  private checkRateLimit(bucket: Map<number, number[]>, userId: number, maxEvents: number, windowMs: number, message: string): void {
    const now = Date.now();
    const windowStart = now - windowMs;
    const timestamps = (bucket.get(userId) ?? []).filter((ts) => ts >= windowStart);
    if (timestamps.length >= maxEvents) throw new HttpException(message, HttpStatus.TOO_MANY_REQUESTS);
    timestamps.push(now);
    bucket.set(userId, timestamps);
  }

  private validateUsefulContent(content: string, minCharacters: number, message: string): void {
    const normalizedContent = content.trim();
    const usefulWords = normalizedContent.split(/\s+/).filter((word) => word.length >= 3);
    if (normalizedContent.length < minCharacters || usefulWords.length < 3) throw new BadRequestException(message);
  }


  private validateExtremeSize(content: string, maxLength: number, message: string): void {
    if (content.trim().length > maxLength) throw new BadRequestException(message);
  }

  private async preventRepeatedPostContent(userId: number, content: string): Promise<void> {
    const normalized = content.trim().toLowerCase();
    const recentPost = await this.prisma.post.findFirst({
      where: { userId, status: "PUBLISHED" },
      orderBy: { createdAt: "desc" },
      select: { content: true, createdAt: true },
    });

    if (!recentPost) return;
    const isDuplicate = recentPost.content.trim().toLowerCase() === normalized;
    const createdWithinTwoMinutes = Date.now() - recentPost.createdAt.getTime() <= 120_000;
    if (isDuplicate && createdWithinTwoMinutes) {
      console.warn(JSON.stringify({ level: "warn", message: "spam_blocked", type: "duplicate_post", userId, timestamp: new Date().toISOString() }));
      throw new BadRequestException("No publiques contenido repetido en tan poco tiempo.");
    }
  }

  private async preventRepeatedCommentContent(userId: number, postId: number, content: string): Promise<void> {
    const normalized = content.trim().toLowerCase();
    const recentComment = await this.prisma.comment.findFirst({
      where: { userId, postId, status: "PUBLISHED" },
      orderBy: { createdAt: "desc" },
      select: { content: true, createdAt: true },
    });

    if (!recentComment) return;
    const isDuplicate = recentComment.content.trim().toLowerCase() === normalized;
    const createdWithinTwoMinutes = Date.now() - recentComment.createdAt.getTime() <= 120_000;
    if (isDuplicate && createdWithinTwoMinutes) {
      console.warn(JSON.stringify({ level: "warn", message: "spam_blocked", type: "duplicate_comment", userId, postId, timestamp: new Date().toISOString() }));
      throw new BadRequestException("No repitas el mismo comentario en tan poco tiempo.");
    }
  }
  private async rankRelevant(posts: PostWithRelations[], userId?: number): Promise<PostWithRelations[]> {
    const affinityByCommunity = await this.getCommunityAffinity(userId);
    const now = Date.now();

    return [...posts].sort((a, b) => {
      const scoreA = this.computeRelevanceScore(a, now, affinityByCommunity);
      const scoreB = this.computeRelevanceScore(b, now, affinityByCommunity);
      return scoreB - scoreA;
    });
  }

  private computeRelevanceScore(post: PostWithRelations, now: number, affinityByCommunity: Map<number, number>): number {
    const postAgeHours = Math.max(1, (now - post.createdAt.getTime()) / 3_600_000);
    const recencyScore = 1 / (postAgeHours + 1);

    const earlyInteractionCount = post.comments.filter((comment: { createdAt: Date }) => comment.createdAt.getTime() - post.createdAt.getTime() <= 86_400_000).length;
    const earlyInteractionScore = Math.min(earlyInteractionCount * 0.4, 2);

    const communityAffinityScore = post.community?.id ? affinityByCommunity.get(post.community.id) ?? 0 : 0;

    return recencyScore * 0.5 + earlyInteractionScore * 0.3 + communityAffinityScore * 0.2;
  }

  private async getCommunityAffinity(userId?: number): Promise<Map<number, number>> {
    const affinity = new Map<number, number>();
    if (!userId) return affinity;

    const sinceDate = new Date(Date.now() - 30 * 24 * 3_600_000);
    const [recentPosts, recentComments] = await Promise.all([
      this.prisma.post.findMany({ where: { userId, status: "PUBLISHED", createdAt: { gte: sinceDate }, communityId: { not: null } }, select: { communityId: true } }),
      this.prisma.comment.findMany({ where: { userId, status: "PUBLISHED", createdAt: { gte: sinceDate } }, select: { post: { select: { communityId: true } } } }),
    ]);

    for (const post of recentPosts) {
      if (!post.communityId) continue;
      affinity.set(post.communityId, (affinity.get(post.communityId) ?? 0) + 2);
    }

    for (const comment of recentComments) {
      const communityId = comment.post.communityId;
      if (!communityId) continue;
      affinity.set(communityId, (affinity.get(communityId) ?? 0) + 1);
    }

    const maxScore = Math.max(1, ...affinity.values());
    for (const [communityId, score] of affinity.entries()) affinity.set(communityId, score / maxScore);
    return affinity;
  }

  private async ensurePublishedPost(postId: number): Promise<void> { const post = await this.prisma.post.findFirst({ where: { id: postId, status: "PUBLISHED" }, select: { id: true } }); if (!post) throw new NotFoundException("Publicación no encontrada."); }
}
