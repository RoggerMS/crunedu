import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { HotReadCacheService } from "../cache/hot-read-cache.service";
import { PAGINATION_LIMITS } from "../common/pagination.constants";

@Injectable()
export class CommunitiesService {
  constructor(private prisma: PrismaService, private readonly cache: HotReadCacheService) {}

  async index() {
    const cacheKey = "hot:communities:popular";
    const cached = this.cache.get<any[]>(cacheKey);
    if (cached) return cached;

    const communities = await this.prisma.community.findMany({
      where: { status: "PUBLISHED" },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        rules: true,
        avatarUrl: true,
        coverUrl: true,
        status: true,
        createdAt: true,
        _count: { select: { members: true, posts: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const response = communities.map((community: any) => ({
      ...community,
      membersCount: community._count.members,
      postsCount: community._count.posts,
    }));

    this.cache.set(cacheKey, response, 30_000);
    return response;
  }

  async findOne(id: number) {
    const community = await this.prisma.community.findFirst({
      where: { id, status: "PUBLISHED" },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        rules: true,
        avatarUrl: true,
        coverUrl: true,
        status: true,
        createdAt: true,
        _count: { select: { members: true, posts: true } },
      },
    });
    if (!community) throw new NotFoundException("Comunidad no encontrada.");
    return { ...community, membersCount: community._count.members, postsCount: community._count.posts };
  }

  async communityPosts(communityId: number, page: number, pageSize: number) {
    await this.ensureCommunityExists(communityId);
    const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
    const safePageSize = Number.isFinite(pageSize) && pageSize > 0 ? Math.min(Math.floor(pageSize), PAGINATION_LIMITS.communityPosts.max) : PAGINATION_LIMITS.communityPosts.default;
    const skip = (safePage - 1) * safePageSize;

    const [total, posts] = await this.prisma.$transaction([
      this.prisma.post.count({ where: { communityId, status: "PUBLISHED" } }),
      this.prisma.post.findMany({
        where: { communityId, status: "PUBLISHED" },
        orderBy: { createdAt: "desc" },
        skip,
        take: safePageSize,
        select: {
          id: true, title: true, content: true, createdAt: true,
          user: { select: { id: true, email: true, profile: { select: { firstName: true, lastName: true } } } },
          community: { select: { id: true, name: true, slug: true } },
          _count: { select: { comments: true } },
        },
      }),
    ]);

    return {
      page: safePage,
      pageSize: safePageSize,
      total,
      totalPages: Math.ceil(total / safePageSize),
      data: posts.map((post: any) => ({
        id: post.id,
        title: post.title,
        content: post.content,
        createdAt: post.createdAt,
        author: {
          id: post.user.id,
          email: post.user.email,
          firstName: post.user.profile?.firstName ?? null,
          lastName: post.user.profile?.lastName ?? null,
        },
        community: post.community,
        commentsCount: post._count.comments,
      })),
    };
  }

  async joinCommunity(communityId: number, userId: number) {
    await this.ensureCommunityExists(communityId);

    const membership = await this.prisma.communityMember.upsert({
      where: { communityId_userId: { communityId, userId } },
      create: { communityId, userId, role: "MEMBER" },
      update: {},
      select: { role: true },
    });

    return { message: "Te uniste a la comunidad.", role: membership.role.toLowerCase() };
  }

  async leaveCommunity(communityId: number, userId: number) {
    await this.ensureCommunityExists(communityId);
    const membership = await this.prisma.communityMember.findUnique({ where: { communityId_userId: { communityId, userId } } });

    if (!membership) {
      throw new BadRequestException("No perteneces a esta comunidad.");
    }

    await this.prisma.communityMember.delete({ where: { communityId_userId: { communityId, userId } } });
    return { message: "Saliste de la comunidad." };
  }

  async recommendedForUser(userId: number) {
    const profile = await this.prisma.profile.findUnique({ where: { userId }, select: { facultyId: true, careerId: true } });

    const communities = await this.prisma.community.findMany({
      where: {
        status: "PUBLISHED",
        OR: [
          { description: { contains: profile?.careerId ? "carrera" : undefined, mode: "insensitive" } },
          { description: { contains: profile?.facultyId ? "facultad" : undefined, mode: "insensitive" } },
          { name: { contains: "Cachimbos", mode: "insensitive" } },
        ],
      },
      take: 5,
      select: { id: true, name: true, slug: true, description: true, rules: true, _count: { select: { members: true, posts: true } } },
    });

    const response = communities.map((community: any) => ({ ...community, membersCount: community._count.members, postsCount: community._count.posts }));
  }

  async hidePost(communityId: number, postId: number, userId: number, reason?: string) {
    const membership = await this.prisma.communityMember.findUnique({ where: { communityId_userId: { communityId, userId } }, select: { role: true } });

    if (!membership || membership.role !== "MODERATOR") {
      throw new ForbiddenException("Solo moderadores pueden ocultar publicaciones.");
    }

    const post = await this.prisma.post.findFirst({ where: { id: postId, communityId }, select: { id: true, status: true } });
    if (!post) throw new NotFoundException("Publicación no encontrada en esta comunidad.");

    await this.prisma.$transaction([
      this.prisma.post.update({ where: { id: postId }, data: { status: "HIDDEN" } }),
      this.prisma.moderationLog.create({
        data: {
          moderatorId: userId,
          action: "HIDE_POST",
          entityType: "POST",
          entityId: postId,
          reason: reason?.trim() || "Ocultado por moderación de comunidad",
        },
      }),
    ]);

    return { message: "Publicación ocultada correctamente." };
  }

  private async ensureCommunityExists(communityId: number) {
    const community = await this.prisma.community.findFirst({ where: { id: communityId, status: "PUBLISHED" }, select: { id: true } });
    if (!community) throw new NotFoundException("Comunidad no encontrada.");
  }
}
