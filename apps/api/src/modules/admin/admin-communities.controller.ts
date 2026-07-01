import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ContentStatus } from "@prisma/client";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AdminGuard } from "./guards/admin.guard";
import { AdminPermissionGuard } from "./guards/admin-permission.guard";
import { AdminStepUpGuard } from "./guards/admin-step-up.guard";
import { AdminOnly } from "./decorators/admin-only.decorator";
import { AdminPermission } from "./decorators/admin-permission.decorator";
import { RequireAdminStepUp } from "./decorators/require-admin-step-up.decorator";
import { AdminCommunitiesService } from "./services/admin-communities.service";
import { AdminReasonDto } from "./dto/admin-moderation.dto";
import { AdminRequest, adminMeta } from "./types/admin-request";

@Controller("admin/communities")
@UseGuards(JwtAuthGuard, AdminGuard, AdminPermissionGuard, AdminStepUpGuard)
@AdminOnly()
export class AdminCommunitiesController {
  constructor(private readonly communities: AdminCommunitiesService) {}

  @Get()
  @AdminPermission("communities.manage")
  async list(
    @Query("search") search?: string,
    @Query("status") status?: ContentStatus,
    @Query("cursor") cursor?: string,
    @Query("limit") limit?: string,
  ) {
    return this.communities.list({
      search,
      status,
      cursor: cursor ? Number(cursor) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get(":id")
  @AdminPermission("communities.manage")
  async detail(@Param("id", ParseIntPipe) id: number) {
    return this.communities.detail(id);
  }

  @Post(":id/archive")
  @AdminPermission("communities.manage")
  @RequireAdminStepUp()
  async archive(@Param("id", ParseIntPipe) id: number, @Req() req: AdminRequest, @Body() dto: AdminReasonDto) {
    return this.communities.archive(id, adminMeta(req).adminId, dto.reason);
  }

  @Post(":id/restore")
  @AdminPermission("communities.manage")
  async restore(@Param("id", ParseIntPipe) id: number, @Req() req: AdminRequest, @Body() dto: AdminReasonDto) {
    return this.communities.restore(id, adminMeta(req).adminId, dto.reason);
  }

  @Post(":id/feature")
  @AdminPermission("communities.manage")
  async feature(@Param("id", ParseIntPipe) id: number, @Req() req: AdminRequest, @Body() dto: { position?: number }) {
    return this.communities.feature(id, adminMeta(req).adminId, dto.position ?? 0);
  }

  @Post(":id/unfeature")
  @AdminPermission("communities.manage")
  async unfeature(@Param("id", ParseIntPipe) id: number, @Req() req: AdminRequest) {
    return this.communities.unfeature(id, adminMeta(req).adminId);
  }
}
