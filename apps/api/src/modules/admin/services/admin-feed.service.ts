import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ContentStatus } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { HotReadCacheService } from "../../cache/hot-read-cache.service";
import { AdminAuditService } from "./admin-audit.service";
import { AdminPlacementsService } from "./admin-placements.service";

export interface FeedPostFilters {
  search?: string;
  authorId?: number;
  communityId?: number;
  status?: ContentStatus;
  hasReports?: boolean;
  dateFrom?: string;
  dateTo?: string;
  cursor?: number;
  limit?: number;
}

@Injectable()
export class AdminFeedService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: HotReadCacheService,
    private readonly audit: AdminAuditService,
    private readonly placements: AdminPlacementsService,
  ) {}

  async listPosts(filters: FeedPostFilters) {
    const limit = Math.min(filters.limit ?? 25, 50);
    const where: Record<string, unknown> = {};

    if (filters.authorId) where.userId = filters.authorId;
    if (filters.communityId) where.communityId = filters.communityId;
    if (filters.status) where.status = filters.status;
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {
        ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
        ...(filters.dateTo ? { lte: new Date(filters.dateTo) } : {}),
      };
    }
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: "insensitive" } },
        { content: { contains: filters.search, mode: "insensitive" } },
      ];
    }
    if (filters.hasReports) where.reports = { some: {} };

    const posts = await this.prisma.post.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      ...(filters.cursor ? { cursor: { id: filters.cursor }, skip: 1 } : {}),
      select: {
        id: true,
        title: true,
        content: true,
        status: true,
        inFeed: true,
        createdAt: true,
        user: { select: { id: true, email: true, profile: { select: { firstName: true, lastName: true } } } },
        community: { select: { id: true, name: true } },
        _count: { select: { comments: true, reactions: true, reports: true } },
      },
    });

    const hasMore = posts.length > limit;
    const slice = posts.slice(0, limit);
    const nextCursor = hasMore ? slice[slice.length - 1].id : null;

    const placements = await this.placements.listByArea("FEED_FEATURED");
    const featuredIds = new Set(placements.items.filter((p) => p.status === "ACTIVE").map((p) => p.entityId));

    return {
      items: slice.map((p) => ({
        ...p,
        author: `${p.user.profile?.firstName ?? ""} ${p.user.profile?.lastName ?? ""}`.trim() || p.user.email,
        isFeatured: featuredIds.has(p.id),
        commentsCount: p._count.comments,
        likesCount: p._count.reactions,
        reportsCount: p._count.reports,
      })),
      nextCursor,
    };
  }

  async hidePost(postId: number, adminId: number, reason: string) {
    await this.ensurePost(postId);
    await this.prisma.post.update({ where: { id: postId }, data: { status: ContentStatus.HIDDEN } });
    this.cache.invalidate("hot:feed:initial");
    await this.audit.record(adminId, "POST_HIDE", "feed", { targetType: "Post", targetId: postId, reason });
    return { message: "Publicación oculta." };
  }

  async restorePost(postId: number, adminId: number, reason: string) {
    await this.ensurePost(postId);
    await this.prisma.post.update({ where: { id: postId }, data: { status: ContentStatus.PUBLISHED } });
    this.cache.invalidate("hot:feed:initial");
    await this.audit.record(adminId, "POST_RESTORE", "feed", { targetType: "Post", targetId: postId, reason });
    return { message: "Publicación restaurada." };
  }

  async featurePost(postId: number, adminId: number, position = 0) {
    await this.ensurePost(postId);
    await this.placements.upsert({ area: "FEED_FEATURED", entityType: "POST", entityId: postId, position, adminId });
    this.cache.invalidate("hot:feed:initial");
    await this.audit.record(adminId, "POST_FEATURE", "feed", { targetType: "Post", targetId: postId });
    return { message: "Publicación destacada." };
  }

  async unfeaturePost(postId: number, adminId: number) {
    await this.placements.deactivate("FEED_FEATURED", "POST", postId, adminId);
    this.cache.invalidate("hot:feed:initial");
    await this.audit.record(adminId, "POST_UNFEATURE", "feed", { targetType: "Post", targetId: postId });
    return { message: "Destacado retirado." };
  }

  async listComments(postId: number) {
    await this.ensurePost(postId);
    const comments = await this.prisma.comment.findMany({
      where: { postId },
      orderBy: [{ createdAt: "asc" }],
      select: {
        id: true,
        content: true,
        status: true,
        createdAt: true,
        user: { select: { id: true, email: true, profile: { select: { firstName: true, lastName: true } } } },
      },
    });
    return {
      items: comments.map((c) => ({
        ...c,
        author: `${c.user.profile?.firstName ?? ""} ${c.user.profile?.lastName ?? ""}`.trim() || c.user.email,
      })),
    };
  }

  async hideComment(commentId: number, adminId: number, reason: string) {
    const comment = await this.prisma.comment.findUnique({ where: { id: commentId }, select: { id: true, postId: true } });
    if (!comment) throw new NotFoundException("Comentario no encontrado.");
    await this.prisma.comment.update({ where: { id: commentId }, data: { status: ContentStatus.HIDDEN } });
    this.cache.invalidate("hot:feed:initial");
    await this.audit.record(adminId, "COMMENT_HIDE", "feed", { targetType: "Comment", targetId: commentId, reason });
    return { message: "Comentario oculto." };
  }

  async restoreComment(commentId: number, adminId: number, reason: string) {
    const comment = await this.prisma.comment.findUnique({ where: { id: commentId }, select: { id: true } });
    if (!comment) throw new NotFoundException("Comentario no encontrado.");
    await this.prisma.comment.update({ where: { id: commentId }, data: { status: ContentStatus.PUBLISHED } });
    this.cache.invalidate("hot:feed:initial");
    await this.audit.record(adminId, "COMMENT_RESTORE", "feed", { targetType: "Comment", targetId: commentId, reason });
    return { message: "Comentario restaurado." };
  }

  private async ensurePost(postId: number) {
    const post = await this.prisma.post.findUnique({ where: { id: postId }, select: { id: true } });
    if (!post) throw new NotFoundException("Publicación no encontrada.");
    return post;
  }
}
