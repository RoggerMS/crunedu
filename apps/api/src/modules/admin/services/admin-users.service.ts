import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, Role } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { AdminAuditService } from "./admin-audit.service";

export interface ListUsersFilters {
  search?: string;
  role?: Role;
  status?: "active" | "limited" | "suspended";
  verified?: boolean;
  dateFrom?: string;
  dateTo?: string;
  cursor?: number;
  limit?: number;
}

@Injectable()
export class AdminUsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AdminAuditService,
  ) {}

  async list(filters: ListUsersFilters) {
    const limit = Math.min(filters.limit ?? 25, 50);
    const where: Prisma.UserWhereInput = {};

    if (filters.role) where.role = filters.role;
    if (filters.verified !== undefined) where.isVerified = filters.verified;
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {
        ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
        ...(filters.dateTo ? { lte: new Date(filters.dateTo) } : {}),
      };
    }

    if (filters.search) {
      const term = filters.search.trim();
      if (term.length >= 2) {
        where.OR = [
          { email: { contains: term, mode: "insensitive" } },
          { profile: { firstName: { contains: term, mode: "insensitive" } } },
          { profile: { lastName: { contains: term, mode: "insensitive" } } },
          { profile: { username: { contains: term, mode: "insensitive" } } },
        ];
      }
    }

    const users = await this.prisma.user.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      ...(filters.cursor ? { cursor: { id: filters.cursor }, skip: 1 } : {}),
      select: {
        id: true,
        email: true,
        role: true,
        isVerified: true,
        createdAt: true,
        profile: { select: { firstName: true, lastName: true, username: true } },
        sanctions: { where: { isActive: true }, select: { id: true, type: true, expiresAt: true } },
      },
    });

    const hasMore = users.length > limit;
    const slice = users.slice(0, limit);
    const nextCursor = hasMore ? slice[slice.length - 1].id : null;

    const items = slice.map((u) => ({
      id: u.id,
      email: u.email,
      role: u.role,
      isVerified: u.isVerified,
      createdAt: u.createdAt,
      firstName: u.profile?.firstName ?? "",
      lastName: u.profile?.lastName ?? "",
      username: u.profile?.username ?? null,
      status: this.deriveStatus(u.sanctions),
    }));

    if (filters.status && filters.status !== "active") {
      const filtered = items.filter((i) => i.status === filters.status);
      return { items: filtered, nextCursor: null };
    }

    return { items, nextCursor };
  }

  async detail(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
        profile: { select: { firstName: true, lastName: true, username: true, faculty: { select: { name: true } }, career: { select: { name: true } } } },
        sanctions: { orderBy: [{ createdAt: "desc" }], select: { id: true, type: true, reason: true, isActive: true, expiresAt: true, createdAt: true } },
        _count: {
          select: {
            posts: { where: { status: "PUBLISHED" } },
            reportsMade: true,
            productsCreated: true,
            conversationsCreated: true,
            communityMembers: true,
          },
        },
      },
    });

    if (!user) throw new NotFoundException("Usuario no encontrado.");

    const reportsReceived = await this.prisma.report.count({
      where: {
        OR: [
          { post: { userId } },
          { comment: { userId } },
          { question: { userId } },
          { answer: { userId } },
          { document: { userId } },
        ],
      },
    });

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      lastActivity: user.updatedAt,
      firstName: user.profile?.firstName ?? "",
      lastName: user.profile?.lastName ?? "",
      username: user.profile?.username ?? null,
      faculty: user.profile?.faculty?.name ?? null,
      career: user.profile?.career?.name ?? null,
      status: this.deriveStatus(user.sanctions),
      counts: {
        posts: user._count.posts,
        reportsReceived,
        reportsMade: user._count.reportsMade,
        products: user._count.productsCreated,
        conversations: user._count.conversationsCreated,
        communities: user._count.communityMembers,
      },
      sanctions: user.sanctions,
    };
  }

  async warn(targetId: number, adminId: number, reason: string) {
    await this.ensureUser(targetId);
    if (!reason.trim()) throw new BadRequestException("El motivo es obligatorio.");

    await this.prisma.moderationLog.create({
      data: { moderatorId: adminId, action: "WARNING", entityType: "USER", entityId: targetId, reason: reason.trim() },
    });

    await this.audit.record(adminId, "USER_WARN", "users", { targetType: "User", targetId, reason });
    return { message: "Advertencia registrada." };
  }

  async sanction(targetId: number, adminId: number, dto: { type: "TEMP_POST_LIMIT" | "SUSPENSION"; reason: string; hours?: number }) {
    await this.ensureUser(targetId);
    if (!dto.reason.trim()) throw new BadRequestException("El motivo es obligatorio.");

    const expiresAt = dto.type === "SUSPENSION" && !dto.hours
      ? null
      : new Date(Date.now() + (dto.hours ?? 72) * 60 * 60 * 1000);

    await this.prisma.userSanction.create({
      data: {
        userId: targetId,
        type: dto.type,
        reason: dto.reason.trim(),
        isActive: true,
        expiresAt,
      },
    });

    await this.audit.record(adminId, `USER_${dto.type}`, "users", {
      targetType: "User",
      targetId,
      reason: dto.reason,
      safeAfter: { type: dto.type, hours: dto.hours ?? null },
    });

    return { message: "Sanción aplicada." };
  }

  async reactivate(targetId: number, adminId: number, reason: string) {
    await this.ensureUser(targetId);
    const result = await this.prisma.userSanction.updateMany({
      where: { userId: targetId, isActive: true },
      data: { isActive: false },
    });
    await this.audit.record(adminId, "USER_REACTIVATE", "users", { targetType: "User", targetId, reason, safeAfter: { deactivated: result.count } });
    return { message: `Se reactivó al usuario. ${result.count} sanciones desactivadas.` };
  }

  async setVerified(targetId: number, adminId: number, verified: boolean, reason: string) {
    await this.ensureUser(targetId);
    await this.prisma.user.update({ where: { id: targetId }, data: { isVerified: verified } });
    await this.audit.record(adminId, verified ? "USER_VERIFY" : "USER_UNVERIFY", "users", {
      targetType: "User",
      targetId,
      reason,
      safeAfter: { isVerified: verified },
    });
    return { message: verified ? "Usuario verificado." : "Verificación retirada." };
  }

  async changeRole(targetId: number, adminId: number, role: Role, reason: string) {
    if (!reason.trim()) throw new BadRequestException("El motivo es obligatorio.");
    if (targetId === adminId) throw new ForbiddenException("No puedes cambiar tu propio rol.");
    await this.ensureUser(targetId);

    const target = await this.prisma.user.findUnique({ where: { id: targetId }, select: { role: true } });
    if (!target) throw new NotFoundException("Usuario no encontrado.");

    if (target.role === "ADMIN" && role !== "ADMIN") {
      const adminCount = await this.prisma.user.count({ where: { role: "ADMIN" } });
      if (adminCount <= 1) throw new ForbiddenException("No puedes dejar el sistema sin administradores.");
    }

    await this.prisma.user.update({ where: { id: targetId }, data: { role } });
    await this.audit.record(adminId, "USER_ROLE_CHANGE", "users", {
      targetType: "User",
      targetId,
      reason,
      safeBefore: { role: target.role },
      safeAfter: { role },
    });

    return { message: `Rol actualizado a ${role}.` };
  }

  private async ensureUser(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) throw new NotFoundException("Usuario no encontrado.");
    return user;
  }

  private deriveStatus(sanctions: Array<{ type: string; isActive: boolean; expiresAt: Date | null }>): "active" | "limited" | "suspended" {
    const active = sanctions.filter((s) => s.isActive && (!s.expiresAt || s.expiresAt.getTime() > Date.now()));
    if (active.some((s) => s.type === "SUSPENSION")) return "suspended";
    if (active.some((s) => s.type === "TEMP_POST_LIMIT")) return "limited";
    return "active";
  }
}
