import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { Role } from "@prisma/client";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { AdminGuard } from "./guards/admin.guard";
import { AdminPermissionGuard } from "./guards/admin-permission.guard";
import { AdminStepUpGuard } from "./guards/admin-step-up.guard";
import { AdminOnly } from "./decorators/admin-only.decorator";
import { AdminPermission } from "./decorators/admin-permission.decorator";
import { RequireAdminStepUp } from "./decorators/require-admin-step-up.decorator";
import { AdminUsersService } from "./services/admin-users.service";
import { AdminUserSanctionDto } from "./dto/admin-user-sanction.dto";
import { AdminRoleChangeDto } from "./dto/admin-role-change.dto";
import { AdminReasonDto } from "./dto/admin-moderation.dto";
import { AdminRequest, adminMeta } from "./types/admin-request";

@Controller("admin/users")
@UseGuards(JwtAuthGuard, AdminGuard, AdminPermissionGuard)
@AdminOnly()
export class AdminUsersController {
  constructor(private readonly users: AdminUsersService) {}

  @Get()
  @AdminPermission("users.read")
  async list(
    @Query("search") search?: string,
    @Query("role") role?: Role,
    @Query("status") status?: "active" | "limited" | "suspended",
    @Query("verified") verified?: string,
    @Query("dateFrom") dateFrom?: string,
    @Query("dateTo") dateTo?: string,
    @Query("cursor") cursor?: string,
    @Query("limit") limit?: string,
  ) {
    return this.users.list({
      search,
      role,
      status,
      verified: verified === undefined ? undefined : verified === "true",
      dateFrom,
      dateTo,
      cursor: cursor ? Number(cursor) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get(":id")
  @AdminPermission("users.read")
  async detail(@Param("id", ParseIntPipe) id: number) {
    return this.users.detail(id);
  }

  @Post(":id/warn")
  @AdminPermission("users.moderate")
  async warn(@Param("id", ParseIntPipe) id: number, @Req() req: AdminRequest, @Body() dto: AdminReasonDto) {
    return this.users.warn(id, adminMeta(req).adminId, dto.reason);
  }

  @Post(":id/sanction")
  @AdminPermission("users.moderate")
  @RequireAdminStepUp()
  async sanction(@Param("id", ParseIntPipe) id: number, @Req() req: AdminRequest, @Body() dto: AdminUserSanctionDto) {
    return this.users.sanction(id, adminMeta(req).adminId, dto);
  }

  @Post(":id/reactivate")
  @AdminPermission("users.moderate")
  @RequireAdminStepUp()
  async reactivate(@Param("id", ParseIntPipe) id: number, @Req() req: AdminRequest, @Body() dto: AdminReasonDto) {
    return this.users.reactivate(id, adminMeta(req).adminId, dto.reason);
  }

  @Post(":id/verify")
  @AdminPermission("users.moderate")
  async setVerified(@Param("id", ParseIntPipe) id: number, @Req() req: AdminRequest, @Body() dto: AdminReasonDto) {
    return this.users.setVerified(id, adminMeta(req).adminId, true, dto.reason);
  }

  @Post(":id/unverify")
  @AdminPermission("users.moderate")
  async setUnverified(@Param("id", ParseIntPipe) id: number, @Req() req: AdminRequest, @Body() dto: AdminReasonDto) {
    return this.users.setVerified(id, adminMeta(req).adminId, false, dto.reason);
  }

  @Patch(":id/role")
  @AdminPermission("users.moderate")
  @RequireAdminStepUp()
  async changeRole(@Param("id", ParseIntPipe) id: number, @Req() req: AdminRequest, @Body() dto: AdminRoleChangeDto) {
    return this.users.changeRole(id, adminMeta(req).adminId, dto.role as Role, dto.reason);
  }
}
