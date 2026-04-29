import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateReportDto, ReportTargetType } from "./dto/create-report.dto";

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateReportDto, reporterId: number) {
    const reason = dto.reason.trim();
    if (!reason) {
      throw new BadRequestException("El motivo del reporte es obligatorio.");
    }

    if (dto.targetType === ReportTargetType.POST) {
      await this.ensurePost(dto.targetId);
      return this.prisma.report.create({
        data: { reporterId, reason, postId: dto.targetId },
      });
    }

    await this.ensureComment(dto.targetId);
    return this.prisma.report.create({
      data: { reporterId, reason, commentId: dto.targetId },
    });
  }

  async index() {
    return this.prisma.report.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        reporter: { select: { id: true, email: true } },
        post: { select: { id: true, title: true, status: true } },
        comment: { select: { id: true, content: true, status: true, postId: true } },
        moderator: { select: { id: true, email: true } },
      },
    });
  }

  async hideTarget(reportId: number, moderatorId: number) {
    const report = await this.findReport(reportId);
    await this.updateTargetStatus(report, "HIDDEN");
    return this.moderateReport(reportId, moderatorId, "RESOLVED", "HIDE_CONTENT");
  }

  async restoreTarget(reportId: number, moderatorId: number) {
    const report = await this.findReport(reportId);
    await this.updateTargetStatus(report, "PUBLISHED");
    return this.moderateReport(reportId, moderatorId, "REJECTED", "RESTORE_CONTENT");
  }

  private async moderateReport(reportId: number, moderatorId: number, status: "RESOLVED" | "REJECTED", action: string) {
    const now = new Date();
    await this.prisma.report.update({
      where: { id: reportId },
      data: { status, moderatedAt: now, moderatedById: moderatorId },
    });

    await this.prisma.moderationLog.create({
      data: {
        moderatorId,
        action,
        entityType: "REPORT",
        entityId: reportId,
      },
    });

    return { message: "Moderación aplicada correctamente." };
  }

  private async findReport(reportId: number) {
    const report = await this.prisma.report.findUnique({ where: { id: reportId } });
    if (!report) throw new NotFoundException("Reporte no encontrado.");
    if (!report.postId && !report.commentId) {
      throw new BadRequestException("Este reporte no tiene un objetivo moderable en esta versión MVP.");
    }
    return report;
  }

  private async updateTargetStatus(report: { postId: number | null; commentId: number | null }, status: "HIDDEN" | "PUBLISHED") {
    if (report.postId) {
      await this.prisma.post.update({ where: { id: report.postId }, data: { status } });
      return;
    }

    if (report.commentId) {
      await this.prisma.comment.update({ where: { id: report.commentId }, data: { status } });
      return;
    }
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
