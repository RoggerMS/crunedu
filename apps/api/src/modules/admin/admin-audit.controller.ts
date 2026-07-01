import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AdminGuard } from "./guards/admin.guard";
import { AdminPermissionGuard } from "./guards/admin-permission.guard";
import { AdminOnly } from "./decorators/admin-only.decorator";
import { AdminPermission } from "./decorators/admin-permission.decorator";
import { AdminAuditService } from "./services/admin-audit.service";

@Controller("admin/audit")
@UseGuards(JwtAuthGuard, AdminGuard, AdminPermissionGuard)
@AdminOnly()
export class AdminAuditController {
  constructor(private readonly audit: AdminAuditService) {}

  @Get()
  @AdminPermission("audit.read")
  async list(
    @Query("adminUserId") adminUserId?: string,
    @Query("module") module?: string,
    @Query("action") action?: string,
    @Query("targetType") targetType?: string,
    @Query("targetId") targetId?: string,
    @Query("requestId") requestId?: string,
    @Query("dateFrom") dateFrom?: string,
    @Query("dateTo") dateTo?: string,
    @Query("cursor") cursor?: string,
    @Query("limit") limit?: string,
  ) {
    return this.audit.query({
      adminUserId: adminUserId ? Number(adminUserId) : undefined,
      module,
      action,
      targetType,
      targetId: targetId ? Number(targetId) : undefined,
      requestId,
      dateFrom,
      dateTo,
      cursor: cursor ? Number(cursor) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }
}
