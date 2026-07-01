import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ContentStatus, ConversationStatus } from "@prisma/client";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { AdminGuard } from "./guards/admin.guard";
import { AdminPermissionGuard } from "./guards/admin-permission.guard";
import { AdminStepUpGuard } from "./guards/admin-step-up.guard";
import { AdminOnly } from "./decorators/admin-only.decorator";
import { AdminPermission } from "./decorators/admin-permission.decorator";
import { RequireAdminStepUp } from "./decorators/require-admin-step-up.decorator";
import { AdminContentService } from "./services/admin-content.service";
import { AdminContentStatusDto, AdminReasonDto } from "./dto/admin-moderation.dto";
import { AdminRequest, adminMeta } from "./types/admin-request";

@Controller("admin")
@UseGuards(JwtAuthGuard, AdminGuard, AdminPermissionGuard, AdminStepUpGuard)
@AdminOnly()
export class AdminOperationsController {
  constructor(private readonly content: AdminContentService) {}

  // ===== University =====
  @Get("university")
  @AdminPermission("university.manage")
  async listUniversity(
    @Query("search") search?: string,
    @Query("status") status?: ContentStatus,
    @Query("type") type?: string,
    @Query("cursor") cursor?: string,
    @Query("limit") limit?: string,
  ) {
    return this.content.listUniversity({
      search, status, type,
      cursor: cursor ? Number(cursor) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Post("university/:id/status")
  @AdminPermission("university.manage")
  async setUniversityStatus(@Param("id", ParseIntPipe) id: number, @Req() req: AdminRequest, @Body() dto: AdminContentStatusDto) {
    return this.content.setUniversityStatus(id, dto.status, adminMeta(req).adminId, dto.reason);
  }

  // ===== Conversations =====
  @Get("conversations")
  @AdminPermission("conversations.manage")
  async listConversations(
    @Query("search") search?: string,
    @Query("status") status?: ConversationStatus,
    @Query("type") type?: string,
    @Query("cursor") cursor?: string,
    @Query("limit") limit?: string,
  ) {
    return this.content.listConversations({
      search, status, type,
      cursor: cursor ? Number(cursor) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Post("conversations/:id/hide")
  @AdminPermission("conversations.manage")
  async hideConversation(@Param("id", ParseIntPipe) id: number, @Req() req: AdminRequest, @Body() dto: AdminReasonDto) {
    return this.content.setConversationDiscovery(id, true, adminMeta(req).adminId, dto.reason);
  }

  @Post("conversations/:id/restore")
  @AdminPermission("conversations.manage")
  async restoreConversation(@Param("id", ParseIntPipe) id: number, @Req() req: AdminRequest, @Body() dto: AdminReasonDto) {
    return this.content.setConversationDiscovery(id, false, adminMeta(req).adminId, dto.reason);
  }

  @Post("conversations/:id/end")
  @AdminPermission("conversations.manage")
  @RequireAdminStepUp()
  async endConversation(@Param("id", ParseIntPipe) id: number, @Req() req: AdminRequest, @Body() dto: AdminReasonDto) {
    return this.content.endConversation(id, adminMeta(req).adminId, dto.reason);
  }

  @Post("conversations/:id/cancel")
  @AdminPermission("conversations.manage")
  async cancelConversation(@Param("id", ParseIntPipe) id: number, @Req() req: AdminRequest, @Body() dto: AdminReasonDto) {
    return this.content.cancelConversation(id, adminMeta(req).adminId, dto.reason);
  }
}
