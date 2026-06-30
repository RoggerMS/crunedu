import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  Conversation,
  ConversationParticipantRole,
  ConversationRecordingStatus,
  ConversationStatus,
  ConversationVisibility,
  Prisma,
} from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { ConversationsPermissionsService } from "./conversations-permissions.service";
import { ConversationsLivekitService } from "./conversations-livekit.service";
import { ConversationsRecordingsService } from "./conversations-recordings.service";
import {
  CreateConversationDto,
  UpdateConversationDto,
  GetConversationsQueryDto,
  CreateSharedLinkDto,
  CreateMaterialDto,
  CreateArgumentDto,
  UpdateArgumentDto,
  CreateInviteDto,
  CompanionProfileDto,
  GetCompanionsQueryDto,
  GetRecordingsQueryDto,
  UpdateParticipantRoleDto,
  BanDto,
} from "./dto";
import {
  CONVERSATION_MAX_MATERIALS,
  CONVERSATION_MEDIA_PUBLIC_PATH,
  CONVERSATION_STORAGE_FOLDER,
  extractDomain,
  findMaterialRule,
  isSafeUrl,
  randomToken,
  toSlug,
  hashToken,
} from "./conversations.constants";
import { PAGINATION_LIMITS } from "../common/pagination.constants";

type Author = {
  id: number;
  email: string;
  profile: { firstName: string | null; lastName: string | null; avatarUrl: string | null } | null;
};

const conversationInclude = {
  creator: {
    select: {
      id: true,
      email: true,
      profile: { select: { firstName: true, lastName: true, avatarUrl: true } },
    },
  },
  university: { select: { id: true, name: true, shortName: true } },
  participants: {
    where: { leftAt: null },
    select: {
      id: true,
      role: true,
      joinedAt: true,
      userId: true,
      user: {
        select: {
          id: true,
          email: true,
          profile: { select: { firstName: true, lastName: true, avatarUrl: true } },
        },
      },
    },
  },
  materials: {
    select: {
      id: true,
      title: true,
      type: true,
      fileUrl: true,
      mimeType: true,
      sizeBytes: true,
      createdAt: true,
      uploadedById: true,
    },
    orderBy: { createdAt: "desc" as const },
  },
  links: {
    select: { id: true, title: true, url: true, domain: true, type: true, createdAt: true, sharedById: true },
    orderBy: { createdAt: "desc" as const },
  },
  _count: {
    select: {
      participants: { where: { leftAt: null } },
      startSubscriptions: true,
    },
  },
} satisfies Prisma.ConversationInclude;

type ConversationRow = Prisma.ConversationGetPayload<{ include: typeof conversationInclude }>;

function mapAuthor(author: Author) {
  const name = author.profile
    ? `${author.profile.firstName ?? ""} ${author.profile.lastName ?? ""}`.trim()
    : author.email;
  return {
    id: author.id,
    name: name || author.email,
    avatarUrl: author.profile?.avatarUrl ?? null,
  };
}

