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
            cycle: true,
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
        profile: { select: { firstName: true, lastName: true } },
      },
    });

    if (!user) throw new NotFoundException("Usuario no encontrado.");

    const [isFollowing, isFriend] = viewerUserId
      ? await Promise.all([
          this.prisma.follow.findUnique({ where: { followerId_followingId: { followerId: viewerUserId, followingId: targetUserId } } }),
          this.prisma.follow.findFirst({ where: { followerId: viewerUserId, followingId: targetUserId, following: { followers: { some: { followerId: targetUserId, followingId: viewerUserId } } } } }),
        ])
      : [null, null];

    return {
      id: user.id,
      fullName: `${user.profile?.firstName ?? ""} ${user.profile?.lastName ?? ""}`.trim() || "Estudiante",
      isFollowing: Boolean(isFollowing),
      isFriend: Boolean(isFriend),
    };
  }

  async followUser(currentUserId: number, targetUserId: number) {
    await this.preventFollowSpam(currentUserId, targetUserId);
    if (currentUserId === targetUserId) throw new BadRequestException("No puedes seguirte a ti mismo.");

    await this.ensureUserExists(targetUserId);
    await this.prisma.follow.upsert({
      where: { followerId_followingId: { followerId: currentUserId, followingId: targetUserId } },
      create: { followerId: currentUserId, followingId: targetUserId },
      update: {},
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
      select: { follower: { select: { id: true, profile: { select: { firstName: true, lastName: true } } } } },
      orderBy: { createdAt: "desc" },
    });

    return Promise.all(followers.map(async (item) => ({ ...(await this.getRelationship(viewerUserId ?? 0, item.follower.id, viewerUserId !== undefined)), id: item.follower.id, fullName: `${item.follower.profile?.firstName ?? ""} ${item.follower.profile?.lastName ?? ""}`.trim() || "Estudiante" })));
  }

  async getFollowing(userId: number, viewerUserId?: number) {
    await this.ensureUserExists(userId);
    const following = await this.prisma.follow.findMany({
      where: { followerId: userId },
      select: { following: { select: { id: true, profile: { select: { firstName: true, lastName: true } } } } },
      orderBy: { createdAt: "desc" },
    });

    return Promise.all(following.map(async (item) => ({ ...(await this.getRelationship(viewerUserId ?? 0, item.following.id, viewerUserId !== undefined)), id: item.following.id, fullName: `${item.following.profile?.firstName ?? ""} ${item.following.profile?.lastName ?? ""}`.trim() || "Estudiante" })));
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

  private async getRelationship(currentUserId: number, targetUserId: number, hasViewer = true) {
    if (!hasViewer || !currentUserId) return { isFollowing: false, isFriend: false };
    const [isFollowing, reverse] = await Promise.all([
      this.prisma.follow.findUnique({ where: { followerId_followingId: { followerId: currentUserId, followingId: targetUserId } } }),
      this.prisma.follow.findUnique({ where: { followerId_followingId: { followerId: targetUserId, followingId: currentUserId } } }),
    ]);

    return { isFollowing: Boolean(isFollowing), isFriend: Boolean(isFollowing && reverse) };
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
        cycle: dto.cycle ?? null,
        facultyId: dto.faculty ? (faculty?.id ?? null) : null,
        careerId: dto.career ? (career?.id ?? null) : null,
      },
      update: {
        ...(dto.firstName !== undefined ? { firstName: dto.firstName ?? "" } : {}),
        ...(dto.lastName !== undefined ? { lastName: dto.lastName ?? "" } : {}),
        ...(dto.bio !== undefined ? { description: dto.bio } : {}),
        ...(dto.cycle !== undefined ? { cycle: dto.cycle } : {}),
        ...(dto.faculty !== undefined ? { facultyId: dto.faculty ? (faculty?.id ?? null) : null } : {}),
        ...(dto.career !== undefined ? { careerId: dto.career ? (career?.id ?? null) : null } : {}),
      },
    });

    return this.getMe(userId);
  }
}
