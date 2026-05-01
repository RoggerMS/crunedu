import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ContentStatus, Prisma, ReportStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateReportDto, ReportTargetType } from "./dto/create-report.dto";
import { ModerateReportDto, ModerationDecision, ReportReviewStatus } from "./dto/moderate-report.dto";

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateReportDto, reporterId: number) {
    const reason = dto.reason.trim();
    if (!reason) throw new BadRequestException("El motivo del reporte es obligatorio.");

    if (dto.targetType === ReportTargetType.POST) {
      await this.ensurePost(dto.targetId);
      return this.prisma.report.create({ data: { reporterId, reason, postId: dto.targetId } });
    }

    await this.ensureComment(dto.targetId);
    return this.prisma.report.create({ data: { reporterId, reason, commentId: dto.targetId } });
  }

  async index(filters: { communityId?: number; severity?: "high" | "medium" | "low"; status?: "open" | "reviewing" | "resolved"; dateFrom?: string; dateTo?: string }) {
    const reports = await this.prisma.report.findMany({
      where: {
        ...(filters.communityId
          ? {
              OR: [{ post: { communityId: filters.communityId } }, { comment: { post: { communityId: filters.communityId } } }],
            }
          : {}),
        ...(filters.status ? { status: this.mapStatusToPrisma(filters.status) } : {}),
        ...(filters.dateFrom || filters.dateTo
          ? {
              createdAt: {
                ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
                ...(filters.dateTo ? { lte: new Date(filters.dateTo) } : {}),
              },
            }
          : {}),
      },
      orderBy: [{ createdAt: "asc" }],
      include: {
        reporter: { select: { id: true, email: true } },
        post: { select: { id: true, title: true, status: true, communityId: true } },
        comment: { select: { id: true, content: true, status: true, postId: true, post: { select: { communityId: true } } } },
        moderator: { select: { id: true, email: true } },
      },
    });

    const queue = reports
      .map((report) => ({ ...report, priorityScore: this.calculatePriority(report.reason, report.createdAt), severity: this.mapSeverity(this.calculatePriority(report.reason, report.createdAt)) }))
      .filter((report) => (filters.severity ? this.mapSeverity(report.priorityScore) === filters.severity : true))
      .sort((a, b) => b.priorityScore - a.priorityScore);

    return queue.map((report) => ({
      ...report,
      slaTargetHours: report.severity === "high" ? 4 : report.severity === "medium" ? 24 : 72,
    }));
  }

  async moderate(reportId: number, moderatorId: number, dto: ModerateReportDto) {
    const report = await this.findReport(reportId);
    const targetOwnerId = await this.resolveTargetOwner(report);
    const prismaStatus = this.mapReviewStatusToPrisma(dto.status);

    await this.prisma.$transaction(async (tx) => {
      await tx.report.update({
        where: { id: reportId },
        data: { status: prismaStatus, moderatedAt: new Date(), moderatedById: moderatorId },
      });

      if (dto.decision !== ModerationDecision.DISMISS) {
        await this.updateTargetStatus(tx, report, "HIDDEN");
      }

      await this.applyDecision(tx, dto, targetOwnerId, moderatorId);
      await this.registerAuditLog(tx, reportId, moderatorId, dto, targetOwnerId);
    });

    return { message: "Moderación aplicada correctamente." };
  }



  async moderateBulk(reportIds: number[], moderatorId: number, dto: ModerateReportDto) {
    const uniqueIds = [...new Set(reportIds)].filter((id) => Number.isInteger(id) && id > 0);
    if (!uniqueIds.length) throw new BadRequestException("Debe enviar IDs de reportes válidos.");

    for (const reportId of uniqueIds) {
      await this.moderate(reportId, moderatorId, dto);
    }

    return { message: `Se moderaron ${uniqueIds.length} reportes.` };
  }

  async auditTrail(reportId: number) {
    await this.findReport(reportId);

    return this.prisma.moderationLog.findMany({
      where: { entityType: "REPORT", entityId: reportId },
      orderBy: { createdAt: "desc" },
      include: { moderator: { select: { id: true, email: true } } },
    });
  }

  async getUserReputation(userId: number) {
    const [usefulAnswers, acceptedAnswers, confirmedReports] = await Promise.all([
      this.prisma.answer.count({ where: { userId, isUseful: true } }),
      this.prisma.answer.count({ where: { userId, question: { isResolved: true }, isUseful: true } }),
      this.prisma.report.count({
        where: { status: ReportStatus.RESOLVED, OR: [{ post: { userId } }, { comment: { userId } }] },
      }),
    ]);

    const score = usefulAnswers * 10 + acceptedAnswers * 5 - confirmedReports * 15;
    return { userId, score, usefulAnswers, acceptedAnswers, confirmedReports };
  }

  private async applyDecision(tx: Prisma.TransactionClient, dto: ModerateReportDto, userId: number, moderatorId: number) {
    const duration = dto.sanctionHours ? dto.sanctionHours : 72;

    if (dto.decision === ModerationDecision.WARNING) {
      await tx.moderationLog.create({
        data: { moderatorId, action: "WARNING", entityType: "USER", entityId: userId, reason: dto.reason },
      });
      return;
    }

    if (dto.decision === ModerationDecision.TEMP_POST_LIMIT || dto.decision === ModerationDecision.SUSPENSION) {
      await tx.userSanction.create({
        data: {
          userId,
          type: dto.decision === ModerationDecision.SUSPENSION ? "SUSPENSION" : "TEMP_POST_LIMIT",
          reason: dto.reason,
          expiresAt: new Date(Date.now() + duration * 60 * 60 * 1000),
        },
      });
    }
  }

  private async registerAuditLog(
    tx: Prisma.TransactionClient,
    reportId: number,
    moderatorId: number,
    dto: ModerateReportDto,
    targetOwnerId: number,
  ) {
    await tx.moderationLog.create({
      data: {
        moderatorId,
        action: `REPORT_${dto.decision.toUpperCase()}`,
        entityType: "REPORT",
        entityId: reportId,
        reason: `${dto.reason} | status:${dto.status} | user:${targetOwnerId}`,
      },
    });
  }

  private mapStatusToPrisma(status: "open" | "reviewing" | "resolved"): ReportStatus {
    if (status === "open") return ReportStatus.OPEN;
    if (status === "reviewing") return ReportStatus.UNDER_REVIEW;
    return ReportStatus.RESOLVED;
  }

  private mapReviewStatusToPrisma(status: ReportReviewStatus): ReportStatus {
    if (status === ReportReviewStatus.OPEN) return ReportStatus.OPEN;
    if (status === ReportReviewStatus.REVIEWING) return ReportStatus.UNDER_REVIEW;
    return ReportStatus.RESOLVED;
  }

  private calculatePriority(reason: string, createdAt: Date) {
    const text = reason.toLowerCase();
    let severity = 1;
    if (text.includes("acoso") || text.includes("violencia") || text.includes("odio")) severity = 3;
    else if (text.includes("spam") || text.includes("insulto")) severity = 2;

    const ageHours = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
    return severity * 100 + Math.max(0, 72 - ageHours);
  }

  private mapSeverity(score: number): "high" | "medium" | "low" {
    if (score >= 250) return "high";
    if (score >= 150) return "medium";
    return "low";
  }

  private async findReport(reportId: number) {
    const report = await this.prisma.report.findUnique({ where: { id: reportId } });
    if (!report) throw new NotFoundException("Reporte no encontrado.");
    if (!report.postId && !report.commentId) throw new BadRequestException("Este reporte no tiene objetivo moderable.");
    return report;
  }

  private async resolveTargetOwner(report: { postId: number | null; commentId: number | null }) {
    if (report.postId) {
      const post = await this.prisma.post.findUnique({ where: { id: report.postId }, select: { userId: true } });
      if (!post) throw new NotFoundException("Publicación no encontrada.");
      return post.userId;
    }

    const comment = await this.prisma.comment.findUnique({ where: { id: report.commentId! }, select: { userId: true } });
    if (!comment) throw new NotFoundException("Comentario no encontrado.");
    return comment.userId;
  }

  private async updateTargetStatus(tx: Prisma.TransactionClient, report: { postId: number | null; commentId: number | null }, status: ContentStatus) {
    if (report.postId) return tx.post.update({ where: { id: report.postId }, data: { status } });
    if (report.commentId) return tx.comment.update({ where: { id: report.commentId }, data: { status } });
  }

  private async ensurePost(id: number) {
    const post = await this.prisma.post.findUnique({ where: { id }, select: { id: true } });
    if (!post) throw new NotFoundException("Publicación no encontrada.");
  }

  private async ensureComment(id: number) {
    const comment = await this.prisma.comment.findUnique({ where: { id }, select: { id: true } });
    if (!comment) throw new NotFoundException("Comentario no encontrado.");
  }
}
