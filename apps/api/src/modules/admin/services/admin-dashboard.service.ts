import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class AdminDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview() {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const last7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      usersTotal,
      usersToday,
      users7d,
      users30d,
      postsTotal,
      commentsTotal,
      questionsTotal,
      answersTotal,
      documentsTotal,
      communitiesTotal,
      momentsTotal,
      conversationsTotal,
      productsTotal,
      reportsOpen,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { createdAt: { gte: startOfToday } } }),
      this.prisma.user.count({ where: { createdAt: { gte: last7 } } }),
      this.prisma.user.count({ where: { createdAt: { gte: last30 } } }),
      this.prisma.post.count({ where: { status: "PUBLISHED" } }),
      this.prisma.comment.count({ where: { status: "PUBLISHED" } }),
      this.prisma.question.count({ where: { status: "PUBLISHED" } }),
      this.prisma.answer.count({ where: { status: "PUBLISHED" } }),
      this.prisma.document.count({ where: { status: "PUBLISHED" } }),
      this.prisma.community.count({ where: { status: "PUBLISHED" } }),
      this.prisma.moment.count(),
      this.prisma.conversation.count(),
      this.prisma.product.count({ where: { status: { in: ["ACTIVE", "DRAFT"] } } }),
      this.prisma.report.count({ where: { status: { in: ["OPEN", "UNDER_REVIEW"] } } }),
    ]);

    return {
      users: { total: usersTotal, today: usersToday, last7d: users7d, last30d: users30d },
      posts: postsTotal,
      comments: commentsTotal,
      questions: questionsTotal,
      answers: answersTotal,
      documents: documentsTotal,
      communities: communitiesTotal,
      moments: momentsTotal,
      conversations: conversationsTotal,
      products: productsTotal,
      reportsOpen,
    };
  }

  async getReportsSummary() {
    const reports = await this.prisma.report.findMany({
      where: { status: { in: ["OPEN", "UNDER_REVIEW"] } },
      orderBy: [{ createdAt: "asc" }],
      select: { id: true, reason: true, createdAt: true, status: true },
    });

    const scored = reports.map((r) => ({
      ...r,
      priorityScore: this.calculatePriority(r.reason, r.createdAt),
    }));

    const high = scored.filter((r) => this.mapSeverity(r.priorityScore) === "high").length;
    const medium = scored.filter((r) => this.mapSeverity(r.priorityScore) === "medium").length;
    const low = scored.filter((r) => this.mapSeverity(r.priorityScore) === "low").length;

    const slaHours = { high: 4, medium: 24, low: 72 };
    const overdue = scored.filter((r) => {
      const sev = this.mapSeverity(r.priorityScore);
      const ageHours = (Date.now() - r.createdAt.getTime()) / 3_600_000;
      return ageHours > slaHours[sev];
    }).length;

    const byModule = {
      posts: await this.prisma.report.count({ where: { postId: { not: null }, status: { in: ["OPEN", "UNDER_REVIEW"] } } }),
      comments: await this.prisma.report.count({ where: { commentId: { not: null }, status: { in: ["OPEN", "UNDER_REVIEW"] } } }),
      questions: await this.prisma.report.count({ where: { questionId: { not: null }, status: { in: ["OPEN", "UNDER_REVIEW"] } } }),
      answers: await this.prisma.report.count({ where: { answerId: { not: null }, status: { in: ["OPEN", "UNDER_REVIEW"] } } }),
      documents: await this.prisma.report.count({ where: { documentId: { not: null }, status: { in: ["OPEN", "UNDER_REVIEW"] } } }),
      products: await this.prisma.report.count({ where: { productId: { not: null }, status: { in: ["OPEN", "UNDER_REVIEW"] } } }),
      moments: await this.prisma.report.count({ where: { momentId: { not: null }, status: { in: ["OPEN", "UNDER_REVIEW"] } } }),
    };

    return { critical: 0, high, medium, low, overdue, byModule, total: reports.length };
  }

  async getRecentActivity() {
    const [newUsers, recentPosts, recentReports, recentAudit] = await Promise.all([
      this.prisma.user.findMany({
        orderBy: [{ createdAt: "desc" }],
        take: 5,
        select: { id: true, email: true, createdAt: true, profile: { select: { firstName: true, lastName: true } } },
      }),
      this.prisma.post.findMany({
        where: { status: "PUBLISHED" },
        orderBy: [{ createdAt: "desc" }],
        take: 5,
        select: { id: true, title: true, createdAt: true, user: { select: { id: true, profile: { select: { firstName: true, lastName: true } } } } },
      }),
      this.prisma.report.findMany({
        orderBy: [{ createdAt: "desc" }],
        take: 5,
        select: { id: true, reason: true, createdAt: true, status: true },
      }),
      this.prisma.adminAuditLog.findMany({
        orderBy: [{ createdAt: "desc" }],
        take: 5,
        select: { id: true, action: true, module: true, createdAt: true, adminUser: { select: { id: true, email: true } } },
      }),
    ]);

    return {
      newUsers: newUsers.map((u) => ({ id: u.id, email: u.email, name: `${u.profile?.firstName ?? ""} ${u.profile?.lastName ?? ""}`.trim(), createdAt: u.createdAt })),
      posts: recentPosts.map((p) => ({ id: p.id, title: p.title, createdAt: p.createdAt, author: `${p.user.profile?.firstName ?? ""} ${p.user.profile?.lastName ?? ""}`.trim() })),
      reports: recentReports,
      adminActions: recentAudit.map((a) => ({ id: a.id, action: a.action, module: a.module, createdAt: a.createdAt, admin: a.adminUser?.email ?? "—" })),
    };
  }

  private calculatePriority(reason: string, createdAt: Date) {
    const text = reason.toLowerCase();
    let severity = 1;
    if (text.includes("acoso") || text.includes("violencia") || text.includes("odio") || text.includes("amenaza")) severity = 3;
    else if (text.includes("spam") || text.includes("insulto")) severity = 2;
    const ageHours = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
    return severity * 100 + Math.max(0, 72 - ageHours);
  }

  private mapSeverity(score: number): "high" | "medium" | "low" {
    if (score >= 250) return "high";
    if (score >= 150) return "medium";
    return "low";
  }
}