@Injectable()
export class ConversationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissions: ConversationsPermissionsService,
    private readonly livekit: ConversationsLivekitService,
    private readonly recordingsService: ConversationsRecordingsService,
  ) {}

  // ---------- LISTING ----------
  async index(query: GetConversationsQueryDto, viewerUserId?: number, viewerRole?: string) {
    const limit = Math.min(query.limit ?? PAGINATION_LIMITS.momentsFeed.default, PAGINATION_LIMITS.momentsFeed.max);
    const where: Prisma.ConversationWhereInput = { deletedAt: null };

    if (query.status) where.status = query.status as ConversationStatus;
    if (query.type) where.type = query.type;
    if (query.visibility) where.visibility = query.visibility as ConversationVisibility;
    if (query.category) where.category = { contains: query.category.trim(), mode: "insensitive" };
    if (query.course) where.course = { contains: query.course.trim(), mode: "insensitive" };
    if (query.createdBy) where.createdById = query.createdBy;
    if (query.search) {
      where.OR = [
        { title: { contains: query.search.trim(), mode: "insensitive" } },
        { description: { contains: query.search.trim(), mode: "insensitive" } },
      ];
    }

    // Visibility scoping for non-admins
    const isAdmin = viewerRole === "ADMIN" || viewerRole === "MODERATOR";
    if (!isAdmin) {
      const viewerProfile = viewerUserId
        ? await this.prisma.profile.findUnique({ where: { userId: viewerUserId }, select: { universityId: true } })
        : null;
      const visibleConditions: Prisma.ConversationWhereInput[] = [
        { visibility: "PUBLIC" },
      ];
      if (viewerProfile?.universityId) {
        visibleConditions.push({ visibility: "UNIVERSITY", universityId: viewerProfile.universityId });
      }
      if (viewerUserId) {
        visibleConditions.push({ createdById: viewerUserId });
        visibleConditions.push({ participants: { some: { userId: viewerUserId } } });
      }
      where.AND = [{ OR: visibleConditions }];
    }

    const rows = await this.prisma.conversation.findMany({
      where,
      include: conversationInclude,
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(query.cursor ? { skip: 1, cursor: { id: Number(query.cursor) } } : {}),
    });

    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    return {
      items: items.map((r) => this.mapConversation(r, viewerUserId)),
      nextCursor: hasMore ? String(items[items.length - 1].id) : null,
    };
  }

  async getLive(viewerUserId?: number, viewerRole?: string) {
    return this.index({ status: "LIVE", limit: 30 }, viewerUserId, viewerRole);
  }

  async getWaiting(viewerUserId?: number, viewerRole?: string) {
    return this.index({ status: "WAITING", limit: 30 }, viewerUserId, viewerRole);
  }

  async getDebates(viewerUserId?: number, viewerRole?: string) {
    return this.index({ type: "DEBATE", limit: 30 }, viewerUserId, viewerRole);
  }

  async detail(id: number, viewerUserId?: number, viewerRole?: string, inviteToken?: string) {
    const row = await this.prisma.conversation.findFirst({
      where: { id, deletedAt: null },
      include: {
        ...conversationInclude,
        debateStances: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            title: true,
            description: true,
            order: true,
            _count: { select: { memberships: true, arguments: { where: { deletedAt: null } } } },
          },
        },
        recordings: {
          where: { deletedAt: null, status: "AVAILABLE" },
          select: { id: true, durationSeconds: true, plays: true, status: true },
          orderBy: { createdAt: "desc" },
        },
        bans: { select: { userId: true, expiresAt: true } },
      },
    });
    if (!row) throw new NotFoundException("Conversación no encontrada.");
    const canSee = await this.permissions.canViewerSee(row, viewerUserId, viewerRole, inviteToken);
    if (!canSee) throw new NotFoundException("Conversación no encontrada.");
    return this.mapConversationDetail(row, viewerUserId);
  }

  // ---------- CREATE / EDIT ----------
  async create(dto: CreateConversationDto, userId: number) {
    const title = dto.title.trim();
    const description = dto.description.trim();
    if (!title || !description) throw new BadRequestException("El título y la descripción son obligatorios.");

    const profile = await this.prisma.profile.findUnique({ where: { userId }, select: { universityId: true } });
    const visibility = (dto.visibility ?? "PUBLIC") as ConversationVisibility;
    const type = (dto.type ?? "OPEN") as Conversation["type"];
    const universityId = visibility === "UNIVERSITY" ? profile?.universityId ?? null : null;
    const maxParticipants = dto.maxParticipants ?? 50;
    const maxSpeakers = dto.maxSpeakers ?? 5;

    this.validateCapacity(maxParticipants, maxSpeakers);
    if (visibility === "UNIVERSITY" && !universityId) {
      throw new BadRequestException("Completa tu universidad en el perfil antes de crear una conversación solo para tu universidad.");
    }

    if (type === "DEBATE" && (!dto.initialStances || dto.initialStances.length < 2)) {
      throw new BadRequestException("Un debate necesita al menos dos posturas iniciales.");
    }

    const baseSlug = toSlug(title);
    const slug = await this.ensureUniqueSlug(baseSlug);
    const livekitRoomName = `conv-${slug}-${Date.now().toString(36)}`;
    const status: ConversationStatus = dto.startNow ? "LIVE" : "WAITING";

    const tags = (dto.tags ?? []).map((t) => t.trim()).filter(Boolean).slice(0, 8);

    const conversation = await this.prisma.conversation.create({
      data: {
        slug,
        type,
        status,
        title,
        description,
        category: dto.category?.trim() ?? "",
        course: dto.course?.trim() || null,
        rules: dto.rules?.trim() || null,
        visibility,
        maxParticipants,
        maxSpeakers,
        allowListeners: dto.allowListeners ?? true,
        allowRaiseHand: dto.allowRaiseHand ?? true,
        recordingEnabled: dto.recordingEnabled ?? false,
        allowNewStances: dto.allowNewStances ?? true,
        tags,
        livekitRoomName,
        createdById: userId,
        universityId,
        startedAt: dto.startNow ? new Date() : null,
        participants: {
          create: { userId, role: "HOST" as ConversationParticipantRole },
        },
      },
    });

    // Initial stances for debate
    if (type === "DEBATE" && dto.initialStances) {
      await this.prisma.conversationDebateStance.createMany({
        data: dto.initialStances.map((s, i) => ({
          conversationId: conversation.id,
          title: s.title.trim(),
          description: s.description?.trim() || null,
          order: i,
          createdById: userId,
        })),
      });
    }

    // Initial shared link
    if (dto.initialLinkUrl && isSafeUrl(dto.initialLinkUrl)) {
      await this.prisma.conversationSharedLink.create({
        data: {
          conversationId: conversation.id,
          title: dto.initialLinkTitle?.trim() || dto.initialLinkUrl,
          url: dto.initialLinkUrl.trim(),
          domain: extractDomain(dto.initialLinkUrl),
          type: "OTHER",
          sharedById: userId,
        },
      });
    }

    // Start recording if enabled and startNow
    if (dto.startNow && dto.recordingEnabled && this.recordingsService.isEgressAvailable()) {
      await this.startRecordingInternal(conversation.id, conversation.livekitRoomName);
    }

    return this.detail(conversation.id, userId);
  }

  async update(id: number, dto: UpdateConversationDto, userId: number, role: string) {
    const conv = await this.getOwnedConversation(id, userId, role);
    const data: Prisma.ConversationUpdateInput = {};
    const maxParticipants = dto.maxParticipants ?? conv.maxParticipants;
    const maxSpeakers = dto.maxSpeakers ?? conv.maxSpeakers;
    this.validateCapacity(maxParticipants, maxSpeakers);

    if (dto.title !== undefined) data.title = dto.title.trim();
    if (dto.description !== undefined) data.description = dto.description.trim();
    if (dto.category !== undefined) data.category = dto.category.trim();
    if (dto.course !== undefined) data.course = dto.course.trim() || null;
    if (dto.rules !== undefined) data.rules = dto.rules.trim() || null;
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.visibility !== undefined) {
      data.visibility = dto.visibility;
      if (dto.visibility === "UNIVERSITY") {
        const profile = await this.prisma.profile.findUnique({ where: { userId }, select: { universityId: true } });
        if (!profile?.universityId) {
          throw new BadRequestException("Completa tu universidad en el perfil antes de limitar la conversación a tu universidad.");
        }
        data.university = profile?.universityId ? { connect: { id: profile.universityId } } : { disconnect: true };
      } else {
        data.university = { disconnect: true };
      }
    }
    if (dto.maxParticipants !== undefined) data.maxParticipants = dto.maxParticipants;
    if (dto.maxSpeakers !== undefined) data.maxSpeakers = dto.maxSpeakers;
    if (dto.allowListeners !== undefined) data.allowListeners = dto.allowListeners;
    if (dto.allowRaiseHand !== undefined) data.allowRaiseHand = dto.allowRaiseHand;
    if (dto.recordingEnabled !== undefined) data.recordingEnabled = dto.recordingEnabled;
    if (dto.allowNewStances !== undefined) data.allowNewStances = dto.allowNewStances;
    if (dto.conclusion !== undefined) data.conclusion = dto.conclusion.trim();

    await this.prisma.conversation.update({ where: { id: conv.id }, data });
    return this.detail(id, userId);
  }

  async remove(id: number, userId: number, role: string) {
    const conv = await this.getOwnedConversation(id, userId, role);
    await this.prisma.conversation.update({ where: { id: conv.id }, data: { deletedAt: new Date(), status: "CANCELLED" } });
    return { message: "Conversación eliminada." };
  }

  // ---------- DRAFTS ----------
  async createDraft(dto: Partial<CreateConversationDto>, userId: number) {
    const title = dto.title?.trim() || "Borrador sin título";
    const baseSlug = toSlug(`borrador-${userId}-${Date.now()}`);
    const slug = await this.ensureUniqueSlug(baseSlug);
    const livekitRoomName = `conv-${slug}-${Date.now().toString(36)}`;
    const profile = await this.prisma.profile.findUnique({ where: { userId }, select: { universityId: true } });
    const visibility = (dto.visibility ?? "PUBLIC") as ConversationVisibility;
    const universityId = visibility === "UNIVERSITY" ? profile?.universityId ?? null : null;
    const maxParticipants = dto.maxParticipants ?? 50;
    const maxSpeakers = dto.maxSpeakers ?? 5;

    this.validateCapacity(maxParticipants, maxSpeakers);
    if (visibility === "UNIVERSITY" && !universityId) {
      throw new BadRequestException("Completa tu universidad en el perfil antes de guardar una conversación solo para tu universidad.");
    }

    const conversation = await this.prisma.conversation.create({
      data: {
        slug,
        type: (dto.type ?? "OPEN") as Conversation["type"],
        status: "DRAFT",
        title,
        description: dto.description?.trim() ?? "",
        category: dto.category?.trim() ?? "",
        course: dto.course?.trim() || null,
        rules: dto.rules?.trim() || null,
        visibility,
        maxParticipants,
        maxSpeakers,
        allowListeners: dto.allowListeners ?? true,
        allowRaiseHand: dto.allowRaiseHand ?? true,
        recordingEnabled: dto.recordingEnabled ?? false,
        allowNewStances: dto.allowNewStances ?? true,
        tags: (dto.tags ?? []).map((t) => t.trim()).filter(Boolean).slice(0, 8),
        livekitRoomName,
        createdById: userId,
        universityId,
        participants: { create: { userId, role: "HOST" as ConversationParticipantRole } },
      },
    });
    return this.detail(conversation.id, userId);
  }

  async updateDraft(id: number, dto: Partial<UpdateConversationDto>, userId: number) {
    const conv = await this.prisma.conversation.findFirst({
      where: { id, deletedAt: null, status: "DRAFT", createdById: userId },
    });
    if (!conv) throw new NotFoundException("Borrador no encontrado.");
    const data: Prisma.ConversationUpdateInput = {};
    const maxParticipants = dto.maxParticipants ?? conv.maxParticipants;
    const maxSpeakers = dto.maxSpeakers ?? conv.maxSpeakers;
    this.validateCapacity(maxParticipants, maxSpeakers);

    if (dto.title !== undefined) data.title = dto.title.trim();
    if (dto.description !== undefined) data.description = dto.description.trim();
    if (dto.category !== undefined) data.category = dto.category.trim();
    if (dto.course !== undefined) data.course = dto.course.trim() || null;
    if (dto.rules !== undefined) data.rules = dto.rules.trim() || null;
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.visibility !== undefined) {
      data.visibility = dto.visibility;
      if (dto.visibility === "UNIVERSITY") {
        const profile = await this.prisma.profile.findUnique({ where: { userId }, select: { universityId: true } });
        if (!profile?.universityId) {
          throw new BadRequestException("Completa tu universidad en el perfil antes de limitar el borrador a tu universidad.");
        }
        data.university = { connect: { id: profile.universityId } };
      } else {
        data.university = { disconnect: true };
      }
    }
    if (dto.maxParticipants !== undefined) data.maxParticipants = dto.maxParticipants;
    if (dto.maxSpeakers !== undefined) data.maxSpeakers = dto.maxSpeakers;
    if (dto.allowListeners !== undefined) data.allowListeners = dto.allowListeners;
    if (dto.allowRaiseHand !== undefined) data.allowRaiseHand = dto.allowRaiseHand;
    if (dto.recordingEnabled !== undefined) data.recordingEnabled = dto.recordingEnabled;
    if (dto.allowNewStances !== undefined) data.allowNewStances = dto.allowNewStances;
    await this.prisma.conversation.update({ where: { id }, data });
    return this.detail(id, userId);
  }

  async publishDraft(id: number, userId: number) {
    const conv = await this.prisma.conversation.findFirst({
      where: { id, deletedAt: null, status: "DRAFT", createdById: userId },
    });
    if (!conv) throw new NotFoundException("Borrador no encontrado.");
    if (conv.title.trim().length < 5 || conv.description.trim().length < 10) {
      throw new BadRequestException("Completa el título (mínimo 5 caracteres) y la descripción (mínimo 10) antes de publicar.");
    }
    await this.prisma.conversation.update({ where: { id }, data: { status: "WAITING" } });
    return this.detail(id, userId);
  }

  // ---------- ROOM LIFECYCLE ----------
  async start(id: number, userId: number, role: string) {
    const conv = await this.getOwnedConversation(id, userId, role);
    if (conv.status === "LIVE") throw new BadRequestException("La conversación ya está en vivo.");
    await this.prisma.conversation.update({
      where: { id: conv.id },
      data: { status: "LIVE", startedAt: new Date() },
    });
    await this.notifyStartSubscribers(conv.id);
    if (conv.recordingEnabled && this.recordingsService.isEgressAvailable()) {
      await this.startRecordingInternal(conv.id, conv.livekitRoomName);
    }
    return this.detail(id, userId);
  }

  async end(id: number, userId: number, role: string) {
    const conv = await this.getOwnedConversation(id, userId, role);
    if (conv.status === "ENDED") throw new BadRequestException("La conversación ya finalizó.");
    await this.prisma.conversation.update({
      where: { id: conv.id },
      data: { status: "ENDED", endedAt: new Date() },
    });
    // Mark active participants as left
    await this.prisma.conversationParticipant.updateMany({
      where: { conversationId: conv.id, leftAt: null },
      data: { leftAt: new Date() },
    });
    // Stop any active recording
    const activeRec = await this.prisma.conversationRecording.findFirst({
      where: { conversationId: conv.id, status: "RECORDING" },
    });
    if (activeRec) {
      await this.recordingsService.stopRecording(activeRec.egressId ?? "");
      await this.prisma.conversationRecording.update({
        where: { id: activeRec.id },
        data: { status: "PROCESSING", endedAt: new Date() },
      });
    }
    await this.livekit.deleteRoom(conv.livekitRoomName);
    return this.detail(id, userId);
  }

  async cancel(id: number, userId: number, role: string) {
    const conv = await this.getOwnedConversation(id, userId, role);
    await this.prisma.conversation.update({
      where: { id: conv.id },
      data: { status: "CANCELLED", endedAt: new Date() },
    });
    await this.prisma.conversationParticipant.updateMany({
      where: { conversationId: conv.id, leftAt: null },
      data: { leftAt: new Date() },
    });
    await this.livekit.deleteRoom(conv.livekitRoomName);
    return this.detail(id, userId);
  }

  async join(id: number, userId: number, role: string, inviteToken?: string) {
    const conv = await this.prisma.conversation.findFirst({
      where: { id, deletedAt: null },
      include: { bans: { select: { userId: true, expiresAt: true } } },
    });
    if (!conv) throw new NotFoundException("Conversación no encontrada.");
    if (conv.status === "DRAFT") throw new BadRequestException("Esta conversación es un borrador.");
    if (conv.status === "ENDED" || conv.status === "CANCELLED") {
      throw new BadRequestException("Esta conversación ya no está disponible.");
    }

    const canSee = await this.permissions.canViewerSee(conv, userId, role, inviteToken);
    if (!canSee) throw new ForbiddenException("No tienes permisos para entrar a esta conversación.");
    if (this.permissions.isBanned(conv.bans, userId)) {
      throw new ForbiddenException("Has sido bloqueado de esta conversación.");
    }
    if (conv.isLocked && conv.createdById !== userId && role !== "ADMIN") {
      throw new ForbiddenException("La conversación está bloqueada.");
    }

    const existing = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId: id, userId } },
    });
    let assignedRole: ConversationParticipantRole;

    if (existing) {
      if (existing.leftAt) {
        await this.prisma.conversationParticipant.update({
          where: { id: existing.id },
          data: { leftAt: null, joinedAt: new Date() },
        });
      }
      assignedRole = existing.role;
    } else {
      const activeCount = await this.permissions.countActiveParticipants(id);
      if (activeCount >= conv.maxParticipants) {
        throw new BadRequestException("La conversación alcanzó su capacidad máxima.");
      }
      assignedRole = conv.createdById === userId ? "HOST" : "LISTENER";
      if (!conv.allowListeners && assignedRole === "LISTENER") {
        throw new BadRequestException("Esta conversación no admite oyentes.");
      }
      await this.prisma.conversationParticipant.create({
        data: { conversationId: id, userId, role: assignedRole },
      });
    }

    const profile = await this.prisma.profile.findUnique({ where: { userId }, select: { firstName: true, lastName: true } });
    const name = profile ? `${profile.firstName ?? ""} ${profile.lastName ?? ""}`.trim() : `user-${userId}`;
    const token = await this.livekit.createToken({
      roomName: conv.livekitRoomName,
      identity: `user-${userId}`,
      name: name || `user-${userId}`,
      role: assignedRole,
      metadata: JSON.stringify({ conversationId: id, role: assignedRole, userId }),
    });

    return {
      conversation: await this.detail(id, userId),
      livekitUrl: this.livekit.getUrl(),
      token,
      role: assignedRole,
    };
  }

  async leave(id: number, userId: number) {
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId: id, userId } },
    });
    if (!participant || participant.leftAt) return { left: true };
    await this.prisma.conversationParticipant.update({
      where: { id: participant.id },
      data: { leftAt: new Date() },
    });
    await this.livekit.removeParticipant(
      (await this.prisma.conversation.findUnique({ where: { id }, select: { livekitRoomName: true } }))!.livekitRoomName,
      `user-${userId}`,
    );
    return { left: true };
  }

  // ---------- SPEAKER REQUESTS ----------
  async createSpeakerRequest(id: number, userId: number) {
    const conv = await this.prisma.conversation.findFirst({ where: { id, deletedAt: null }, select: { id: true, allowRaiseHand: true, status: true } });
    if (!conv) throw new NotFoundException("Conversación no encontrada.");
    if (conv.status !== "LIVE") throw new BadRequestException("Solo puedes levantar la mano en conversaciones en vivo.");
    if (!conv.allowRaiseHand) throw new BadRequestException("Esta conversación no permite levantar la mano.");

    const participant = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId: id, userId } },
    });
    if (!participant || participant.leftAt) throw new BadRequestException("Debes entrar a la conversación primero.");
    if (participant.role === "SPEAKER" || participant.role === "MODERATOR" || participant.role === "HOST") {
      throw new BadRequestException("Ya puedes hablar en esta conversación.");
    }

    return this.prisma.conversationSpeakerRequest.upsert({
      where: { conversationId_userId: { conversationId: id, userId } },
      create: { conversationId: id, userId, status: "PENDING" },
      update: { status: "PENDING", resolvedAt: null, resolvedById: null },
    });
  }

  async cancelSpeakerRequest(id: number, userId: number) {
    await this.prisma.conversationSpeakerRequest.updateMany({
      where: { conversationId: id, userId, status: "PENDING" },
      data: { status: "CANCELLED" },
    });
    return { cancelled: true };
  }

  async listSpeakerRequests(id: number, userId: number) {
    const role = await this.permissions.getViewerRole(id, userId);
    if (!this.permissions.canManageRoom(role)) {
      throw new ForbiddenException("Solo el anfitrión o moderadores pueden ver las solicitudes.");
    }
    return this.prisma.conversationSpeakerRequest.findMany({
      where: { conversationId: id, status: "PENDING" },
      orderBy: { requestedAt: "asc" },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profile: { select: { firstName: true, lastName: true, avatarUrl: true } },
          },
        },
      },
    });
  }

  async resolveSpeakerRequest(id: number, requestId: number, approved: boolean, userId: number) {
    const role = await this.permissions.getViewerRole(id, userId);
    if (!this.permissions.canManageRoom(role)) {
      throw new ForbiddenException("Solo el anfitrión o moderadores pueden gestionar solicitudes.");
    }
    const request = await this.prisma.conversationSpeakerRequest.findFirst({
      where: { id: requestId, conversationId: id, status: "PENDING" },
    });
    if (!request) throw new NotFoundException("Solicitud no encontrada.");

    if (approved) {
      const speakerCount = await this.permissions.countSpeakers(id);
      const conv = await this.prisma.conversation.findUnique({ where: { id }, select: { maxSpeakers: true } });
      if (speakerCount >= (conv?.maxSpeakers ?? 5)) {
        throw new BadRequestException("Se alcanzó el máximo de hablantes.");
      }
      await this.prisma.$transaction([
        this.prisma.conversationSpeakerRequest.update({
          where: { id: requestId },
          data: { status: "APPROVED", resolvedAt: new Date(), resolvedById: userId },
        }),
        this.prisma.conversationParticipant.update({
          where: { conversationId_userId: { conversationId: id, userId: request.userId } },
          data: { role: "SPEAKER" as ConversationParticipantRole },
        }),
      ]);
    } else {
      await this.prisma.conversationSpeakerRequest.update({
        where: { id: requestId },
        data: { status: "REJECTED", resolvedAt: new Date(), resolvedById: userId },
      });
    }
    return this.detail(id, userId);
  }

  // ---------- MODERATION ----------
  async updateParticipantRole(id: number, targetUserId: number, dto: UpdateParticipantRoleDto, actorId: number, actorRole: string) {
    const role = await this.permissions.getViewerRole(id, actorId);
    if (!this.permissions.isHost(role) && actorRole !== "ADMIN") {
      throw new ForbiddenException("Solo el anfitrión puede cambiar roles.");
    }
    const target = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId: id, userId: targetUserId } },
    });
    if (!target || target.leftAt) throw new NotFoundException("Participante no encontrado.");
    if (target.role === "HOST") throw new ForbiddenException("No puedes cambiar el rol del anfitrión.");

    await this.prisma.conversationParticipant.update({
      where: { id: target.id },
      data: { role: dto.role as ConversationParticipantRole },
    });
    return this.detail(id, actorId);
  }

  async muteParticipant(id: number, targetUserId: number, actorId: number, actorRole: string) {
    const role = await this.permissions.getViewerRole(id, actorId);
    if (!this.permissions.canManageRoom(role) && actorRole !== "ADMIN") {
      throw new ForbiddenException("No tienes permisos para silenciar.");
    }
    const conv = await this.prisma.conversation.findUnique({ where: { id }, select: { livekitRoomName: true } });
    if (conv) await this.livekit.muteParticipant(conv.livekitRoomName, `user-${targetUserId}`, true);
    return { muted: true };
  }

  async removeParticipant(id: number, targetUserId: number, actorId: number, actorRole: string) {
    const role = await this.permissions.getViewerRole(id, actorId);
    if (!this.permissions.canManageRoom(role) && actorRole !== "ADMIN") {
      throw new ForbiddenException("No tienes permisos para retirar participantes.");
    }
    const target = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId: id, userId: targetUserId } },
    });
    if (!target) throw new NotFoundException("Participante no encontrado.");
    if (target.role === "HOST") throw new ForbiddenException("No puedes retirar al anfitrión.");
    await this.prisma.conversationParticipant.update({
      where: { id: target.id },
      data: { leftAt: new Date() },
    });
    const conv = await this.prisma.conversation.findUnique({ where: { id }, select: { livekitRoomName: true } });
    if (conv) await this.livekit.removeParticipant(conv.livekitRoomName, `user-${targetUserId}`);
    return { removed: true };
  }

  async banParticipant(id: number, targetUserId: number, dto: BanDto, actorId: number, actorRole: string) {
    const role = await this.permissions.getViewerRole(id, actorId);
    if (!this.permissions.canManageRoom(role) && actorRole !== "ADMIN") {
      throw new ForbiddenException("No tienes permisos para bloquear.");
    }
    if (targetUserId === actorId) throw new ForbiddenException("No puedes bloquearte a ti mismo.");
    await this.prisma.conversationBan.upsert({
      where: { conversationId_userId: { conversationId: id, userId: targetUserId } },
      create: { conversationId: id, userId: targetUserId, bannedById: actorId, reason: dto.reason ?? null },
      update: { bannedById: actorId, reason: dto.reason ?? null },
    });
    await this.prisma.conversationParticipant.updateMany({
      where: { conversationId: id, userId: targetUserId, leftAt: null },
      data: { leftAt: new Date() },
    });
    const conv = await this.prisma.conversation.findUnique({ where: { id }, select: { livekitRoomName: true } });
    if (conv) await this.livekit.removeParticipant(conv.livekitRoomName, `user-${targetUserId}`);
    return { banned: true };
  }

  async unbanParticipant(id: number, targetUserId: number, actorId: number, actorRole: string) {
    const role = await this.permissions.getViewerRole(id, actorId);
    if (!this.permissions.canManageRoom(role) && actorRole !== "ADMIN") {
      throw new ForbiddenException("No tienes permisos para desbloquear.");
    }
    await this.prisma.conversationBan.deleteMany({
      where: { conversationId: id, userId: targetUserId },
    });
    return { unbanned: true };
  }

  async setLock(id: number, locked: boolean, userId: number, role: string) {
    const conv = await this.getOwnedConversation(id, userId, role);
    await this.prisma.conversation.update({ where: { id: conv.id }, data: { isLocked: locked } });
    return this.detail(id, userId);
  }

  // ---------- INVITES ----------
  async createInvite(id: number, dto: CreateInviteDto, userId: number, role: string) {
    const conv = await this.getOwnedConversation(id, userId, role);
    const token = randomToken();
    const tokenHash = await hashToken(token);
    const hours = dto.expiresInHours ? Number(dto.expiresInHours) : 24;
    const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);
    const invite = await this.prisma.conversationInvite.create({
      data: {
        conversationId: conv.id,
        createdById: userId,
        tokenHash,
        expiresAt,
        maxUses: dto.maxUses ?? 1,
      },
    });
    return { id: invite.id, token, expiresAt: invite.expiresAt, maxUses: invite.maxUses };
  }

  async listInvites(id: number, userId: number, role: string) {
    const conv = await this.getOwnedConversation(id, userId, role);
    return this.prisma.conversationInvite.findMany({
      where: { conversationId: conv.id, revokedAt: null },
      select: { id: true, expiresAt: true, maxUses: true, uses: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async revokeInvite(id: number, inviteId: number, userId: number, role: string) {
    const conv = await this.getOwnedConversation(id, userId, role);
    await this.prisma.conversationInvite.updateMany({
      where: { id: inviteId, conversationId: conv.id },
      data: { revokedAt: new Date() },
    });
    return { revoked: true };
  }

  // ---------- MATERIALS ----------
  async listMaterials(id: number) {
    return this.prisma.conversationMaterial.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: "desc" },
    });
  }

  async createMaterial(id: number, dto: CreateMaterialDto, userId: number, role: string) {
    const conv = await this.getConversationForAction(id, userId, role);
    const count = await this.prisma.conversationMaterial.count({ where: { conversationId: id } });
    if (count >= CONVERSATION_MAX_MATERIALS) {
      throw new BadRequestException(`Máximo ${CONVERSATION_MAX_MATERIALS} materiales por conversación.`);
    }
    return this.prisma.conversationMaterial.create({
      data: {
        conversationId: conv.id,
        title: dto.title.trim(),
        type: dto.type ?? "OTHER",
        objectKey: dto.objectKey,
        fileUrl: dto.fileUrl,
        mimeType: dto.mimeType,
        sizeBytes: dto.sizeBytes,
        uploadedById: userId,
      },
    });
  }

  async uploadMaterial(id: number, file: any, userId: number, role: string) {
    const conv = await this.getConversationForAction(id, userId, role);
    if (!file) throw new BadRequestException("Debes adjuntar un archivo.");
    const originalName = String(file.originalname ?? "archivo");
    const mimeType = String(file.mimetype ?? "");
    const rule = findMaterialRule(originalName, mimeType);
    if (!rule) throw new BadRequestException("Formato no permitido. PDF, DOCX, PPTX o imágenes.");
    if (file.size > rule.maxBytes) {
      throw new BadRequestException(`El archivo supera el límite de ${Math.round(rule.maxBytes / (1024 * 1024))}MB.`);
    }
    const count = await this.prisma.conversationMaterial.count({ where: { conversationId: id } });
    if (count >= CONVERSATION_MAX_MATERIALS) {
      throw new BadRequestException(`Máximo ${CONVERSATION_MAX_MATERIALS} materiales por conversación.`);
    }
    const ext = originalName.split(".").pop()?.toLowerCase() ?? "bin";
    const filename = `mat-${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
    const storageKey = `${CONVERSATION_STORAGE_FOLDER}/${filename}`;
    const fs = await import("node:fs/promises");
    const targetDir = `${process.cwd()}/tmp/uploads/${CONVERSATION_STORAGE_FOLDER}`;
    await fs.mkdir(targetDir, { recursive: true });
    await fs.writeFile(`${targetDir}/${filename}`, file.buffer);

    const fileUrl = `${CONVERSATION_MEDIA_PUBLIC_PATH}/${filename}`;
    const material = await this.prisma.conversationMaterial.create({
      data: {
        conversationId: conv.id,
        title: originalName,
        type: rule.category,
        objectKey: storageKey,
        fileUrl,
        mimeType: mimeType || "application/octet-stream",
        sizeBytes: file.size,
        uploadedById: userId,
      },
    });
    return { id: material.id, fileUrl, storageKey, title: material.title, type: material.type, mimeType: material.mimeType, sizeBytes: material.sizeBytes };
  }

  async serveMaterial(filename: string) {
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "");
    const filePath = `${process.cwd()}/tmp/uploads/${CONVERSATION_STORAGE_FOLDER}/${safeName}`;
    const fs = await import("node:fs/promises");
    try {
      await fs.access(filePath);
    } catch {
      throw new NotFoundException("Archivo no encontrado.");
    }
    const material = await this.prisma.conversationMaterial.findFirst({
      where: { objectKey: `${CONVERSATION_STORAGE_FOLDER}/${safeName}` },
      select: { mimeType: true, title: true },
    });
    return { filePath, mimeType: material?.mimeType ?? "application/octet-stream", originalName: material?.title ?? safeName };
  }

  async deleteMaterial(id: number, materialId: number, userId: number, role: string) {
    const conv = await this.getConversationForAction(id, userId, role);
    const material = await this.prisma.conversationMaterial.findFirst({
      where: { id: materialId, conversationId: conv.id },
    });
    if (!material) throw new NotFoundException("Material no encontrado.");
    const isUploader = material.uploadedById === userId;
    const viewerRole = await this.permissions.getViewerRole(id, userId);
    if (!isUploader && !this.permissions.canManageRoom(viewerRole) && role !== "ADMIN") {
      throw new ForbiddenException("No tienes permisos para eliminar este material.");
    }
    await this.prisma.conversationMaterial.delete({ where: { id: materialId } });
    return { deleted: true };
  }

  // ---------- LINKS ----------
  async listLinks(id: number) {
    return this.prisma.conversationSharedLink.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: "desc" },
    });
  }

  async createLink(id: number, dto: CreateSharedLinkDto, userId: number, role: string) {
    const conv = await this.getConversationForAction(id, userId, role);
    if (!isSafeUrl(dto.url)) throw new BadRequestException("La URL no es válida o no es segura.");
    return this.prisma.conversationSharedLink.create({
      data: {
        conversationId: conv.id,
        title: dto.title.trim(),
        url: dto.url.trim(),
        domain: extractDomain(dto.url),
        type: dto.type ?? "OTHER",
        sharedById: userId,
      },
    });
  }

  async deleteLink(id: number, linkId: number, userId: number, role: string) {
    const conv = await this.getConversationForAction(id, userId, role);
    const link = await this.prisma.conversationSharedLink.findFirst({
      where: { id: linkId, conversationId: conv.id },
    });
    if (!link) throw new NotFoundException("Enlace no encontrado.");
    const isSharer = link.sharedById === userId;
    const viewerRole = await this.permissions.getViewerRole(id, userId);
    if (!isSharer && !this.permissions.canManageRoom(viewerRole) && role !== "ADMIN") {
      throw new ForbiddenException("No tienes permisos para eliminar este enlace.");
    }
    await this.prisma.conversationSharedLink.delete({ where: { id: linkId } });
    return { deleted: true };
  }

  // ---------- RECORDINGS ----------
  async listRecordings(query: GetRecordingsQueryDto, viewerUserId?: number, viewerRole?: string) {
    const limit = Math.min(query.limit ?? 20, 100);
    const conversationWhere: Prisma.ConversationWhereInput = { deletedAt: null };
    if (query.type) conversationWhere.type = query.type;
    if (query.category) conversationWhere.category = { contains: query.category, mode: "insensitive" };
    if (query.search) {
      conversationWhere.OR = [
        { title: { contains: query.search, mode: "insensitive" } },
        { description: { contains: query.search, mode: "insensitive" } },
      ];
    }
    const where: Prisma.ConversationRecordingWhereInput = {
      deletedAt: null,
      status: "AVAILABLE",
      conversation: conversationWhere,
    };
    const orderBy: Prisma.ConversationRecordingOrderByWithRelationInput =
      query.sort === "popular" ? { plays: "desc" } : { createdAt: "desc" };

    const recordings = await this.prisma.conversationRecording.findMany({
      where,
      orderBy,
      take: limit,
      include: {
        conversation: {
          select: {
            id: true,
            title: true,
            type: true,
            category: true,
            visibility: true,
            universityId: true,
            createdById: true,
            participants: { where: { leftAt: null }, select: { userId: true } },
          },
        },
      },
    });

    const filtered = recordings.filter((r) => {
      const isAdmin = viewerRole === "ADMIN" || viewerRole === "MODERATOR";
      if (isAdmin) return true;
      if (r.conversation.visibility === "PUBLIC") return true;
      if (viewerUserId && r.conversation.createdById === viewerUserId) return true;
      if (viewerUserId && r.conversation.participants.some((p) => p.userId === viewerUserId)) return true;
      return false;
    });

    return {
      items: filtered.map((r) => ({
        id: r.id,
        conversationId: r.conversation.id,
        title: r.conversation.title,
        type: r.conversation.type,
        category: r.conversation.category,
        durationSeconds: r.durationSeconds,
        sizeBytes: r.sizeBytes,
        plays: r.plays,
        status: r.status,
        createdAt: r.createdAt,
        fileUrl: r.fileUrl,
        mimeType: r.mimeType,
      })),
    };
  }

  async getRecording(id: number, viewerUserId?: number, viewerRole?: string) {
    const rec = await this.prisma.conversationRecording.findFirst({
      where: { id, deletedAt: null },
      include: {
        conversation: {
          select: { id: true, title: true, type: true, category: true, visibility: true, createdById: true, universityId: true, participants: { where: { leftAt: null }, select: { userId: true } } },
        },
      },
    });
    if (!rec || rec.status !== "AVAILABLE") throw new NotFoundException("Grabación no encontrada.");
    const isAdmin = viewerRole === "ADMIN" || viewerRole === "MODERATOR";
    const c = rec.conversation;
    const canAccess =
      isAdmin ||
      c.visibility === "PUBLIC" ||
      (viewerUserId && c.createdById === viewerUserId) ||
      (viewerUserId && c.participants.some((p) => p.userId === viewerUserId));
    if (!canAccess) throw new ForbiddenException("No tienes acceso a esta grabación.");
    return {
      id: rec.id,
      conversationId: c.id,
      title: c.title,
      type: c.type,
      category: c.category,
      durationSeconds: rec.durationSeconds,
      sizeBytes: rec.sizeBytes,
      plays: rec.plays,
      status: rec.status,
      createdAt: rec.createdAt,
      fileUrl: rec.fileUrl,
      mimeType: rec.mimeType,
    };
  }

  async playRecording(id: number, viewerUserId?: number, viewerRole?: string) {
    const rec = await this.getRecording(id, viewerUserId, viewerRole);
    await this.prisma.conversationRecording.update({
      where: { id },
      data: { plays: { increment: 1 } },
    });
    return { ...rec, plays: rec.plays + 1 };
  }

  async startRecording(id: number, userId: number, role: string) {
    const conv = await this.getOwnedConversation(id, userId, role);
    return this.startRecordingInternal(conv.id, conv.livekitRoomName);
  }

  private async startRecordingInternal(conversationId: number, roomName: string) {
    const existing = await this.prisma.conversationRecording.findFirst({
      where: { conversationId, status: { in: ["REQUESTED", "RECORDING"] } },
    });
    if (existing) throw new BadRequestException("Ya hay una grabación en curso.");
    const recording = await this.prisma.conversationRecording.create({
      data: { conversationId, status: "REQUESTED", startedAt: new Date() },
    });
    if (!this.recordingsService.isEgressAvailable()) {
      await this.prisma.conversationRecording.update({
        where: { id: recording.id },
        data: { status: "FAILED", errorMessage: "LiveKit Egress no está disponible.", endedAt: new Date() },
      });
      throw new BadRequestException("LiveKit Egress no está disponible. Activa LIVEKIT_EGRESS_ENABLED.");
    }
    const outputPath = `recordings/conversation-${conversationId}-${recording.id}.mp4`;
    const egressId = await this.recordingsService.startRecording(roomName, outputPath);
    if (!egressId) {
      await this.prisma.conversationRecording.update({
        where: { id: recording.id },
        data: { status: "FAILED", errorMessage: "No se pudo iniciar Egress.", endedAt: new Date() },
      });
      throw new BadRequestException("No se pudo iniciar la grabación.");
    }
    await this.prisma.conversationRecording.update({
      where: { id: recording.id },
      data: { status: "RECORDING", egressId },
    });
    return this.detail(conversationId, undefined);
  }

  async stopRecording(id: number, userId: number, role: string) {
    const conv = await this.getOwnedConversation(id, userId, role);
    const rec = await this.prisma.conversationRecording.findFirst({
      where: { conversationId: conv.id, status: "RECORDING" },
    });
    if (!rec) throw new NotFoundException("No hay grabación en curso.");
    await this.recordingsService.stopRecording(rec.egressId ?? "");
    await this.prisma.conversationRecording.update({
      where: { id: rec.id },
      data: { status: "PROCESSING", endedAt: new Date() },
    });
    return this.detail(conv.id, userId);
  }

  async deleteRecording(id: number, userId: number, role: string) {
    const rec = await this.prisma.conversationRecording.findFirst({
      where: { id, deletedAt: null },
      include: { conversation: { select: { createdById: true } } },
    });
    if (!rec) throw new NotFoundException("Grabación no encontrada.");
    const isOwner = rec.conversation.createdById === userId;
    if (!isOwner && role !== "ADMIN") throw new ForbiddenException("Solo el propietario puede eliminar la grabación.");
    await this.prisma.conversationRecording.update({ where: { id }, data: { deletedAt: new Date(), status: "DELETED" } });
    return { deleted: true };
  }

  // ---------- START SUBSCRIPTIONS ----------
  async createStartSubscription(id: number, userId: number) {
    const conv = await this.prisma.conversation.findFirst({ where: { id, deletedAt: null }, select: { id: true, status: true } });
    if (!conv) throw new NotFoundException("Conversación no encontrada.");
    if (conv.status === "LIVE") throw new BadRequestException("La conversación ya está en vivo.");
    await this.prisma.conversationStartSubscription.upsert({
      where: { conversationId_userId: { conversationId: id, userId } },
      create: { conversationId: id, userId },
      update: { notifiedAt: null },
    });
    return { subscribed: true };
  }

  async cancelStartSubscription(id: number, userId: number) {
    await this.prisma.conversationStartSubscription.deleteMany({
      where: { conversationId: id, userId },
    });
    return { subscribed: false };
  }

  private async notifyStartSubscribers(conversationId: number) {
    const subs = await this.prisma.conversationStartSubscription.findMany({
      where: { conversationId, notifiedAt: null },
      select: { id: true, userId: true },
    });
    if (!subs.length) return;
    const conv = await this.prisma.conversation.findUnique({ where: { id: conversationId }, select: { title: true } });
    await this.prisma.notification.createMany({
      data: subs.map((s) => ({
        userId: s.userId,
        type: "CONVERSATION_STARTED",
        title: "La conversación empezó",
        message: `«${conv?.title ?? "Conversación"}» está en vivo ahora.`,
        referenceId: conversationId,
        referenceType: "conversation",
      })),
    });
    await this.prisma.conversationStartSubscription.updateMany({
      where: { conversationId, notifiedAt: null },
      data: { notifiedAt: new Date() },
    });
  }

  // ---------- DEBATES ----------
  async listStances(id: number) {
    const conv = await this.prisma.conversation.findFirst({ where: { id, deletedAt: null }, select: { id: true } });
    if (!conv) throw new NotFoundException("Conversación no encontrada.");
    return this.prisma.conversationDebateStance.findMany({
      where: { conversationId: id },
      orderBy: { order: "asc" },
      include: {
        memberships: {
          select: {
            userId: true,
            user: { select: { id: true, email: true, profile: { select: { firstName: true, lastName: true, avatarUrl: true } } } },
          },
        },
        arguments: {
          where: { deletedAt: null },
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            content: true,
            createdAt: true,
            updatedAt: true,
            authorId: true,
            author: { select: { id: true, email: true, profile: { select: { firstName: true, lastName: true, avatarUrl: true } } } },
          },
        },
        _count: { select: { memberships: true } },
      },
    });
  }

  async createStance(id: number, dto: { title: string; description?: string }, userId: number, role: string) {
    const conv = await this.prisma.conversation.findFirst({ where: { id, deletedAt: null }, select: { id: true, allowNewStances: true, type: true } });
    if (!conv) throw new NotFoundException("Conversación no encontrada.");
    if (conv.type !== "DEBATE") throw new BadRequestException("Esta conversación no es un debate.");
    const viewerRole = await this.permissions.getViewerRole(id, userId);
    if (!conv.allowNewStances && !this.permissions.isHost(viewerRole) && role !== "ADMIN") {
      throw new ForbiddenException("No se permiten nuevas posturas en este debate.");
    }
    const maxOrder = await this.prisma.conversationDebateStance.aggregate({
      where: { conversationId: id },
      _max: { order: true },
    });
    return this.prisma.conversationDebateStance.create({
      data: {
        conversationId: id,
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        order: (maxOrder._max.order ?? -1) + 1,
        createdById: userId,
      },
    });
  }

  async joinStance(id: number, stanceId: number, userId: number) {
    const stance = await this.prisma.conversationDebateStance.findFirst({
      where: { id: stanceId, conversationId: id },
      select: { id: true },
    });
    if (!stance) throw new NotFoundException("Postura no encontrada.");
    // Remove from other stances in this conversation
    const otherStances = await this.prisma.conversationDebateStance.findMany({
      where: { conversationId: id, id: { not: stanceId } },
      select: { id: true },
    });
    if (otherStances.length) {
      await this.prisma.conversationDebateMembership.deleteMany({
        where: { userId, stanceId: { in: otherStances.map((s) => s.id) } },
      });
    }
    await this.prisma.conversationDebateMembership.upsert({
      where: { stanceId_userId: { stanceId, userId } },
      create: { stanceId, userId },
      update: {},
    });
    return this.listStances(id);
  }

  async createArgument(id: number, stanceId: number, dto: CreateArgumentDto, userId: number) {
    const stance = await this.prisma.conversationDebateStance.findFirst({
      where: { id: stanceId, conversationId: id },
      select: { id: true },
    });
    if (!stance) throw new NotFoundException("Postura no encontrada.");
    return this.prisma.conversationDebateArgument.create({
      data: { stanceId, authorId: userId, content: dto.content.trim() },
    });
  }

  async updateArgument(id: number, argumentId: number, dto: UpdateArgumentDto, userId: number, role: string) {
    const arg = await this.prisma.conversationDebateArgument.findFirst({
      where: { id: argumentId, deletedAt: null, stance: { conversationId: id } },
      select: { id: true, authorId: true },
    });
    if (!arg) throw new NotFoundException("Argumento no encontrado.");
    if (arg.authorId !== userId && role !== "ADMIN") throw new ForbiddenException("Solo puedes editar tus propios argumentos.");
    return this.prisma.conversationDebateArgument.update({
      where: { id: argumentId },
      data: { content: dto.content.trim() },
    });
  }

  async deleteArgument(id: number, argumentId: number, userId: number, role: string) {
    const arg = await this.prisma.conversationDebateArgument.findFirst({
      where: { id: argumentId, deletedAt: null, stance: { conversationId: id } },
      select: { id: true, authorId: true, stance: { select: { conversationId: true } } },
    });
    if (!arg) throw new NotFoundException("Argumento no encontrado.");
    const viewerRole = await this.permissions.getViewerRole(id, userId);
    if (arg.authorId !== userId && !this.permissions.canManageRoom(viewerRole) && role !== "ADMIN") {
      throw new ForbiddenException("No tienes permisos para eliminar este argumento.");
    }
    await this.prisma.conversationDebateArgument.update({ where: { id: argumentId }, data: { deletedAt: new Date() } });
    return { deleted: true };
  }

  // ---------- COMPANIONS ----------
  async listCompanions(query: GetCompanionsQueryDto, viewerUserId?: number) {
    const limit = Math.min(query.limit ?? 20, 50);
    const where: Prisma.ConversationCompanionProfileWhereInput = { isActive: true };
    if (query.availableForVoice !== undefined) where.availableForVoice = query.availableForVoice;
    if (query.universityId) where.user = { profile: { universityId: query.universityId } };
    if (query.topic) where.topics = { has: query.topic };
    if (query.course) where.courses = { has: query.course };
    if (query.search) {
      where.OR = [
        { description: { contains: query.search, mode: "insensitive" } },
        { topics: { has: query.search } },
        { user: { profile: { firstName: { contains: query.search, mode: "insensitive" } } } },
        { user: { profile: { lastName: { contains: query.search, mode: "insensitive" } } } },
      ];
    }

    const profiles = await this.prisma.conversationCompanionProfile.findMany({
      where,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                avatarUrl: true,
                universityId: true,
                university: { select: { id: true, name: true, shortName: true } },
                career: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    });

    return {
      items: profiles.map((p) => ({
        userId: p.userId,
        description: p.description,
        topics: p.topics,
        courses: p.courses,
        availabilityText: p.availabilityText,
        availableForVoice: p.availableForVoice,
        isActive: p.isActive,
        user: {
          id: p.user.id,
          name: p.user.profile ? `${p.user.profile.firstName ?? ""} ${p.user.profile.lastName ?? ""}`.trim() : p.user.email,
          avatarUrl: p.user.profile?.avatarUrl ?? null,
          university: p.user.profile?.university ?? null,
          career: p.user.profile?.career ?? null,
        },
        isMine: viewerUserId ? p.userId === viewerUserId : false,
      })),
    };
  }

  async getMyCompanionProfile(userId: number) {
    const profile = await this.prisma.conversationCompanionProfile.findUnique({
      where: { userId },
    });
    if (!profile) return null;
    return profile;
  }

  async upsertMyCompanionProfile(dto: CompanionProfileDto, userId: number) {
    const data: Prisma.ConversationCompanionProfileUpsertArgs["create"] = {
      userId,
      description: dto.description ?? "",
      topics: dto.topics ?? [],
      courses: dto.courses ?? [],
      availabilityText: dto.availabilityText ?? null,
      availableForVoice: dto.availableForVoice ?? true,
      isActive: dto.isActive ?? true,
    };
    return this.prisma.conversationCompanionProfile.upsert({
      where: { userId },
      create: data,
      update: {
        description: dto.description ?? undefined,
        topics: dto.topics ?? undefined,
        courses: dto.courses ?? undefined,
        availabilityText: dto.availabilityText ?? undefined,
        availableForVoice: dto.availableForVoice ?? undefined,
        isActive: dto.isActive ?? undefined,
      },
    });
  }

  async deleteMyCompanionProfile(userId: number) {
    await this.prisma.conversationCompanionProfile.deleteMany({ where: { userId } });
    return { deleted: true };
  }

  // ---------- HELPERS ----------
  private async getOwnedConversation(id: number, userId: number, role: string) {
    const conv = await this.prisma.conversation.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        createdById: true,
        status: true,
        livekitRoomName: true,
        recordingEnabled: true,
        maxParticipants: true,
        maxSpeakers: true,
      },
    });
    if (!conv) throw new NotFoundException("Conversación no encontrada.");
    if (conv.createdById !== userId && role !== "ADMIN") {
      throw new ForbiddenException("Solo el propietario puede realizar esta acción.");
    }
    return conv;
  }

  private async getConversationForAction(id: number, userId: number, role: string) {
    const conv = await this.prisma.conversation.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, createdById: true },
    });
    if (!conv) throw new NotFoundException("Conversación no encontrada.");
    const viewerRole = await this.permissions.getViewerRole(id, userId);
    const isOwner = conv.createdById === userId;
    if (!isOwner && !this.permissions.canManageRoom(viewerRole) && role !== "ADMIN") {
      // Allow participants to add materials/links if they're in the room
      const isParticipant = await this.prisma.conversationParticipant.findUnique({
        where: { conversationId_userId: { conversationId: id, userId } },
      });
      if (!isParticipant || isParticipant.leftAt) {
        throw new ForbiddenException("Debes ser participante para realizar esta acción.");
      }
    }
    return conv;
  }

  private async ensureUniqueSlug(base: string): Promise<string> {
    let slug = base;
    let i = 1;
    while (await this.prisma.conversation.findUnique({ where: { slug } })) {
      slug = `${base}-${i++}`;
    }
    return slug;
  }

  private validateCapacity(maxParticipants: number, maxSpeakers: number) {
    if (maxSpeakers > maxParticipants) {
      throw new BadRequestException("El máximo de hablantes no puede superar el máximo de participantes.");
    }
  }

  // ---------- MAPPERS ----------
  private mapConversation(row: ConversationRow, viewerUserId?: number) {
    const speakers = row.participants.filter((p) => p.role === "SPEAKER" || p.role === "MODERATOR" || p.role === "HOST");
    return {
      id: row.id,
      slug: row.slug,
      type: row.type,
      status: row.status,
      title: row.title,
      description: row.description,
      category: row.category,
      course: row.course,
      visibility: row.visibility,
      isRecording: row.recordingEnabled,
      isLocked: row.isLocked,
      tags: row.tags,
      createdAt: row.createdAt,
      scheduledAt: row.scheduledAt,
      startedAt: row.startedAt,
      endedAt: row.endedAt,
      maxParticipants: row.maxParticipants,
      maxSpeakers: row.maxSpeakers,
      allowListeners: row.allowListeners,
      allowRaiseHand: row.allowRaiseHand,
      allowNewStances: row.allowNewStances,
      livekitRoomName: row.livekitRoomName,
      conclusion: row.conclusion,
      createdBy: mapAuthor(row.creator),
      university: row.university,
      participantsCount: row._count.participants,
      speakersCount: speakers.length,
      listenersCount: row._count.participants - speakers.length,
      isMine: viewerUserId ? row.createdById === viewerUserId : false,
      materials: row.materials,
      links: row.links,
    };
  }

  private mapConversationDetail(row: any, viewerUserId?: number) {
    const base = this.mapConversation(row as ConversationRow, viewerUserId);
    return {
      ...base,
      rules: row.rules,
      debateStances: (row.debateStances ?? []).map((s: any) => ({
        id: s.id,
        title: s.title,
        description: s.description,
        order: s.order,
        participants: s._count?.memberships ?? 0,
        argumentsCount: s._count?.arguments ?? 0,
      })),
      recordings: (row.recordings ?? []).map((r: any) => ({
        id: r.id,
        durationSeconds: r.durationSeconds,
        plays: r.plays,
        status: r.status,
      })),
      startSubscriptionsCount: row._count?.startSubscriptions ?? 0,
    };
  }
}
