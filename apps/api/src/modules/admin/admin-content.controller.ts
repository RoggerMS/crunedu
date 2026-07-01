import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ContentStatus } from "@prisma/client";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AdminGuard } from "./guards/admin.guard";
import { AdminPermissionGuard } from "./guards/admin-permission.guard";
import { AdminOnly } from "./decorators/admin-only.decorator";
import { AdminPermission } from "./decorators/admin-permission.decorator";
import { AdminContentService } from "./services/admin-content.service";
import { AdminReasonDto } from "./dto/admin-moderation.dto";
import { AdminRequest, adminMeta } from "./types/admin-request";

@Controller("admin")
@UseGuards(JwtAuthGuard, AdminGuard, AdminPermissionGuard)
@AdminOnly()
export class AdminContentController {
  constructor(private readonly content: AdminContentService) {}

  // ===== Questions =====
  @Get("questions")
  @AdminPermission("questions.manage")
  async listQuestions(
    @Query("search") search?: string,
    @Query("status") status?: ContentStatus,
    @Query("resolved") resolved?: string,
    @Query("cursor") cursor?: string,
    @Query("limit") limit?: string,
  ) {
    return this.content.listQuestions({
      search, status,
      resolved: resolved === undefined ? undefined : resolved === "true",
      cursor: cursor ? Number(cursor) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Post("questions/:id/hide")
  @AdminPermission("questions.manage")
  async hideQuestion(@Param("id", ParseIntPipe) id: number, @Req() req: AdminRequest, @Body() dto: AdminReasonDto) {
    return this.content.hideQuestion(id, adminMeta(req).adminId, dto.reason);
  }

  @Post("questions/:id/restore")
  @AdminPermission("questions.manage")
  async restoreQuestion(@Param("id", ParseIntPipe) id: number, @Req() req: AdminRequest, @Body() dto: AdminReasonDto) {
    return this.content.restoreQuestion(id, adminMeta(req).adminId, dto.reason);
  }

  @Post("questions/:id/close")
  @AdminPermission("questions.manage")
  async closeQuestion(@Param("id", ParseIntPipe) id: number, @Req() req: AdminRequest, @Body() dto: AdminReasonDto) {
    return this.content.closeQuestion(id, adminMeta(req).adminId, dto.reason);
  }

  @Post("questions/:id/reopen")
  @AdminPermission("questions.manage")
  async reopenQuestion(@Param("id", ParseIntPipe) id: number, @Req() req: AdminRequest, @Body() dto: AdminReasonDto) {
    return this.content.reopenQuestion(id, adminMeta(req).adminId, dto.reason);
  }

  @Post("questions/:id/feature")
  @AdminPermission("questions.manage")
  async featureQuestion(@Param("id", ParseIntPipe) id: number, @Req() req: AdminRequest, @Body() dto: { position?: number }) {
    return this.content.featureQuestion(id, adminMeta(req).adminId, dto.position ?? 0);
  }

  @Post("questions/:id/unfeature")
  @AdminPermission("questions.manage")
  async unfeatureQuestion(@Param("id", ParseIntPipe) id: number, @Req() req: AdminRequest) {
    return this.content.unfeatureQuestion(id, adminMeta(req).adminId);
  }

  // ===== Documents =====
  @Get("documents")
  @AdminPermission("documents.manage")
  async listDocuments(
    @Query("search") search?: string,
    @Query("status") status?: ContentStatus,
    @Query("course") course?: string,
    @Query("cursor") cursor?: string,
    @Query("limit") limit?: string,
  ) {
    return this.content.listDocuments({
      search, status, course,
      cursor: cursor ? Number(cursor) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Post("documents/:id/approve")
  @AdminPermission("documents.manage")
  async approveDocument(@Param("id", ParseIntPipe) id: number, @Req() req: AdminRequest, @Body() dto: AdminReasonDto) {
    return this.content.approveDocument(id, adminMeta(req).adminId, dto.reason);
  }

  @Post("documents/:id/reject")
  @AdminPermission("documents.manage")
  async rejectDocument(@Param("id", ParseIntPipe) id: number, @Req() req: AdminRequest, @Body() dto: AdminReasonDto) {
    return this.content.rejectDocument(id, adminMeta(req).adminId, dto.reason);
  }

  @Post("documents/:id/feature")
  @AdminPermission("documents.manage")
  async featureDocument(@Param("id", ParseIntPipe) id: number, @Req() req: AdminRequest, @Body() dto: { position?: number }) {
    return this.content.featureDocument(id, adminMeta(req).adminId, dto.position ?? 0);
  }

  @Post("documents/:id/unfeature")
  @AdminPermission("documents.manage")
  async unfeatureDocument(@Param("id", ParseIntPipe) id: number, @Req() req: AdminRequest) {
    return this.content.unfeatureDocument(id, adminMeta(req).adminId);
  }

  // ===== Moments =====
  @Get("moments")
  @AdminPermission("moments.manage")
  async listMoments(
    @Query("search") search?: string,
    @Query("status") status?: ContentStatus,
    @Query("type") type?: string,
    @Query("cursor") cursor?: string,
    @Query("limit") limit?: string,
  ) {
    return this.content.listMoments({
      search, status, type,
      cursor: cursor ? Number(cursor) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Post("moments/:id/hide")
  @AdminPermission("moments.manage")
  async hideMoment(@Param("id", ParseIntPipe) id: number, @Req() req: AdminRequest, @Body() dto: AdminReasonDto) {
    return this.content.hideMoment(id, adminMeta(req).adminId, dto.reason);
  }

  @Post("moments/:id/restore")
  @AdminPermission("moments.manage")
  async restoreMoment(@Param("id", ParseIntPipe) id: number, @Req() req: AdminRequest, @Body() dto: AdminReasonDto) {
    return this.content.restoreMoment(id, adminMeta(req).adminId, dto.reason);
  }

  @Post("moments/:id/end-visibility")
  @AdminPermission("moments.manage")
  async endMoment(@Param("id", ParseIntPipe) id: number, @Req() req: AdminRequest, @Body() dto: AdminReasonDto) {
    return this.content.endMomentVisibility(id, adminMeta(req).adminId, dto.reason);
  }

  @Post("moments/:id/feature")
  @AdminPermission("moments.manage")
  async featureMoment(@Param("id", ParseIntPipe) id: number, @Req() req: AdminRequest, @Body() dto: { position?: number }) {
    return this.content.featureMoment(id, adminMeta(req).adminId, dto.position ?? 0);
  }

  @Post("moments/:id/unfeature")
  @AdminPermission("moments.manage")
  async unfeatureMoment(@Param("id", ParseIntPipe) id: number, @Req() req: AdminRequest) {
    return this.content.unfeatureMoment(id, adminMeta(req).adminId);
  }
}
