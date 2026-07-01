import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { AdminGuard } from "./guards/admin.guard";
import { AdminPermissionGuard } from "./guards/admin-permission.guard";
import { AdminOnly } from "./decorators/admin-only.decorator";
import { AdminPermission } from "./decorators/admin-permission.decorator";
import { AdminReportsService } from "./services/admin-reports.service";
import { AdminAuditService } from "./services/admin-audit.service";
import { ModerateReportDto } from "../../reports/dto/moderate-report.dto";
import { AdminReasonDto } from "./dto/admin-moderation.dto";
import { AdminRequest, adminMeta } from "./types/admin-request";

@Controller("admin/reports")
@UseGuards(JwtAuthGuard, AdminGuard, AdminPermissionGuard)
@AdminOnly()
export class AdminReportsController {
  constructor(
    private readonly reports: AdminReportsService,
    private readonly audit: AdminAuditService,
  ) {}

  @Get()
  @AdminPermission("reports.read")
  async list(
    @Query("status") status?: "open" | "reviewing" | "resolved",
    @Query("severity") severity?: "high" | "medium" | "low",
    @Query("module") module?: string,
    @Query("dateFrom") dateFrom?: string,
    @Query("dateTo") dateTo?: string,
    @Query("cursor") cursor?: string,
    @Query("limit") limit?: string,
  ) {
    return this.reports.list({
      status,
      severity,
      module,
      dateFrom,
      dateTo,
      cursor: cursor ? Number(cursor) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Patch("bulk/moderate")
  @AdminPermission("reports.manage")
  async moderateBulk(@Req() req: AdminRequest, @Body() body: { reportIds: number[]; moderation: ModerateReportDto }) {
    return this.reports.moderateBulk(body.reportIds, adminMeta(req).adminId, body.moderation);
  }

  @Patch(":id/moderate")
  @AdminPermission("reports.manage")
  async moderate(@Param("id", ParseIntPipe) id: number, @Req() req: AdminRequest, @Body() dto: ModerateReportDto) {
    return this.reports.moderate(id, adminMeta(req).adminId, dto);
  }

  @Post(":id/restore")
  @AdminPermission("reports.manage")
  async restore(@Param("id", ParseIntPipe) id: number, @Req() req: AdminRequest, @Body() dto: AdminReasonDto) {
    return this.reports.restore(id, adminMeta(req).adminId, dto.reason);
  }

  @Get(":id/audit")
  @AdminPermission("reports.read")
  async auditTrail(@Param("id", ParseIntPipe) id: number) {
    return this.reports.auditTrail(id);
  }

  @Get("reputation/:userId")
  @AdminPermission("reports.read")
  async reputation(@Param("userId", ParseIntPipe) userId: number) {
    return this.reports.reputation(userId);
  }
}
