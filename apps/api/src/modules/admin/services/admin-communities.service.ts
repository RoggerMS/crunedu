import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ContentStatus } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { HotReadCacheService } from "../../cache/hot-read-cache.service";
import { AdminAuditService } from "./admin-audit.service";
import { AdminPlacementsService } from "./admin-placements.service";

export interface CommunityFilters {
  search?: string;
  status?: ContentStatus;
  cursor?: number;
  limit?: number;
}

@Injectable()
export class AdminCommunitiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: HotReadCacheService,
    private readonly audit: AdminAuditService,
    private readonly placements: AdminPlacementsService,
  ) {}

  async list(filters: CommunityFilters) {
    const limit = Math.min(filters.limit ?? 25, 50);
    const where: Record<string, unknown> = {};
    if (filters.status) where.status = filters.status;
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { slug: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const communities = await this.prisma.community.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      ...(filters.cursor ? { cursor: { id: filters.cursor }, skip: 1 } : {}),
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        status: true,
        createdAt: true,
        createdBy: true,
        creator: { select: { id: true, email: true } },
        _count: { select: { members: true, posts: true, questions: true, documents: true } },
      },
    });

    const hasMore = communities.length > limit;
    const slice = communities.slice(0, limit);
    const nextCursor = hasMore ? slice[slice.length - 1].id : null;

    const featured = await this.placements.listByArea("COMMUNITIES_FEATURED");
    const featuredIds = new Set(featured.items.map((p) => p.entityId));

    return {
      items: slice.map((c) => ({
        ...c,
        membersCount: c._count.members,
        postsCount: c._count.posts,
        isFeatured: featuredIds.has(c.id),
      })),
      nextCursor,
    };
  }

  async detail(communityId: number) {
    const community = await this.prisma.community.findUnique({
      where: { id: communityId },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        rules: true,
        status: true,
        createdAt: true,
        createdBy: true,
        creator: { select: { id: true, email: true, profile: { select: { firstName: true, lastName: true } } } },
        _count: { select: { members: true, posts: true, questions: true, documents: true } },
      },
    });
    if (!community) throw new NotFoundException("Comunidad no encontrada.");
    return community;
  }

  async archive(communityId: number, adminId: number, reason: string) {
    if (!reason.trim()) throw new BadRequestException("El motivo es obligatorio.");
    const community = await this.prisma.community.findUnique({ where: { id: communityId }, select: { id: true, status: true } });
    if (!community) throw new NotFoundException("Comunidad no encontrada.");
    await this.prisma.community.update({ where: { id: communityId }, data: { status: ContentStatus.HIDDEN } });
    this.cache.invalidate("hot:communities:popular");
    await this.audit.record(adminId, "COMMUNITY_ARCHIVE", "communities", {
      targetType: "Community",
      targetId: communityId,
      reason,
      safeBefore: { status: community.status },
      safeAfter: { status: ContentStatus.HIDDEN },
    });
    return { message: "Comunidad archivada. Ya no acepta nuevas publicaciones." };
  }

  async restore(communityId: number, adminId: number, reason: string) {
    const community = await this.prisma.community.findUnique({ where: { id: communityId }, select: { id: true, status: true } });
    if (!community) throw new NotFoundException("Comunidad no encontrada.");
    await this.prisma.community.update({ where: { id: communityId }, data: { status: ContentStatus.PUBLISHED } });
    this.cache.invalidate("hot:communities:popular");
    await this.audit.record(adminId, "COMMUNITY_RESTORE", "communities", {
      targetType: "Community",
      targetId: communityId,
      reason,
      safeBefore: { status: community.status },
      safeAfter: { status: ContentStatus.PUBLISHED },
    });
    return { message: "Comunidad restaurada." };
  }

  async feature(communityId: number, adminId: number, position = 0) {
    await this.placements.upsert({ area: "COMMUNITIES_FEATURED", entityType: "COMMUNITY", entityId: communityId, position, adminId });
    await this.audit.record(adminId, "COMMUNITY_FEATURE", "communities", { targetType: "Community", targetId: communityId });
    return { message: "Comunidad destacada." };
  }

  async unfeature(communityId: number, adminId: number) {
    await this.placements.deactivate("COMMUNITIES_FEATURED", "COMMUNITY", communityId, adminId);
    await this.audit.record(adminId, "COMMUNITY_UNFEATURE", "communities", { targetType: "Community", targetId: communityId });
    return { message: "Destacado retirado." };
  }
}
