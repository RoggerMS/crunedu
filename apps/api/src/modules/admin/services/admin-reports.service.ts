import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ContentStatus } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { ReportsService } from "../../reports/reports.service";
import { ModerateReportDto } from "../../reports/dto/moderate-report.dto";
import { AdminAuditService } from "./admin-audit.service";

export interface AdminReportCase {
  id: number;
  sourceType: string;
  sourceId: number | null;
  targetType: string;
  targetId: number | null;
  targetPreview: string;
  reporter: { id: number; email: string } | null;
  reportedUser: { id: number; email: string } | null;
  reason: string;
  description: string | null;
  severity: "high" | "medium" | "low";
  status: string;
  createdAt: Date;
  assignedTo: { id: number; email: string } | null;
  resolution: string | null;
  relatedReportsCount: number;
}

export interface ReportFilters {
  status?: "open" | "reviewing" | "resolved";
  severity?: "high" | "medium" | "low";
  module?: string;
  dateFrom?: string;
  dateTo?: string;
  cursor?: number;
  limit?: number;
}

@Injectable()
export class AdminReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reportsService: ReportsService,
    private readonly audit: AdminAuditService,
  ) {}

  async list(filters: ReportFilters) {
    const reports = await this.reportsService.index({
      status: filters.status,
      severity: filters.severity,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
    });

    let cases = await Promise.all(reports.map((r) => this.toReportCase(r as never)));

    if (filters.module) {
      cases = cases.filter((c) => c.targetType.toLowerCase() === filters.module!.toLowerCase());
    }

    const limit = Math.min(filters.limit ?? 50, 100);
    const start = filters.cursor ? cases.findIndex((c) => c.id === filters.cursor) + 1 : 0;
    const slice = cases.slice(start, start + limit);
    const nextCursor = start + limit < cases.length ? slice[slice.length - 1]?.id ?? null : null;

    return { items: slice, nextCursor, total: cases.length };
  }

  async moderate(reportId: number, adminId: number, dto: ModerateReportDto) {
    const result = await this.reportsService.moderate(reportId, adminId, dto);
    await this.audit.record(adminId, "REPORT_MODERATE", "reports", {
      targetType: "Report",
      targetId: reportId,
      reason: dto.reason,
      safeAfter: { status: dto.status, decision: dto.decision },
    });
    return result;
  }

  async moderateBulk(reportIds: number[], adminId: number, dto: ModerateReportDto) {
    const uniqueIds = [...new Set(reportIds)].filter((id) => Number.isInteger(id) && id > 0).slice(0, 50);
    if (!uniqueIds.length) throw new BadRequestException("Debe enviar IDs de reportes válidos (máximo 50).");
    const result = await this.reportsService.moderateBulk(uniqueIds, adminId, dto);
    await this.audit.record(adminId, "REPORT_MODERATE_BULK", "reports", {
      targetType: "Report",
      reason: dto.reason,
      safeAfter: { count: uniqueIds.length, decision: dto.decision },
    });
    return result;
  }

  async restore(reportId: number, adminId: number, reason: string) {
    if (!reason.trim()) throw new BadRequestException("El motivo es obligatorio.");
    const report = await this.prisma.report.findUnique({ where: { id: reportId } });
    if (!report) throw new NotFoundException("Reporte no encontrado.");

    await this.restoreTarget(report);
    await this.audit.record(adminId, "CONTENT_RESTORE", "reports", {
      targetType: "Report",
      targetId: reportId,
      reason,
    });
    return { message: "Contenido restaurado." };
  }

  async auditTrail(reportId: number) {
    return this.reportsService.auditTrail(reportId);
  }

  async reputation(userId: number) {
    return this.reportsService.getUserReputation(userId);
  }

  private async restoreTarget(report: {
    postId: number | null;
    commentId: number | null;
    questionId: number | null;
    answerId: number | null;
    documentId: number | null;
  }) {
    if (report.postId) return this.prisma.post.update({ where: { id: report.postId }, data: { status: ContentStatus.PUBLISHED } });
    if (report.commentId) return this.prisma.comment.update({ where: { id: report.commentId }, data: { status: ContentStatus.PUBLISHED } });
    if (report.questionId) return this.prisma.question.update({ where: { id: report.questionId }, data: { status: ContentStatus.PUBLISHED } });
    if (report.documentId) return this.prisma.document.update({ where: { id: report.documentId }, data: { status: ContentStatus.PUBLISHED } });
    if (report.answerId) return this.prisma.answer.update({ where: { id: report.answerId }, data: { status: ContentStatus.PUBLISHED } });
    throw new BadRequestException("Este reporte no tiene un objetivo restaurable.");
  }

  private async toReportCase(report: any): Promise<AdminReportCase> {
    const targetType = this.resolveTargetType(report);
    const targetId = this.resolveTargetId(report, targetType);
    const targetPreview = this.resolveTargetPreview(report, targetType);
    const reportedUser = await this.resolveReportedUser(report, targetType, targetId);

    const relatedReportsCount = targetId
      ? await this.prisma.report.count({ where: this.relatedFilter(targetType, targetId) } as never)
      : 0;

    return {
      id: report.id,
      sourceType: "Report",
      sourceId: report.id,
      targetType,
      targetId,
      targetPreview,
      reporter: report.reporter ? { id: report.reporter.id, email: report.reporter.email } : null,
      reportedUser,
      reason: report.reason,
      description: report.description ?? null,
      severity: report.severity ?? "low",
      status: report.status,
      createdAt: report.createdAt,
      assignedTo: report.moderator ? { id: report.moderator.id, email: report.moderator.email } : null,
      resolution: report.moderatedAt ? report.status : null,
      relatedReportsCount,
    };
  }

  private resolveTargetType(report: any): string {
    if (report.postId) return "post";
    if (report.commentId) return "comment";
    if (report.questionId) return "question";
    if (report.answerId) return "answer";
    if (report.documentId) return "document";
    if (report.productId) return "product";
    if (report.momentId) return "moment";
    return "unknown";
  }

  private resolveTargetId(report: any, type: string): number | null {
    return report[`${type}Id`] ?? null;
  }

  private resolveTargetPreview(report: any, type: string): string {
    const entity = report[type];
    if (!entity) return "—";
    return entity.title ?? entity.content ?? `#${entity.id ?? "?"}`;
  }

  private async resolveReportedUser(report: any, type: string, id: number | null) {
    if (!id) return null;
    const model = this.targetModel(type);
    if (!model) return null;
    const entity = await (this.prisma as any)[model].findUnique({ where: { id }, select: { userId: true, user: { select: { id: true, email: true } } } });
    return entity?.user ? { id: entity.user.id, email: entity.user.email } : null;
  }

  private targetModel(type: string): string | null {
    switch (type) {
      case "post": return "post";
      case "comment": return "comment";
      case "question": return "question";
      case "answer": return "answer";
      case "document": return "document";
      default: return null;
    }
  }

  private relatedFilter(type: string, id: number): Record<string, unknown> {
    return { [`${type}Id`]: id };
  }
}
