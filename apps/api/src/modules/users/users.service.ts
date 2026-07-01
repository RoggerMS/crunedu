import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { UpdateMeDto } from "./dto/update-me.dto";
import { ObservabilityService } from "../observability/observability.service";

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly observability: ObservabilityService,
  ) {}

  async getMe(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        profile: {
          select: {
            firstName: true,
            lastName: true,
            description: true,
            username: true,
            headline: true,
            currentCity: true,
            hometown: true,
            cycle: true,
            avatarUrl: true,
            coverUrl: true,
            coverPositionY: true,
            faculty: { select: { name: true } },
            career: { select: { name: true } },
          },
        },
      },
    });

    if (!user) throw new NotFoundException("Usuario no encontrado.");

    return {
      id: user.id,
      email: user.email,
      firstName: user.profile?.firstName ?? "",
      lastName: user.profile?.lastName ?? "",
      bio: user.profile?.description ?? "",
      username: user.profile?.username ?? "",
      headline: user.profile?.headline ?? "",
      currentCity: user.profile?.currentCity ?? "",
      hometown: user.profile?.hometown ?? "",
      coverUrl: user.profile?.coverUrl ?? null,
      coverPositionY: user.profile?.coverPositionY ?? 50,
      avatarUrl: user.profile?.avatarUrl ?? null,
      faculty: user.profile?.faculty?.name ?? "",
      career: user.profile?.career?.name ?? "",
      cycle: user.profile?.cycle ?? "",
    };
  }

  async getUserProfile(targetUserId: number, viewerUserId?: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        profile: {
          select: {
            firstName: true,
            lastName: true,
            description: true,
            username: true,
            headline: true,
            coverUrl: true,
            coverPositionY: true,
            currentCity: true,
            hometown: true,
            avatarUrl: true,
            faculty: { select: { name: true } },
            career: { select: { name: true } },
            cycle: true,
          },
        },
        communityMembers: {
          take: 5,
          orderBy: { joinedAt: "desc" },
          select: { community: { select: { id: true, name: true, slug: true } } },
        },
        posts: {
          where: { status: "PUBLISHED", ...this.buildPostVisibilityWhere(viewerUserId) },
          take: 5,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            title: true,
            content: true,
            createdAt: true,
            community: { select: { id: true, name: true } },
          },
        },
        _count: { select: { posts: true, answers: true, followers: true, following: true } },
      },
    });

    if (!user) throw new NotFoundException("Usuario no encontrado.");

    const relationship = await this.getRelationship(viewerUserId, targetUserId);

    return {
      id: user.id,
      fullName: `${user.profile?.firstName ?? ""} ${user.profile?.lastName ?? ""}`.trim() || "Estudiante",
      bio: user.profile?.description ?? "",
      username: user.profile?.username ?? "",
      headline: user.profile?.headline ?? "",
      currentCity: user.profile?.currentCity ?? "",
      hometown: user.profile?.hometown ?? "",
      coverUrl: user.profile?.coverUrl ?? null,
      coverPositionY: user.profile?.coverPositionY ?? 50,
      avatarUrl: user.profile?.avatarUrl ?? null,
      academicInfo: {
        faculty: user.profile?.faculty?.name ?? null,
        career: user.profile?.career?.name ?? null,
        cycle: user.profile?.cycle ?? null,
      },
      activeCommunities: user.communityMembers.map((item: { community: { id: number; name: string; slug: string } }) => item.community),
      recentPosts: user.posts.map((post: { id: number; title: string; content: string; createdAt: Date; community: { id: number; name: string } | null }) => ({
        id: post.id,
        title: post.title,
        content: post.content,
        createdAt: post.createdAt,
        community: post.community,
      })),
      activitySummary: {
        recentContributions: user.posts.slice(0, 3).map((post: { id: number; title: string; createdAt: Date }) => ({
          type: "POST",
          id: post.id,
          title: post.title,
          createdAt: post.createdAt,
        })),
      },
      reputation: {
        usefulContributions: user._count.posts,
        answersGiven: user._count.answers,
      },
      stats: {
        posts: user._count.posts,
        followers: user._count.followers,
        following: user._count.following,
      },
      isMine: viewerUserId === targetUserId,
      relationship,
    };
  }

  async followUser(currentUserId: number, targetUserId: number) {
    if (currentUserId === targetUserId) throw new BadRequestException("No puedes seguirte a ti mismo.");

    await this.ensureUserExists(targetUserId);
    const existingFollow = await this.prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: currentUserId, followingId: targetUserId } },
    });
    if (existingFollow) return this.getRelationship(currentUserId, targetUserId);

    await this.prisma.follow.upsert({
      where: { followerId_followingId: { followerId: currentUserId, followingId: targetUserId } },
      create: { followerId: currentUserId, followingId: targetUserId },
      update: {},
    });

    const follower = await this.prisma.user.findUnique({
      where: { id: currentUserId },
      select: { profile: { select: { firstName: true, lastName: true, avatarUrl: true } } },
    });
    const followerName = `${follower?.profile?.firstName ?? ""} ${follower?.profile?.lastName ?? ""}`.trim() || "Un estudiante";
    await this.prisma.notification.create({
      data: {
        userId: targetUserId,
        type: "NEW_FOLLOWER",
        title: "Tienes un nuevo seguidor",
        message: `${followerName} comenzó a seguirte.`,
        referenceId: currentUserId,
        referenceType: "USER",
      },
    });

    this.observability.recordFollow(currentUserId, targetUserId);
    return this.getRelationship(currentUserId, targetUserId);
  }

  async unfollowUser(currentUserId: number, targetUserId: number) {
    await this.prisma.follow.deleteMany({ where: { followerId: currentUserId, followingId: targetUserId } });
    this.observability.recordUnfollow(currentUserId, targetUserId);
    return this.getRelationship(currentUserId, targetUserId);
  }

  async getFollowers(userId: number, viewerUserId?: number) {
    await this.ensureUserExists(userId);
    const followers = await this.prisma.follow.findMany({
      where: { followingId: userId },
      select: { follower: { select: { id: true, profile: { select: { firstName: true, lastName: true, avatarUrl: true } } } } },
      orderBy: { createdAt: "desc" },
    });

    const relationships = await this.getRelationships(viewerUserId, followers.map((item) => item.follower.id));
    return followers.map((item) => ({
      ...(relationships.get(item.follower.id) ?? this.emptyRelationship()),
      id: item.follower.id,
      fullName: `${item.follower.profile?.firstName ?? ""} ${item.follower.profile?.lastName ?? ""}`.trim() || "Estudiante",
      avatarUrl: item.follower.profile?.avatarUrl ?? null,
    }));
  }

  async getFollowing(userId: number, viewerUserId?: number) {
    await this.ensureUserExists(userId);
    const following = await this.prisma.follow.findMany({
      where: { followerId: userId },
      select: { following: { select: { id: true, profile: { select: { firstName: true, lastName: true, avatarUrl: true } } } } },
      orderBy: { createdAt: "desc" },
    });

    const relationships = await this.getRelationships(viewerUserId, following.map((item) => item.following.id));
    return following.map((item) => ({
      ...(relationships.get(item.following.id) ?? this.emptyRelationship()),
      id: item.following.id,
      fullName: `${item.following.profile?.firstName ?? ""} ${item.following.profile?.lastName ?? ""}`.trim() || "Estudiante",
      avatarUrl: item.following.profile?.avatarUrl ?? null,
    }));
  }

  async getFriends(userId: number, viewerUserId?: number) {
    await this.ensureUserExists(userId);
    const friends = await this.prisma.follow.findMany({
      where: {
        followerId: userId,
        following: {
          followers: {
            some: { followerId: userId },
          },
        },
      },
      select: {
        following: {
          select: {
            id: true,
            profile: { select: { firstName: true, lastName: true, avatarUrl: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const relationships = await this.getRelationships(viewerUserId, friends.map((item) => item.following.id));
    return friends.map((item) => ({
      ...(relationships.get(item.following.id) ?? this.emptyRelationship()),
      id: item.following.id,
      fullName: `${item.following.profile?.firstName ?? ""} ${item.following.profile?.lastName ?? ""}`.trim() || "Estudiante",
      avatarUrl: item.following.profile?.avatarUrl ?? null,
    }));
  }

  async getUserPosts(targetUserId: number, viewerUserId?: number) {
    await this.ensureUserExists(targetUserId);
    const posts = await this.prisma.post.findMany({
      where: { userId: targetUserId, status: "PUBLISHED", ...this.buildPostVisibilityWhere(viewerUserId) },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 30,
      select: { id: true, title: true, content: true, createdAt: true, visibility: true, inFeed: true, images: { select: { id: true, imageUrl: true, mimeType: true }, orderBy: { position: "asc" } }, community: { select: { id: true, name: true } }, _count: { select: { comments: true, reactions: true } } },
    });
    return { items: posts.map((post) => ({ ...post, commentsCount: post._count.comments, likesCount: post._count.reactions, _count: undefined })) };
  }

  private async preventFollowSpam(currentUserId: number, targetUserId: number): Promise<void> {
    const recentFollow = await this.prisma.follow.findFirst({
      where: { followerId: currentUserId, followingId: targetUserId },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });

    if (!recentFollow) return;
    const createdWithinThirtySeconds = Date.now() - recentFollow.createdAt.getTime() <= 30_000;
    if (createdWithinThirtySeconds) {
      console.warn(JSON.stringify({ level: "warn", message: "spam_blocked", type: "duplicate_follow", userId: currentUserId, targetUserId, timestamp: new Date().toISOString() }));
      throw new BadRequestException("Espera unos segundos antes de repetir esta acción.");
    }
  }

  private emptyRelationship() {
    return { isFollowing: false, isFollowedBy: false, isFriend: false };
  }

  private async getRelationships(currentUserId: number | undefined, targetUserIds: number[]) {
    const uniqueIds = [...new Set(targetUserIds)];
    const map = new Map<number, { isFollowing: boolean; isFollowedBy: boolean; isFriend: boolean }>();
    for (const id of uniqueIds) map.set(id, this.emptyRelationship());
    if (!currentUserId || uniqueIds.length === 0) return map;

    const [following, followedBy] = await Promise.all([
      this.prisma.follow.findMany({ where: { followerId: currentUserId, followingId: { in: uniqueIds } }, select: { followingId: true } }),
      this.prisma.follow.findMany({ where: { followerId: { in: uniqueIds }, followingId: currentUserId }, select: { followerId: true } }),
    ]);
    for (const row of following) map.get(row.followingId)!.isFollowing = true;
    for (const row of followedBy) map.get(row.followerId)!.isFollowedBy = true;
    for (const value of map.values()) value.isFriend = value.isFollowing && value.isFollowedBy;
    return map;
  }

  private buildPostVisibilityWhere(viewerUserId?: number) {
    if (!viewerUserId) return { visibility: "PUBLIC" as const };
    return { OR: [{ visibility: "PUBLIC" as const }, { userId: viewerUserId }, { visibility: "FOLLOWERS" as const, user: { followers: { some: { followerId: viewerUserId } } } }, { visibility: "FRIENDS" as const, user: { followers: { some: { followerId: viewerUserId } }, following: { some: { followingId: viewerUserId } } } }] };
  }

  private async getRelationship(currentUserId: number | undefined, targetUserId: number) {
    if (!currentUserId) return { isFollowing: false, isFollowedBy: false, isFriend: false };
    const [isFollowing, isFollowedBy] = await Promise.all([
      this.prisma.follow.findUnique({ where: { followerId_followingId: { followerId: currentUserId, followingId: targetUserId } } }),
      this.prisma.follow.findUnique({ where: { followerId_followingId: { followerId: targetUserId, followingId: currentUserId } } }),
    ]);

    return {
      isFollowing: Boolean(isFollowing),
      isFollowedBy: Boolean(isFollowedBy),
      isFriend: Boolean(isFollowing && isFollowedBy),
    };
  }

  private async ensureUserExists(userId: number) {
    const exists = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!exists) throw new NotFoundException("Usuario no encontrado.");
  }

  async updateMe(userId: number, dto: UpdateMeDto) {
    const [faculty, career] = await Promise.all([
      dto.faculty
        ? this.prisma.faculty.findFirst({ where: { name: { equals: dto.faculty, mode: "insensitive" } }, select: { id: true } })
        : null,
      dto.career
        ? this.prisma.career.findFirst({ where: { name: { equals: dto.career, mode: "insensitive" } }, select: { id: true } })
        : null,
    ]);

    await this.prisma.profile.upsert({
      where: { userId },
      create: {
        userId,
        firstName: dto.firstName ?? "",
        lastName: dto.lastName ?? "",
        description: dto.bio ?? null,
        username: dto.username?.toLowerCase() ?? null,
        headline: dto.headline ?? null,
        currentCity: dto.currentCity ?? null,
        hometown: dto.hometown ?? null,
        coverPositionY: dto.coverPositionY ?? 50,
        cycle: dto.cycle ?? null,
        facultyId: dto.faculty ? (faculty?.id ?? null) : null,
        careerId: dto.career ? (career?.id ?? null) : null,
      },
      update: {
        ...(dto.firstName !== undefined ? { firstName: dto.firstName ?? "" } : {}),
        ...(dto.lastName !== undefined ? { lastName: dto.lastName ?? "" } : {}),
        ...(dto.bio !== undefined ? { description: dto.bio } : {}),
        ...(dto.username !== undefined ? { username: dto.username?.toLowerCase() ?? null } : {}),
        ...(dto.headline !== undefined ? { headline: dto.headline } : {}),
        ...(dto.currentCity !== undefined ? { currentCity: dto.currentCity } : {}),
        ...(dto.hometown !== undefined ? { hometown: dto.hometown } : {}),
        ...(dto.coverPositionY !== undefined ? { coverPositionY: dto.coverPositionY } : {}),
        ...(dto.cycle !== undefined ? { cycle: dto.cycle } : {}),
        ...(dto.faculty !== undefined ? { facultyId: dto.faculty ? (faculty?.id ?? null) : null } : {}),
        ...(dto.career !== undefined ? { careerId: dto.career ? (career?.id ?? null) : null } : {}),
      },
    });

    return this.getMe(userId);
  }
}
