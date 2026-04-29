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
  comments: Array<{ createdAt: Date }>;
  _count: { comments: number } | null;
};

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService, private readonly cache: HotReadCacheService, private readonly jobs: JobsService, private readonly observability: ObservabilityService) {}

  private readonly postRateLimit = new Map<number, number[]>();
  private readonly commentRateLimit = new Map<number, number[]>();

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
    comments: {
      where: {
        status: "PUBLISHED",
      },
      select: {
        createdAt: true,
      },
    },
    _count: {
      select: {
        comments: true,
      },
    },
  } as const;

  private readonly commentSelect = { id: true, content: true, createdAt: true, user: { select: { id: true, email: true, profile: { select: { firstName: true, lastName: true } } } } } as const;

  private mapPostResponse(post: PostWithRelations): PostResponseDto {
    return { id: post.id, title: post.title, content: post.content, createdAt: post.createdAt, author: { id: post.user.id, email: post.user.email, firstName: post.user.profile?.firstName ?? null, lastName: post.user.profile?.lastName ?? null }, community: post.community, commentsCount: post._count?.comments ?? 0 };
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

    const response = { items: paginated.map((post: PostWithRelations) => this.mapPostResponse(post)), nextCursor, mode };
    if (cacheKey) this.cache.set(cacheKey, response, 20_000);
    return response;
  }

  async create(dto: CreatePostDto, userId: number): Promise<PostResponseDto> {
    this.checkRateLimit(this.postRateLimit, userId, 3, 60_000, "Estás publicando demasiado rápido. Intenta de nuevo en un minuto.");

    const community = await this.prisma.community.findUnique({ where: { id: dto.communityId }, select: { id: true } });
    if (!community) throw new BadRequestException("La comunidad seleccionada no existe.");

    this.validateUsefulContent(dto.content, 20, "El contenido de la publicación debe aportar más contexto útil.");
    const title = dto.title?.trim() ?? "";

    const post = await this.prisma.post.create({ data: { title, content: dto.content.trim(), communityId: dto.communityId, userId }, select: this.postSelect });
    this.cache.invalidate("hot:feed:initial");
    await this.jobs.enqueueNotification({ type: "POST_CREATED", userId, postId: post.id, communityId: dto.communityId });
    await this.jobs.enqueueRankingRecalculation({ trigger: "POST_CREATED", postId: post.id });
    this.observability.recordPostCreated(userId);
    this.registerFeedEvent("create_post", userId, { postId: post.id });
    return this.mapPostResponse(post);
  }

  async findOne(id: number, userId?: number): Promise<PostResponseDto> {
    const post = await this.prisma.post.findFirst({ where: { id, status: "PUBLISHED" }, select: this.postSelect });
    if (!post) throw new NotFoundException("Publicación no encontrada.");
    this.registerFeedEvent("click", userId, { postId: id });
    return this.mapPostResponse(post);
  }

  async update(id: number, dto: UpdatePostDto, userId: number): Promise<PostResponseDto> { const existingPost = await this.prisma.post.findUnique({ where: { id }, select: { id: true, userId: true } }); if (!existingPost) throw new NotFoundException("Publicación no encontrada."); if (existingPost.userId !== userId) throw new ForbiddenException("No tienes permisos para editar esta publicación."); if (dto.communityId) { const community = await this.prisma.community.findUnique({ where: { id: dto.communityId }, select: { id: true } }); if (!community) throw new BadRequestException("La comunidad seleccionada no existe."); } const updatedPost = await this.prisma.post.update({ where: { id }, data: { ...(dto.title !== undefined ? { title: dto.title.trim() } : {}), ...(dto.content !== undefined ? { content: dto.content.trim() } : {}), ...(dto.communityId !== undefined ? { communityId: dto.communityId } : {}) }, select: this.postSelect }); return this.mapPostResponse(updatedPost); }

  async remove(id: number, userId: number, role: string): Promise<{ message: string }> { const existingPost = await this.prisma.post.findUnique({ where: { id }, select: { id: true, userId: true } }); if (!existingPost) throw new NotFoundException("Publicación no encontrada."); const isAuthor = existingPost.userId === userId; const isAdmin = role === "ADMIN"; if (!isAuthor && !isAdmin) throw new ForbiddenException("No tienes permisos para eliminar esta publicación."); await this.prisma.post.update({ where: { id }, data: { status: "DELETED" } }); return { message: "Publicación eliminada correctamente." }; }

  async getComments(postId: number): Promise<PostCommentResponseDto[]> { await this.ensurePublishedPost(postId); const comments = await this.prisma.comment.findMany({ where: { postId, status: "PUBLISHED" }, orderBy: { createdAt: "asc" }, select: this.commentSelect }); return comments.map((comment: (typeof comments)[number]) => this.mapCommentResponse(comment)); }

  async createComment(postId: number, dto: CreatePostCommentDto, userId: number): Promise<PostCommentResponseDto> {
    await this.ensurePublishedPost(postId);
    this.checkRateLimit(this.commentRateLimit, userId, 8, 60_000, "Estás comentando demasiado rápido. Intenta de nuevo en un minuto.");
    this.validateUsefulContent(dto.content, 12, "El comentario es muy corto. Agrega más detalle útil.");
    const comment = await this.prisma.comment.create({ data: { postId, userId, content: dto.content.trim() }, select: this.commentSelect });
    this.observability.recordCommentCreated(userId);
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
