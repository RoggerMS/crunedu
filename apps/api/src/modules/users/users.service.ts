import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, ProfileVisibility } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { StorageService } from "../storage/storage.service";
import { ObservabilityService } from "../observability/observability.service";
import { UpdateMeDto } from "./dto/update-me.dto";
import { UpdateCoverPositionDto } from "./dto/update-cover-position.dto";
import { CreateEducationDto } from "./dto/create-education.dto";
import { CreateEmploymentDto } from "./dto/create-employment.dto";
import { CreateInterestDto, CreateLinkDto, CreateCustomDetailDto } from "./dto/create-profile-items.dto";
import { CreateFeaturedItemDto } from "./dto/create-featured-item.dto";
import { ReorderItemsDto, UpdateSectionSettingsDto } from "./dto/profile-settings.dto";
import { UpdatePrivacySettingsDto } from "./dto/update-privacy-settings.dto";

const RESERVED_USERNAMES = [
  "admin", "root", "system", "support", "help", "about", "api", "app",
  "auth", "login", "register", "settings", "config", "profile", "user",
  "users", "post", "posts", "community", "communities", "search", "legal",
  "terms", "privacy", "crunedu", "moderator", "moderation", "report",
  "reports", "notifications", "feed", "messages", "chat", "mail", "info",
  "contact", "welcome", "home", "index", "dashboard", "panel", "control",
];

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
const AVATAR_MAX_BYTES = 3 * 1024 * 1024;
const COVER_MAX_BYTES = 8 * 1024 * 1024;
const MAX_FEATURED = 3;
const PAGINATION_LIMIT = 20;

