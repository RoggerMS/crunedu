import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { HotReadCacheService } from "../cache/hot-read-cache.service";
import { PAGINATION_LIMITS } from "../common/pagination.constants";
import { CreateCommunityDto } from "./dto/create-community.dto";

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

  async communityPosts(communityId: number, cursor?: number, limit?: number) {
    await this.ensureCommunityExists(communityId);
    const safeLimit = Number.isFinite(limit) && (limit as number) > 0 ? Math.min(Math.floor(limit as number), PAGINATION_LIMITS.communityPosts.max) : PAGINATION_LIMITS.communityPosts.default;
    const posts = await this.prisma.post.findMany({
      where: { communityId, status: "PUBLISHED" },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      take: safeLimit + 1,
      select: {
        id: true, title: true, content: true, createdAt: true,
        user: { select: { id: true, email: true, profile: { select: { firstName: true, lastName: true } } } },
        community: { select: { id: true, name: true, slug: true } },
        _count: { select: { comments: true } },
      },
    });
    const nextCursor = posts.length > safeLimit ? posts[safeLimit].id : null;

    return {
      items: posts.slice(0, safeLimit).map((post: any) => ({
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
      nextCursor,
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

  async create(dto: CreateCommunityDto, userId: number) {
    const baseSlug = this.toSlug(dto.name);
    const uniqueSlug = await this.ensureUniqueSlug(baseSlug);

    const community = await this.prisma.community.create({
      data: {
        name: dto.name.trim(),
        slug: uniqueSlug,
        description: dto.description?.trim() || null,
        rules: dto.rules?.trim() || null,
        avatarUrl: dto.avatarUrl?.trim() || null,
        coverUrl: dto.coverUrl?.trim() || null,
        createdBy: userId,
      },
      select: {
        id: true, name: true, slug: true, description: true, rules: true, avatarUrl: true, coverUrl: true, status: true, createdAt: true,
      },
    });

    await this.prisma.communityMember.create({
      data: { communityId: community.id, userId, role: "MODERATOR" },
    });

    return { ...community, membersCount: 1, postsCount: 0 };
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
        ],
      },
      take: 5,
      select: { id: true, name: true, slug: true, description: true, rules: true, _count: { select: { members: true, posts: true } } },
    });

    const response = communities.map((community: any) => ({ ...community, membersCount: community._count.members, postsCount: community._count.posts }));
    return response;
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

  private toSlug(name: string) {
    return name
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || `comunidad-${Date.now()}`;
  }

  private async ensureUniqueSlug(initialSlug: string) {
    let slug = initialSlug;
    let suffix = 1;
    while (await this.prisma.community.findUnique({ where: { slug }, select: { id: true } })) {
      slug = `${initialSlug}-${suffix}`;
      suffix += 1;
    }
    return slug;
  }
}
