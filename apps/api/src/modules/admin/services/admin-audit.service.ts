import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { createHash } from "node:crypto";

export interface AuditContext {
  targetType?: string;
  targetId?: number;
  reason?: string;
  safeBefore?: Record<string, unknown> | null;
  safeAfter?: Record<string, unknown> | null;
  requestId?: string;
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class AdminAuditService {
  private readonly logger = new Logger(AdminAuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async record(
    adminUserId: number,
    action: string,
    module: string,
    context: AuditContext = {},
  ): Promise<void> {
    try {
      await this.prisma.adminAuditLog.create({
        data: {
          adminUserId,
          action,
          module,
          targetType: context.targetType ?? null,
          targetId: context.targetId ?? null,
          reason: context.reason ?? null,
          safeBefore: (context.safeBefore ?? null) as never,
          safeAfter: (context.safeAfter ?? null) as never,
          requestId: context.requestId ?? null,
          ipHash: context.ip ? this.hash(context.ip) : null,
          userAgentHash: context.userAgent ? this.hash(context.userAgent) : null,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to record audit log: ${(error as Error).message}`);
    }
  }

  async query(filters: {
    adminUserId?: number;
    module?: string;
    action?: string;
    targetType?: string;
    targetId?: number;
    requestId?: string;
    dateFrom?: string;
    dateTo?: string;
    cursor?: number;
    limit?: number;
  } = {}) {
    const limit = Math.min(filters.limit ?? 50, 100);
    const where: Record<string, unknown> = {};
    if (filters.adminUserId) where.adminUserId = filters.adminUserId;
    if (filters.module) where.module = filters.module;
    if (filters.action) where.action = filters.action;
    if (filters.targetType) where.targetType = filters.targetType;
    if (filters.targetId) where.targetId = filters.targetId;
    if (filters.requestId) where.requestId = filters.requestId;
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {
        ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
        ...(filters.dateTo ? { lte: new Date(filters.dateTo) } : {}),
      };
    }

    const logs = await this.prisma.adminAuditLog.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      ...(filters.cursor ? { cursor: { id: filters.cursor }, skip: 1 } : {}),
      select: {
        id: true,
        adminUserId: true,
        action: true,
        module: true,
        targetType: true,
        targetId: true,
        reason: true,
        safeBefore: true,
        safeAfter: true,
        requestId: true,
        createdAt: true,
        adminUser: { select: { id: true, email: true } },
      },
    });

    const hasMore = logs.length > limit;
    const slice = logs.slice(0, limit);
    return {
      items: slice.map((l) => ({
        id: l.id,
        adminUserId: l.adminUserId,
        adminEmail: l.adminUser?.email ?? "—",
        action: l.action,
        module: l.module,
        targetType: l.targetType,
        targetId: l.targetId,
        reason: l.reason,
        safeBefore: l.safeBefore,
        safeAfter: l.safeAfter,
        requestId: l.requestId,
        createdAt: l.createdAt,
      })),
      nextCursor: hasMore ? slice[slice.length - 1].id : null,
    };
  }

  private hash(value: string): string {
    return createHash("sha256").update(value).digest("hex");
  }
}