type Relation = { isFollowing: boolean; isFollowedBy: boolean; isFriend: boolean };

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly observability: ObservabilityService,
    private readonly storage: StorageService,
  ) {}

  // ==================== CORE PROFILE ====================

  async getMe(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        isVerified: true,
        role: true,
        createdAt: true,
        profile: {
          select: {
            firstName: true,
            lastName: true,
            description: true,
            cycle: true,
            avatarUrl: true,
            coverUrl: true,
            coverPositionY: true,
            username: true,
            headline: true,
            currentCity: true,
            hometown: true,
            gender: true,
            pronouns: true,
            relationshipStatus: true,
            faculty: { select: { id: true, name: true } },
            career: { select: { id: true, name: true } },
            university: { select: { id: true, name: true, shortName: true } },
          },
        },
      },
    });

    if (!user) throw new NotFoundException("Usuario no encontrado.");

    return {
      id: user.id,
      email: user.email,
      isVerified: user.isVerified,
      role: user.role,
      memberSince: user.createdAt,
      firstName: user.profile?.firstName ?? "",
      lastName: user.profile?.lastName ?? "",
      bio: user.profile?.description ?? "",
      avatarUrl: user.profile?.avatarUrl ?? null,
      coverUrl: user.profile?.coverUrl ?? null,
      coverPositionY: user.profile?.coverPositionY ?? 50,
      username: user.profile?.username ?? null,
      headline: user.profile?.headline ?? null,
      currentCity: user.profile?.currentCity ?? null,
      hometown: user.profile?.hometown ?? null,
      gender: user.profile?.gender ?? null,
      pronouns: user.profile?.pronouns ?? null,
      relationshipStatus: user.profile?.relationshipStatus ?? null,
      faculty: user.profile?.faculty?.name ?? "",
      facultyId: user.profile?.faculty?.id ?? null,
      career: user.profile?.career?.name ?? "",
      careerId: user.profile?.career?.id ?? null,
      university: user.profile?.university?.shortName ?? user.profile?.university?.name ?? null,
      cycle: user.profile?.cycle ?? "",
    };
  }

  async getUserProfile(targetUserId: number, viewerUserId?: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        isVerified: true,
        createdAt: true,
        profile: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            description: true,
            avatarUrl: true,
            coverUrl: true,
            coverPositionY: true,
            username: true,
            headline: true,
            currentCity: true,
            hometown: true,
            cycle: true,
            faculty: { select: { name: true } },
            career: { select: { name: true } },
            university: { select: { name: true, shortName: true } },
          },
        },
      },
    });

    if (!user || !user.profile) throw new NotFoundException("Usuario no encontrado.");

    const isMine = viewerUserId === targetUserId;
    const relationship = await this.getRelationship(viewerUserId, targetUserId);

    const [postsCount, followersCount, followingCount, friendsCount] = await Promise.all([
      this.prisma.post.count({ where: { userId: targetUserId, status: "PUBLISHED" } }),
      this.prisma.follow.count({ where: { followingId: targetUserId } }),
      this.prisma.follow.count({ where: { followerId: targetUserId } }),
      this.countMutualFriends(targetUserId),
    ]);

    const privacy = await this.getOrCreatePrivacySettings(user.profile.id);
    const sections = await this.getOrCreateSectionSettings(user.profile.id);

    const canSeeCity = isMine || this.canView(privacy.currentCity, relationship);
    const canSeeAcademic = isMine || this.canView(privacy.academicInfo, relationship);

    return {
      id: user.id,
      fullName: `${user.profile.firstName ?? ""} ${user.profile.lastName ?? ""}`.trim() || "Estudiante",
      username: user.profile.username ?? null,
      headline: user.profile.headline ?? null,
      bio: user.profile.description ?? "",
      avatarUrl: user.profile.avatarUrl ?? null,
      coverUrl: user.profile.coverUrl ?? null,
      coverPositionY: user.profile.coverPositionY ?? 50,
      isVerified: user.isVerified,
      memberSince: user.createdAt,
      academicInfo: canSeeAcademic ? {
        university: user.profile.university?.shortName ?? user.profile.university?.name ?? null,
        faculty: user.profile.faculty?.name ?? null,
        career: user.profile.career?.name ?? null,
        cycle: user.profile.cycle ?? null,
      } : null,
      currentCity: canSeeCity ? user.profile.currentCity ?? null : null,
      stats: {
        posts: postsCount,
        followers: followersCount,
        following: followingCount,
        friends: friendsCount,
      },
      relationship,
      sectionVisibility: {
        featured: sections.featured,
        friends: sections.friends,
        communities: sections.communities,
        photos: sections.photos,
        education: sections.education,
        employment: sections.employment,
        interests: sections.interests,
      },
      isMine,
    };
  }

  async updateMe(userId: number, dto: UpdateMeDto) {
    const profile = await this.prisma.profile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException("Perfil no encontrado.");

    if (dto.username !== undefined && dto.username !== null) {
      const normalized = dto.username.toLowerCase();
      if (RESERVED_USERNAMES.includes(normalized)) {
        throw new BadRequestException("Este nombre de usuario no está disponible.");
      }
      const existing = await this.prisma.profile.findFirst({
        where: { username: { equals: normalized, mode: "insensitive" }, userId: { not: userId } },
        select: { id: true },
      });
      if (existing) throw new BadRequestException("Este nombre de usuario ya está en uso.");
      dto.username = normalized;
    }

    const [faculty, career] = await Promise.all([
      dto.faculty !== undefined && dto.faculty
        ? this.prisma.faculty.findFirst({ where: { name: { equals: dto.faculty, mode: "insensitive" } }, select: { id: true } })
        : null,
      dto.career !== undefined && dto.career
        ? this.prisma.career.findFirst({ where: { name: { equals: dto.career, mode: "insensitive" } }, select: { id: true } })
        : null,
    ]);

    const data: Prisma.ProfileUpdateInput = {};
    if (dto.firstName !== undefined) data.firstName = dto.firstName ?? "";
    if (dto.lastName !== undefined) data.lastName = dto.lastName ?? "";
    if (dto.bio !== undefined) data.description = dto.bio;
    if (dto.cycle !== undefined) data.cycle = dto.cycle;
    if (dto.username !== undefined) data.username = dto.username;
    if (dto.headline !== undefined) data.headline = dto.headline;
    if (dto.currentCity !== undefined) data.currentCity = dto.currentCity;
    if (dto.hometown !== undefined) data.hometown = dto.hometown;
    if (dto.gender !== undefined) data.gender = dto.gender;
    if (dto.pronouns !== undefined) data.pronouns = dto.pronouns;
    if (dto.relationshipStatus !== undefined) data.relationshipStatus = dto.relationshipStatus;
    if (dto.otherNames !== undefined) data.otherNames = dto.otherNames;
    if (dto.favoriteQuote !== undefined) data.favoriteQuote = dto.favoriteQuote;
    if (dto.birthDate !== undefined) data.birthDate = dto.birthDate ? new Date(dto.birthDate) : null;
    if (dto.birthDateDisplay !== undefined && dto.birthDateDisplay) data.birthDateDisplay = dto.birthDateDisplay;
    if (dto.faculty !== undefined) {
      data.faculty = dto.faculty ? (faculty ? { connect: { id: faculty.id } } : undefined) : { disconnect: true };
    }
    if (dto.career !== undefined) {
      data.career = dto.career ? (career ? { connect: { id: career.id } } : undefined) : { disconnect: true };
    }

    await this.prisma.profile.update({ where: { userId }, data });
    return this.getMe(userId);
  }

  // ==================== AVATAR & COVER ====================

  async uploadAvatar(userId: number, file: { buffer: Buffer; mimetype: string; size: number; originalname: string }) {
    this.validateImageFile(file, AVATAR_MAX_BYTES, "avatar");
    const ext = this.getExtension(file.originalname, file.mimetype);
    const profile = await this.prisma.profile.findUniqueOrThrow({ where: { userId }, select: { id: true, avatarStorageKey: true } });

    const result = await this.storage.upload("avatars", file.buffer, file.mimetype, ext);

    await this.prisma.profile.update({
      where: { userId },
      data: { avatarUrl: result.publicUrl, avatarStorageKey: result.storageKey },
    });

    if (profile.avatarStorageKey) {
      await this.storage.delete(profile.avatarStorageKey);
    }

    return { avatarUrl: result.publicUrl };
  }

  async deleteAvatar(userId: number) {
    const profile = await this.prisma.profile.findUniqueOrThrow({ where: { userId }, select: { avatarStorageKey: true } });
    await this.prisma.profile.update({ where: { userId }, data: { avatarUrl: null, avatarStorageKey: null } });
    if (profile.avatarStorageKey) await this.storage.delete(profile.avatarStorageKey);
    return { avatarUrl: null };
  }

  async uploadCover(userId: number, file: { buffer: Buffer; mimetype: string; size: number; originalname: string }) {
    this.validateImageFile(file, COVER_MAX_BYTES, "portada");
    const ext = this.getExtension(file.originalname, file.mimetype);
    const profile = await this.prisma.profile.findUniqueOrThrow({ where: { userId }, select: { id: true, coverStorageKey: true } });

    const result = await this.storage.upload("covers", file.buffer, file.mimetype, ext);

    await this.prisma.profile.update({
      where: { userId },
      data: { coverUrl: result.publicUrl, coverStorageKey: result.storageKey },
    });

    if (profile.coverStorageKey) {
      await this.storage.delete(profile.coverStorageKey);
    }

    return { coverUrl: result.publicUrl };
  }

  async deleteCover(userId: number) {
    const profile = await this.prisma.profile.findUniqueOrThrow({ where: { userId }, select: { coverStorageKey: true } });
    await this.prisma.profile.update({ where: { userId }, data: { coverUrl: null, coverStorageKey: null } });
    if (profile.coverStorageKey) await this.storage.delete(profile.coverStorageKey);
    return { coverUrl: null };
  }

  async updateCoverPosition(userId: number, dto: UpdateCoverPositionDto) {
    await this.prisma.profile.update({ where: { userId }, data: { coverPositionY: dto.coverPositionY } });
    return { coverPositionY: dto.coverPositionY };
  }

  // ==================== FOLLOWS & FRIENDS ====================

  async followUser(currentUserId: number, targetUserId: number) {
    if (currentUserId === targetUserId) throw new BadRequestException("No puedes seguirte a ti mismo.");
    await this.ensureUserExists(targetUserId);

    const existing = await this.prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: currentUserId, followingId: targetUserId } },
    });
    if (existing) return this.getRelationship(currentUserId, targetUserId);

    await this.prisma.follow.upsert({
      where: { followerId_followingId: { followerId: currentUserId, followingId: targetUserId } },
      create: { followerId: currentUserId, followingId: targetUserId },
      update: {},
    });

    const follower = await this.prisma.user.findUnique({
      where: { id: currentUserId },
      select: { profile: { select: { firstName: true, lastName: true } } },
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

  async getFollowers(userId: number, viewerUserId?: number, cursor?: number, limit: number = PAGINATION_LIMIT) {
    await this.ensureUserExists(userId);
    const safeLimit = Math.min(limit, PAGINATION_LIMIT);
    const follows = await this.prisma.follow.findMany({
      where: { followingId: userId },
      select: {
        follower: {
          select: {
            id: true,
            isVerified: true,
            profile: { select: { firstName: true, lastName: true, avatarUrl: true, headline: true, career: { select: { name: true } } } },
          },
        },
      },
      orderBy: [{ createdAt: "desc" }, { followerId: "desc" }],
      ...(cursor ? { cursor: { followerId_followingId: { followerId: cursor, followingId: userId } }, skip: 1 } : {}),
      take: safeLimit + 1,
    });

    const hasNext = follows.length > safeLimit;
    const sliced = follows.slice(0, safeLimit);
    const userIds = sliced.map((f) => f.follower.id);
    const relations = await this.batchRelationships(viewerUserId, userIds);

    return {
      items: sliced.map((f) => this.mapUserSummary(f.follower, relations.get(f.follower.id) ?? this.noRelation())),
      nextCursor: hasNext ? sliced[safeLimit - 1]?.follower.id ?? null : null,
    };
  }

  async getFollowing(userId: number, viewerUserId?: number, cursor?: number, limit: number = PAGINATION_LIMIT) {
    await this.ensureUserExists(userId);
    const safeLimit = Math.min(limit, PAGINATION_LIMIT);
    const follows = await this.prisma.follow.findMany({
      where: { followerId: userId },
      select: {
        following: {
          select: {
            id: true,
            isVerified: true,
            profile: { select: { firstName: true, lastName: true, avatarUrl: true, headline: true, career: { select: { name: true } } } },
          },
        },
      },
      orderBy: [{ createdAt: "desc" }, { followingId: "desc" }],
      ...(cursor ? { cursor: { followerId_followingId: { followerId: userId, followingId: cursor } }, skip: 1 } : {}),
      take: safeLimit + 1,
    });

    const hasNext = follows.length > safeLimit;
    const sliced = follows.slice(0, safeLimit);
    const userIds = sliced.map((f) => f.following.id);
    const relations = await this.batchRelationships(viewerUserId, userIds);

    return {
      items: sliced.map((f) => this.mapUserSummary(f.following, relations.get(f.following.id) ?? this.noRelation())),
      nextCursor: hasNext ? sliced[safeLimit - 1]?.following.id ?? null : null,
    };
  }

  async getFriends(userId: number, viewerUserId?: number, cursor?: number, limit: number = PAGINATION_LIMIT) {
    await this.ensureUserExists(userId);
    const safeLimit = Math.min(limit, PAGINATION_LIMIT);

    const follows = await this.prisma.follow.findMany({
      where: {
        followerId: userId,
        following: { followers: { some: { followerId: userId } } },
      },
      select: {
        following: {
          select: {
            id: true,
            isVerified: true,
            profile: { select: { firstName: true, lastName: true, avatarUrl: true, headline: true, career: { select: { name: true } } } },
          },
        },
      },
      orderBy: [{ createdAt: "desc" }, { followingId: "desc" }],
      ...(cursor ? { cursor: { followerId_followingId: { followerId: userId, followingId: cursor } }, skip: 1 } : {}),
      take: safeLimit + 1,
    });

    const hasNext = follows.length > safeLimit;
    const sliced = follows.slice(0, safeLimit);
    const userIds = sliced.map((f) => f.following.id);
    const relations = await this.batchRelationships(viewerUserId, userIds);

    return {
      items: sliced.map((f) => this.mapUserSummary(f.following, relations.get(f.following.id) ?? this.noRelation())),
      nextCursor: hasNext ? sliced[safeLimit - 1]?.following.id ?? null : null,
    };
  }

  // ==================== PROFILE POSTS ====================

  async getUserPosts(targetUserId: number, viewerUserId?: number, cursor?: number, limit: number = PAGINATION_LIMIT) {
    await this.ensureUserExists(targetUserId);
    const safeLimit = Math.min(limit, PAGINATION_LIMIT);
    const isMine = viewerUserId === targetUserId;
    const relationship = await this.getRelationship(viewerUserId, targetUserId);

    const visibilityFilter = this.buildVisibilityFilter(viewerUserId, isMine, relationship);

    const posts = await this.prisma.post.findMany({
      where: { userId: targetUserId, status: "PUBLISHED", ...visibilityFilter },
      select: {
        id: true,
        title: true,
        content: true,
        inFeed: true,
        visibility: true,
        viewCount: true,
        shareCount: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            isVerified: true,
            profile: { select: { firstName: true, lastName: true, avatarUrl: true, username: true } },
          },
        },
        community: { select: { id: true, name: true, slug: true } },
        images: { select: { id: true, imageUrl: true, mimeType: true, sizeBytes: true, position: true }, orderBy: { position: "asc" } },
        _count: { select: { comments: true, reactions: true, savedBy: true } },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      take: safeLimit + 1,
    });

    const hasNext = posts.length > safeLimit;
    const sliced = posts.slice(0, safeLimit);

    const viewerStates = await this.fetchPostViewerStates(sliced.map((p) => p.id), viewerUserId);

    return {
      items: sliced.map((p) => this.mapPostResponse(p, viewerUserId, viewerStates.get(p.id) ?? null)),
      nextCursor: hasNext ? sliced[safeLimit - 1]?.id ?? null : null,
    };
  }

  // ==================== ABOUT (extended info) ====================

  async getAbout(targetUserId: number, viewerUserId?: number) {
    const profile = await this.prisma.profile.findUnique({ where: { userId: targetUserId } });
    if (!profile) throw new NotFoundException("Perfil no encontrado.");

    const isMine = viewerUserId === targetUserId;
    const relationship = await this.getRelationship(viewerUserId, targetUserId);
    const privacy = await this.getOrCreatePrivacySettings(profile.id);

    const visibilityFilter = (field: ProfileVisibility) => isMine || this.canView(field, relationship);

    const [education, employment, interests, languages, links, places, customDetails] = await Promise.all([
      this.prisma.profileEducation.findMany({
        where: { profileId: profile.id, ...(visibilityFilter(privacy.academicInfo) ? {} : { visibility: "PUBLIC" }) },
        orderBy: { position: "asc" },
      }),
      this.prisma.profileEmployment.findMany({
        where: { profileId: profile.id, ...(visibilityFilter(privacy.academicInfo) ? {} : { visibility: "PUBLIC" }) },
        orderBy: { order: "asc" },
      }),
      this.prisma.profileInterest.findMany({
        where: { profileId: profile.id, ...(visibilityFilter(privacy.academicInfo) ? {} : { visibility: "PUBLIC" }) },
        orderBy: { position: "asc" },
      }),
      this.prisma.profileLanguage.findMany({
        where: { profileId: profile.id, ...(visibilityFilter(privacy.academicInfo) ? {} : { visibility: "PUBLIC" }) },
        orderBy: { position: "asc" },
      }),
      visibilityFilter(privacy.contact)
        ? this.prisma.profileLink.findMany({ where: { profileId: profile.id }, orderBy: { position: "asc" } })
        : [],
      visibilityFilter(privacy.currentCity)
        ? this.prisma.profilePlace.findMany({ where: { profileId: profile.id }, orderBy: { position: "asc" } })
        : [],
      visibilityFilter(privacy.contact)
        ? this.prisma.profileCustomDetail.findMany({ where: { profileId: profile.id }, orderBy: { position: "asc" } })
        : [],
    ]);

    const canSeeBirthDate = visibilityFilter(privacy.birthDate);
    const canSeeRelationship = visibilityFilter(privacy.relationship);

    return {
      education,
      employment,
      interests,
      languages,
      links,
      places,
      customDetails,
      personalInfo: {
        birthDate: canSeeBirthDate ? profile.birthDate ?? null : null,
        birthDateDisplay: canSeeBirthDate ? profile.birthDateDisplay : "HIDDEN",
        gender: canSeeBirthDate ? profile.gender ?? null : null,
        pronouns: canSeeBirthDate ? profile.pronouns ?? null : null,
        relationshipStatus: canSeeRelationship ? profile.relationshipStatus ?? null : null,
        otherNames: visibilityFilter(privacy.bio) ? profile.otherNames ?? null : null,
        favoriteQuote: visibilityFilter(privacy.bio) ? profile.favoriteQuote ?? null : null,
      },
      isMine,
    };
  }

  // ==================== EDUCATION CRUD ====================

  async createEducation(userId: number, dto: CreateEducationDto) {
    const profile = await this.getMyProfile(userId);
    const count = await this.prisma.profileEducation.count({ where: { profileId: profile.id } });
    return this.prisma.profileEducation.create({
      data: { ...dto, profileId: profile.id, position: count, startYear: dto.startYear ?? null, endYear: dto.endYear ?? null, isCurrent: dto.isCurrent ?? false, description: dto.description ?? null, location: dto.location ?? null, program: dto.program ?? null, degree: dto.degree ?? null, field: dto.field ?? null },
    });
  }

  async updateEducation(userId: number, id: number, dto: Partial<CreateEducationDto>) {
    const profile = await this.getMyProfile(userId);
    const item = await this.prisma.profileEducation.findFirst({ where: { id, profileId: profile.id } });
    if (!item) throw new NotFoundException("Registro de formación no encontrado.");
    return this.prisma.profileEducation.update({ where: { id }, data: dto });
  }

  async deleteEducation(userId: number, id: number) {
    const profile = await this.getMyProfile(userId);
    const item = await this.prisma.profileEducation.findFirst({ where: { id, profileId: profile.id } });
    if (!item) throw new NotFoundException("Registro de formación no encontrado.");
    await this.prisma.profileEducation.delete({ where: { id } });
    return { id };
  }

  async reorderEducation(userId: number, dto: ReorderItemsDto) {
    const profile = await this.getMyProfile(userId);
    await Promise.all(
      dto.ids.map((id, index) =>
        this.prisma.profileEducation.updateMany({ where: { id, profileId: profile.id }, data: { position: index } }),
      ),
    );
    return { ids: dto.ids };
  }

  // ==================== EMPLOYMENT CRUD ====================

  async createEmployment(userId: number, dto: CreateEmploymentDto) {
    const profile = await this.getMyProfile(userId);
    const count = await this.prisma.profileEmployment.count({ where: { profileId: profile.id } });
    return this.prisma.profileEmployment.create({
      data: { ...dto, profileId: profile.id, order: count, startDate: dto.startDate ? new Date(dto.startDate) : null, endDate: dto.endDate ? new Date(dto.endDate) : null, isCurrent: dto.isCurrent ?? false, description: dto.description ?? null, modality: dto.modality ?? null, location: dto.location ?? null },
    });
  }

  async updateEmployment(userId: number, id: number, dto: Partial<CreateEmploymentDto>) {
    const profile = await this.getMyProfile(userId);
    const item = await this.prisma.profileEmployment.findFirst({ where: { id, profileId: profile.id } });
    if (!item) throw new NotFoundException("Registro de empleo no encontrado.");
    return this.prisma.profileEmployment.update({ where: { id }, data: dto });
  }

  async deleteEmployment(userId: number, id: number) {
    const profile = await this.getMyProfile(userId);
    const item = await this.prisma.profileEmployment.findFirst({ where: { id, profileId: profile.id } });
    if (!item) throw new NotFoundException("Registro de empleo no encontrado.");
    await this.prisma.profileEmployment.delete({ where: { id } });
    return { id };
  }

  async reorderEmployment(userId: number, dto: ReorderItemsDto) {
    const profile = await this.getMyProfile(userId);
    await Promise.all(
      dto.ids.map((id, index) =>
        this.prisma.profileEmployment.updateMany({ where: { id, profileId: profile.id }, data: { order: index } }),
      ),
    );
    return { ids: dto.ids };
  }

  // ==================== INTERESTS / LINKS / DETAILS ====================

  async createInterest(userId: number, dto: CreateInterestDto) {
    const profile = await this.getMyProfile(userId);
    const count = await this.prisma.profileInterest.count({ where: { profileId: profile.id } });
    return this.prisma.profileInterest.create({ data: { ...dto, profileId: profile.id, position: count } }).catch(() => {
      throw new BadRequestException("Este interés ya fue agregado.");
    });
  }

  async deleteInterest(userId: number, id: number) {
    const profile = await this.getMyProfile(userId);
    const item = await this.prisma.profileInterest.findFirst({ where: { id, profileId: profile.id } });
    if (!item) throw new NotFoundException("Interés no encontrado.");
    await this.prisma.profileInterest.delete({ where: { id } });
    return { id };
  }

  async createLink(userId: number, dto: CreateLinkDto) {
    const profile = await this.getMyProfile(userId);
    const count = await this.prisma.profileLink.count({ where: { profileId: profile.id } });
    return this.prisma.profileLink.create({ data: { ...dto, profileId: profile.id, position: count } });
  }

  async updateLink(userId: number, id: number, dto: Partial<CreateLinkDto>) {
    const profile = await this.getMyProfile(userId);
    const item = await this.prisma.profileLink.findFirst({ where: { id, profileId: profile.id } });
    if (!item) throw new NotFoundException("Enlace no encontrado.");
    return this.prisma.profileLink.update({ where: { id }, data: dto });
  }

  async deleteLink(userId: number, id: number) {
    const profile = await this.getMyProfile(userId);
    const item = await this.prisma.profileLink.findFirst({ where: { id, profileId: profile.id } });
    if (!item) throw new NotFoundException("Enlace no encontrado.");
    await this.prisma.profileLink.delete({ where: { id } });
    return { id };
  }

  async createCustomDetail(userId: number, dto: CreateCustomDetailDto) {
    const profile = await this.getMyProfile(userId);
    const count = await this.prisma.profileCustomDetail.count({ where: { profileId: profile.id } });
    return this.prisma.profileCustomDetail.create({ data: { ...dto, profileId: profile.id, position: count } });
  }

  async deleteCustomDetail(userId: number, id: number) {
    const profile = await this.getMyProfile(userId);
    const item = await this.prisma.profileCustomDetail.findFirst({ where: { id, profileId: profile.id } });
    if (!item) throw new NotFoundException("Dato no encontrado.");
    await this.prisma.profileCustomDetail.delete({ where: { id } });
    return { id };
  }

  // ==================== FEATURED ITEMS ====================

  async getFeatured(targetUserId: number, viewerUserId?: number) {
    const profile = await this.prisma.profile.findUnique({ where: { userId: targetUserId } });
    if (!profile) throw new NotFoundException("Perfil no encontrado.");

    const items = await this.prisma.profileFeaturedItem.findMany({
      where: { profileId: profile.id },
      orderBy: { position: "asc" },
      include: {
        post: {
          select: {
            id: true, title: true, content: true, createdAt: true,
            status: true, visibility: true,
            images: { select: { id: true, imageUrl: true }, take: 1, orderBy: { position: "asc" } },
          },
        },
      },
    });

    const isMine = viewerUserId === targetUserId;
    const relationship = await this.getRelationship(viewerUserId, targetUserId);
    return items
      .filter((item) => item.post && item.post.status === "PUBLISHED")
      .filter((item) => isMine || (item.post ? this.canViewPost(item.post.visibility, relationship) : false))
      .map((item) => ({
        id: item.id,
        entityType: item.entityType,
        entityId: item.entityId,
        position: item.position,
        post: item.post ? { id: item.post.id, title: item.post.title, content: item.post.content, createdAt: item.post.createdAt, imageUrl: item.post.images[0]?.imageUrl ?? null } : null,
      }));
  }

  async createFeatured(userId: number, dto: CreateFeaturedItemDto) {
    const profile = await this.getMyProfile(userId);
    const post = await this.prisma.post.findFirst({ where: { id: dto.entityId, userId, status: "PUBLISHED" } });
    if (!post) throw new NotFoundException("Publicación no encontrada o no te pertenece.");

    const count = await this.prisma.profileFeaturedItem.count({ where: { profileId: profile.id, entityType: "POST" } });
    if (count >= MAX_FEATURED) throw new BadRequestException(`Solo puedes fijar hasta ${MAX_FEATURED} publicaciones.`);

    return this.prisma.profileFeaturedItem.create({
      data: { profileId: profile.id, entityType: "POST", entityId: dto.entityId, position: count },
    }).catch(() => { throw new BadRequestException("Esta publicación ya está en tus destacados."); });
  }

  async deleteFeatured(userId: number, id: number) {
    const profile = await this.getMyProfile(userId);
    const item = await this.prisma.profileFeaturedItem.findFirst({ where: { id, profileId: profile.id } });
    if (!item) throw new NotFoundException("Destacado no encontrado.");
    await this.prisma.profileFeaturedItem.delete({ where: { id } });
    return { id };
  }

  async reorderFeatured(userId: number, dto: ReorderItemsDto) {
    const profile = await this.getMyProfile(userId);
    await Promise.all(
      dto.ids.map((id, index) =>
        this.prisma.profileFeaturedItem.updateMany({ where: { id, profileId: profile.id }, data: { position: index } }),
      ),
    );
    return { ids: dto.ids };
  }

  // ==================== SECTION & PRIVACY SETTINGS ====================

  async getSectionSettings(userId: number) {
    const profile = await this.getMyProfile(userId);
    return this.getOrCreateSectionSettings(profile.id);
  }

  async updateSectionSettings(userId: number, dto: UpdateSectionSettingsDto) {
    const profile = await this.getMyProfile(userId);
    return this.prisma.profileSectionSetting.upsert({
      where: { profileId: profile.id },
      create: { profileId: profile.id, ...dto },
      update: dto,
    });
  }

  async getPrivacySettings(userId: number) {
    const profile = await this.getMyProfile(userId);
    return this.getOrCreatePrivacySettings(profile.id);
  }

  async updatePrivacySettings(userId: number, dto: UpdatePrivacySettingsDto) {
    const profile = await this.getMyProfile(userId);
    return this.prisma.profilePrivacySetting.upsert({
      where: { profileId: profile.id },
      create: { profileId: profile.id, ...dto },
      update: dto,
    });
  }

  // ==================== STORAGE FILE SERVING ====================

  async serveStorageFile(folder: string, filename: string): Promise<{ buffer: Buffer; mimeType: string }> {
    const storageKey = `${folder}/${filename}`;
    const stat = await this.storage.statObject(storageKey);
    const mimeType = stat.metaData?.["content-type"] ?? "application/octet-stream";
    const buffer = await this.storage.getObject(storageKey);
    return { buffer, mimeType };
  }

  // ==================== HELPERS ====================

  private async getRelationship(currentUserId: number | undefined, targetUserId: number): Promise<Relation> {
    if (!currentUserId || currentUserId === targetUserId) {
      if (!currentUserId) return { isFollowing: false, isFollowedBy: false, isFriend: false };
    }
    const [isFollowing, isFollowedBy] = await Promise.all([
      this.prisma.follow.findUnique({ where: { followerId_followingId: { followerId: currentUserId!, followingId: targetUserId } } }),
      this.prisma.follow.findUnique({ where: { followerId_followingId: { followerId: targetUserId, followingId: currentUserId! } } }),
    ]);
    return {
      isFollowing: Boolean(isFollowing),
      isFollowedBy: Boolean(isFollowedBy),
      isFriend: Boolean(isFollowing && isFollowedBy),
    };
  }

  private async batchRelationships(viewerUserId: number | undefined, targetUserIds: number[]): Promise<Map<number, Relation>> {
    const map = new Map<number, Relation>();
    for (const id of targetUserIds) map.set(id, { isFollowing: false, isFollowedBy: false, isFriend: false });
    if (!viewerUserId || targetUserIds.length === 0) return map;

    const [following, followedBy] = await Promise.all([
      this.prisma.follow.findMany({ where: { followerId: viewerUserId, followingId: { in: targetUserIds } }, select: { followingId: true } }),
      this.prisma.follow.findMany({ where: { followingId: viewerUserId, followerId: { in: targetUserIds } }, select: { followerId: true } }),
    ]);

    const followingSet = new Set(following.map((f) => f.followingId));
    const followedBySet = new Set(followedBy.map((f) => f.followerId));

    for (const id of targetUserIds) {
      const isFollowing = followingSet.has(id);
      const isFollowedBy = followedBySet.has(id);
      map.set(id, { isFollowing, isFollowedBy, isFriend: isFollowing && isFollowedBy });
    }
    return map;
  }

  private async countMutualFriends(userId: number): Promise<number> {
    return this.prisma.follow.count({
      where: { followerId: userId, following: { followers: { some: { followerId: userId } } } },
    });
  }

  private async ensureUserExists(userId: number) {
    const exists = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!exists) throw new NotFoundException("Usuario no encontrado.");
  }

  private async getMyProfile(userId: number) {
    const profile = await this.prisma.profile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException("Perfil no encontrado.");
    return profile;
  }

  private async getOrCreatePrivacySettings(profileId: number) {
    return this.prisma.profilePrivacySetting.upsert({
      where: { profileId },
      create: { profileId },
      update: {},
    });
  }

  private async getOrCreateSectionSettings(profileId: number) {
    return this.prisma.profileSectionSetting.upsert({
      where: { profileId },
      create: { profileId },
      update: {},
    });
  }

  private canView(visibility: ProfileVisibility, relationship: Relation): boolean {
    switch (visibility) {
      case "PUBLIC": return true;
      case "FOLLOWERS": return relationship.isFollowing || relationship.isFriend;
      case "FRIENDS": return relationship.isFriend;
      case "ONLY_ME": return false;
      default: return false;
    }
  }

  private canViewPost(visibility: string, relationship: Relation): boolean {
    switch (visibility) {
      case "PUBLIC": return true;
      case "FOLLOWERS": return relationship.isFollowing || relationship.isFriend;
      case "FRIENDS": return relationship.isFriend;
      case "ONLY_ME": return false;
      default: return true;
    }
  }

  private buildVisibilityFilter(viewerUserId: number | undefined, isMine: boolean, relationship: Relation): Prisma.PostWhereInput {
    if (isMine) return {};
    if (!viewerUserId) return { visibility: "PUBLIC" };
    if (relationship.isFriend) return { visibility: { in: ["PUBLIC", "FOLLOWERS", "FRIENDS"] } };
    if (relationship.isFollowing) return { visibility: { in: ["PUBLIC", "FOLLOWERS"] } };
    return { visibility: "PUBLIC" };
  }

  private async fetchPostViewerStates(postIds: number[], userId?: number): Promise<Map<number, { liked: boolean; saved: boolean }>> {
    const map = new Map<number, { liked: boolean; saved: boolean }>();
    if (!userId || postIds.length === 0) return map;
    for (const id of postIds) map.set(id, { liked: false, saved: false });
    const [likes, saves] = await Promise.all([
      this.prisma.reaction.findMany({ where: { userId, postId: { in: postIds } }, select: { postId: true } }),
      this.prisma.savedPost.findMany({ where: { userId, postId: { in: postIds } }, select: { postId: true } }),
    ]);
    for (const l of likes) map.get(l.postId)!.liked = true;
    for (const s of saves) map.get(s.postId)!.saved = true;
    return map;
  }

  private mapPostResponse(post: any, userId?: number, viewer?: { liked: boolean; saved: boolean } | null) {
    return {
      id: post.id,
      title: post.title,
      content: post.content,
      inFeed: post.inFeed,
      visibility: post.visibility,
      viewCount: post.viewCount,
      shareCount: post.shareCount,
      createdAt: post.createdAt,
      author: {
        id: post.user.id,
        firstName: post.user.profile?.firstName ?? null,
        lastName: post.user.profile?.lastName ?? null,
        avatarUrl: post.user.profile?.avatarUrl ?? null,
        username: post.user.profile?.username ?? null,
        isVerified: post.user.isVerified ?? false,
      },
      community: post.community,
      document: null,
      commentsCount: post._count?.comments ?? 0,
      likesCount: post._count?.reactions ?? 0,
      savesCount: post._count?.savedBy ?? 0,
      images: post.images,
      isMine: Boolean(userId && post.user.id === userId),
      liked: viewer?.liked ?? false,
      saved: viewer?.saved ?? false,
    };
  }

  private mapUserSummary(user: any, relation: Relation) {
    return {
      id: user.id,
      fullName: `${user.profile?.firstName ?? ""} ${user.profile?.lastName ?? ""}`.trim() || "Estudiante",
      avatarUrl: user.profile?.avatarUrl ?? null,
      headline: user.profile?.headline ?? null,
      career: user.profile?.career?.name ?? null,
      isVerified: user.isVerified ?? false,
      ...relation,
    };
  }

  private noRelation(): Relation {
    return { isFollowing: false, isFollowedBy: false, isFriend: false };
  }

  private validateImageFile(file: { buffer: Buffer; mimetype: string; size: number; originalname: string }, maxBytes: number, label: string) {
    if (!file) throw new BadRequestException(`Debes adjuntar una imagen para el ${label}.`);
    if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) throw new BadRequestException("Formato no permitido. Solo JPG, JPEG, PNG o WEBP.");
    if (file.size > maxBytes) throw new BadRequestException(`La imagen supera el límite de ${Math.round(maxBytes / 1024 / 1024)}MB.`);
    const magic = file.buffer.subarray(0, 4);
    const isJpeg = magic[0] === 0xff && magic[1] === 0xd8;
    const isPng = magic[0] === 0x89 && magic[1] === 0x50 && magic[2] === 0x4e && magic[3] === 0x47;
    const isWebp = magic[0] === 0x52 && magic[1] === 0x49 && magic[2] === 0x46 && magic[3] === 0x46;
    if (!isJpeg && !isPng && !isWebp) throw new BadRequestException("El contenido del archivo no corresponde a una imagen válida.");
  }

  private getExtension(originalname: string, mimetype: string): string {
    const ext = originalname.split(".").pop()?.toLowerCase();
    if (ext && ["jpg", "jpeg", "png", "webp"].includes(ext)) return ext === "jpeg" ? "jpg" : ext;
    if (mimetype === "image/png") return "png";
    if (mimetype === "image/webp") return "webp";
    return "jpg";
  }
}
