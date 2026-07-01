import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ContentStatus, ConversationStatus, DocumentVisibility } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { HotReadCacheService } from "../../cache/hot-read-cache.service";
import { AdminAuditService } from "./admin-audit.service";
import { AdminPlacementsService } from "./admin-placements.service";

@Injectable()
export class AdminContentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: HotReadCacheService,
    private readonly audit: AdminAuditService,
    private readonly placements: AdminPlacementsService,
  ) {}

  // ==================== QUESTIONS ====================

  async listQuestions(filters: { search?: string; status?: ContentStatus; resolved?: boolean; cursor?: number; limit?: number } = {}) {
    const limit = Math.min(filters.limit ?? 25, 50);
    const where: Record<string, unknown> = {};
    if (filters.status) where.status = filters.status;
    if (filters.resolved !== undefined) where.isResolved = filters.resolved;
    if (filters.search) where.OR = [
      { title: { contains: filters.search, mode: "insensitive" } },
      { content: { contains: filters.search, mode: "insensitive" } },
    ];
    const items = await this.prisma.question.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      ...(filters.cursor ? { cursor: { id: filters.cursor }, skip: 1 } : {}),
      select: {
        id: true, title: true, status: true, isResolved: true, createdAt: true,
        user: { select: { id: true, email: true } },
        community: { select: { id: true, name: true } },
        _count: { select: { answers: true, reports: true } },
      },
    });
    const hasMore = items.length > limit;
    const slice = items.slice(0, limit);
    const featured = await this.placements.listByArea("QUESTIONS_FEATURED");
    const featuredIds = new Set(featured.items.map((p) => p.entityId));
    return {
      items: slice.map((q) => ({ ...q, answersCount: q._count.answers, reportsCount: q._count.reports, isFeatured: featuredIds.has(q.id) })),
      nextCursor: hasMore ? slice[slice.length - 1].id : null,
    };
  }

  async hideQuestion(id: number, adminId: number, reason: string) {
    await this.ensureExists("question", id);
    await this.prisma.question.update({ where: { id }, data: { status: ContentStatus.HIDDEN } });
    await this.audit.record(adminId, "QUESTION_HIDE", "questions", { targetType: "Question", targetId: id, reason });
    return { message: "Pregunta oculta." };
  }

  async restoreQuestion(id: number, adminId: number, reason: string) {
    await this.ensureExists("question", id);
    await this.prisma.question.update({ where: { id }, data: { status: ContentStatus.PUBLISHED } });
    await this.audit.record(adminId, "QUESTION_RESTORE", "questions", { targetType: "Question", targetId: id, reason });
    return { message: "Pregunta restaurada." };
  }

  async closeQuestion(id: number, adminId: number, reason: string) {
    await this.ensureExists("question", id);
    await this.prisma.question.update({ where: { id }, data: { isResolved: true } });
    await this.audit.record(adminId, "QUESTION_CLOSE", "questions", { targetType: "Question", targetId: id, reason });
    return { message: "Pregunta cerrada." };
  }

  async reopenQuestion(id: number, adminId: number, reason: string) {
    await this.ensureExists("question", id);
    await this.prisma.question.update({ where: { id }, data: { isResolved: false } });
    await this.audit.record(adminId, "QUESTION_REOPEN", "questions", { targetType: "Question", targetId: id, reason });
    return { message: "Pregunta reabierta." };
  }

  async featureQuestion(id: number, adminId: number, position = 0) {
    await this.ensureExists("question", id);
    await this.placements.upsert({ area: "QUESTIONS_FEATURED", entityType: "QUESTION", entityId: id, position, adminId });
    await this.audit.record(adminId, "QUESTION_FEATURE", "questions", { targetType: "Question", targetId: id });
    return { message: "Pregunta destacada." };
  }

  async unfeatureQuestion(id: number, adminId: number) {
    await this.placements.deactivate("QUESTIONS_FEATURED", "QUESTION", id, adminId);
    await this.audit.record(adminId, "QUESTION_UNFEATURE", "questions", { targetType: "Question", targetId: id });
    return { message: "Destacado retirado." };
  }

  // ==================== DOCUMENTS ====================

  async listDocuments(filters: { search?: string; status?: ContentStatus; course?: string; cursor?: number; limit?: number } = {}) {
    const limit = Math.min(filters.limit ?? 25, 50);
    const where: Record<string, unknown> = {};
    if (filters.status) where.status = filters.status;
    if (filters.course) where.course = { contains: filters.course, mode: "insensitive" };
    if (filters.search) where.OR = [
      { title: { contains: filters.search, mode: "insensitive" } },
      { description: { contains: filters.search, mode: "insensitive" } },
    ];
    const items = await this.prisma.document.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      ...(filters.cursor ? { cursor: { id: filters.cursor }, skip: 1 } : {}),
      select: {
        id: true, title: true, status: true, course: true, cycle: true, fileType: true, createdAt: true,
        user: { select: { id: true, email: true } },
        _count: { select: { reports: true, savedBy: true } },
      },
    });
    const hasMore = items.length > limit;
    const slice = items.slice(0, limit);
    const featured = await this.placements.listByArea("DOCUMENTS_FEATURED");
    const featuredIds = new Set(featured.items.map((p) => p.entityId));
    return {
      items: slice.map((d) => ({ ...d, reportsCount: d._count.reports, savesCount: d._count.savedBy, isFeatured: featuredIds.has(d.id) })),
      nextCursor: hasMore ? slice[slice.length - 1].id : null,
    };
  }

  async approveDocument(id: number, adminId: number, reason: string) {
    await this.ensureExists("document", id);
    await this.prisma.document.update({ where: { id }, data: { status: ContentStatus.PUBLISHED } });
    await this.audit.record(adminId, "DOCUMENT_APPROVE", "documents", { targetType: "Document", targetId: id, reason });
    return { message: "Apunte aprobado." };
  }

  async rejectDocument(id: number, adminId: number, reason: string) {
    if (!reason.trim()) throw new BadRequestException("El motivo de rechazo es obligatorio.");
    await this.ensureExists("document", id);
    await this.prisma.document.update({ where: { id }, data: { status: ContentStatus.HIDDEN } });
    await this.audit.record(adminId, "DOCUMENT_REJECT", "documents", { targetType: "Document", targetId: id, reason });
    return { message: "Apunte rechazado." };
  }

  async featureDocument(id: number, adminId: number, position = 0) {
    await this.ensureExists("document", id);
    await this.placements.upsert({ area: "DOCUMENTS_FEATURED", entityType: "DOCUMENT", entityId: id, position, adminId });
    await this.audit.record(adminId, "DOCUMENT_FEATURE", "documents", { targetType: "Document", targetId: id });
    return { message: "Apunte destacado." };
  }

  async unfeatureDocument(id: number, adminId: number) {
    await this.placements.deactivate("DOCUMENTS_FEATURED", "DOCUMENT", id, adminId);
    await this.audit.record(adminId, "DOCUMENT_UNFEATURE", "documents", { targetType: "Document", targetId: id });
    return { message: "Destacado retirado." };
  }

  // ==================== MOMENTS ====================

  async listMoments(filters: { search?: string; status?: ContentStatus; type?: string; cursor?: number; limit?: number } = {}) {
    const limit = Math.min(filters.limit ?? 25, 50);
    const where: Record<string, unknown> = {};
    if (filters.status) where.status = filters.status;
    if (filters.type) where.type = filters.type;
    if (filters.search) where.OR = [
      { title: { contains: filters.search, mode: "insensitive" } },
      { description: { contains: filters.search, mode: "insensitive" } },
    ];
    const items = await this.prisma.moment.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      ...(filters.cursor ? { cursor: { id: filters.cursor }, skip: 1 } : {}),
      select: {
        id: true, title: true, status: true, type: true, isPermanent: true, expiresAt: true, createdAt: true,
        user: { select: { id: true, email: true } },
        _count: { select: { confirmations: true, comments: true, reports: true } },
      },
    });
    const hasMore = items.length > limit;
    const slice = items.slice(0, limit);
    const featured = await this.placements.listByArea("MOMENTS_FEATURED");
    const featuredIds = new Set(featured.items.map((p) => p.entityId));
    return {
      items: slice.map((m) => ({
        ...m, confirmationsCount: m._count.confirmations, commentsCount: m._count.comments, reportsCount: m._count.reports,
        isFeatured: featuredIds.has(m.id),
      })),
      nextCursor: hasMore ? slice[slice.length - 1].id : null,
    };
  }

  async hideMoment(id: number, adminId: number, reason: string) {
    await this.ensureExists("moment", id);
    await this.prisma.moment.update({ where: { id }, data: { status: ContentStatus.HIDDEN } });
    await this.audit.record(adminId, "MOMENT_HIDE", "moments", { targetType: "Moment", targetId: id, reason });
    return { message: "Momento oculto." };
  }

  async restoreMoment(id: number, adminId: number, reason: string) {
    await this.ensureExists("moment", id);
    await this.prisma.moment.update({ where: { id }, data: { status: ContentStatus.PUBLISHED } });
    await this.audit.record(adminId, "MOMENT_RESTORE", "moments", { targetType: "Moment", targetId: id, reason });
    return { message: "Momento restaurado." };
  }

  async endMomentVisibility(id: number, adminId: number, reason: string) {
    await this.ensureExists("moment", id);
    await this.prisma.moment.update({ where: { id }, data: { expiresAt: new Date(), isPermanent: false } });
    await this.audit.record(adminId, "MOMENT_END_VISIBILITY", "moments", { targetType: "Moment", targetId: id, reason });
    return { message: "Visibilidad del momento finalizada." };
  }

  async featureMoment(id: number, adminId: number, position = 0) {
    await this.ensureExists("moment", id);
    await this.placements.upsert({ area: "MOMENTS_FEATURED", entityType: "MOMENT", entityId: id, position, adminId });
    await this.audit.record(adminId, "MOMENT_FEATURE", "moments", { targetType: "Moment", targetId: id });
    return { message: "Momento destacado." };
  }

  async unfeatureMoment(id: number, adminId: number) {
    await this.placements.deactivate("MOMENTS_FEATURED", "MOMENT", id, adminId);
    await this.audit.record(adminId, "MOMENT_UNFEATURE", "moments", { targetType: "Moment", targetId: id });
    return { message: "Destacado retirado." };
  }

  // ==================== UNIVERSITY ====================

  async listUniversity(filters: { search?: string; status?: ContentStatus; type?: string; cursor?: number; limit?: number } = {}) {
    const limit = Math.min(filters.limit ?? 25, 50);
    const where: Record<string, unknown> = {};
    if (filters.status) where.status = filters.status;
    if (filters.type) where.type = filters.type;
    if (filters.search) where.OR = [
      { title: { contains: filters.search, mode: "insensitive" } },
      { description: { contains: filters.search, mode: "insensitive" } },
    ];
    const items = await this.prisma.universityContent.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      ...(filters.cursor ? { cursor: { id: filters.cursor }, skip: 1 } : {}),
      select: { id: true, title: true, type: true, status: true, visibility: true, createdAt: true, startDate: true, deadline: true },
    });
    const hasMore = items.length > limit;
    const slice = items.slice(0, limit);
    return { items: slice, nextCursor: hasMore ? slice[slice.length - 1].id : null };
  }

  async setUniversityStatus(id: number, status: ContentStatus, adminId: number, reason: string) {
    const item = await this.prisma.universityContent.findUnique({ where: { id } });
    if (!item) throw new NotFoundException("Contenido universitario no encontrado.");
    await this.prisma.universityContent.update({ where: { id }, data: { status } });
    await this.audit.record(adminId, `UNIVERSITY_${status}`, "university", { targetType: "UniversityContent", targetId: id, reason, safeAfter: { status } });
    return { message: `Estado actualizado a ${status}.` };
  }

  // ==================== CONVERSATIONS ====================

  async listConversations(filters: { search?: string; status?: ConversationStatus; type?: string; cursor?: number; limit?: number } = {}) {
    const limit = Math.min(filters.limit ?? 25, 50);
    const where: Record<string, unknown> = {};
    if (filters.status) where.status = filters.status;
    if (filters.type) where.type = filters.type;
    if (filters.search) where.OR = [
      { title: { contains: filters.search, mode: "insensitive" } },
      { description: { contains: filters.search, mode: "insensitive" } },
    ];
    const items = await this.prisma.conversation.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      ...(filters.cursor ? { cursor: { id: filters.cursor }, skip: 1 } : {}),
      select: {
        id: true, slug: true, title: true, status: true, type: true, visibility: true, isLocked: true,
        scheduledAt: true, startedAt: true, endedAt: true, createdAt: true,
        creator: { select: { id: true, email: true } },
        _count: { select: { participants: true, recordings: true } },
      },
    });
    const hasMore = items.length > limit;
    const slice = items.slice(0, limit);
    return {
      items: slice.map((c) => ({ ...c, participantsCount: c._count.participants, recordingsCount: c._count.recordings })),
      nextCursor: hasMore ? slice[slice.length - 1].id : null,
    };
  }

  async setConversationDiscovery(id: number, hidden: boolean, adminId: number, reason: string) {
    const conversation = await this.prisma.conversation.findUnique({ where: { id }, select: { id: true } });
    if (!conversation) throw new NotFoundException("Sala no encontrada.");
    await this.prisma.conversation.update({ where: { id }, data: { isLocked: hidden } });
    await this.audit.record(adminId, hidden ? "CONVERSATION_HIDE" : "CONVERSATION_RESTORE", "conversations", { targetType: "Conversation", targetId: id, reason });
    return { message: hidden ? "Sala oculta del descubrimiento." : "Sala restaurada al descubrimiento." };
  }

  async endConversation(id: number, adminId: number, reason: string) {
    if (!reason.trim()) throw new BadRequestException("El motivo es obligatorio.");
    const conversation = await this.prisma.conversation.findUnique({ where: { id }, select: { id: true, status: true } });
    if (!conversation) throw new NotFoundException("Sala no encontrada.");
    await this.prisma.conversation.update({ where: { id }, data: { status: ConversationStatus.ENDED, endedAt: new Date() } });
    await this.audit.record(adminId, "CONVERSATION_END", "conversations", { targetType: "Conversation", targetId: id, reason, safeBefore: { status: conversation.status }, safeAfter: { status: "ENDED" } });
    return { message: "Sala finalizada. Los participantes deben ser desconectados por LiveKit." };
  }

  async cancelConversation(id: number, adminId: number, reason: string) {
    if (!reason.trim()) throw new BadRequestException("El motivo es obligatorio.");
    const conversation = await this.prisma.conversation.findUnique({ where: { id }, select: { id: true, status: true } });
    if (!conversation) throw new NotFoundException("Sala no encontrada.");
    await this.prisma.conversation.update({ where: { id }, data: { status: ConversationStatus.CANCELLED } });
    await this.audit.record(adminId, "CONVERSATION_CANCEL", "conversations", { targetType: "Conversation", targetId: id, reason });
    return { message: "Sala cancelada." };
  }

  private async ensureExists(model: "question" | "document" | "moment", id: number) {
    const entity = await (this.prisma as any)[model].findUnique({ where: { id }, select: { id: true } });
    if (!entity) throw new NotFoundException("Recurso no encontrado.");
    return entity;
  }
}
