import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ContentStatus } from "@prisma/client";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { AdminGuard } from "./guards/admin.guard";
import { AdminPermissionGuard } from "./guards/admin-permission.guard";
import { AdminOnly } from "./decorators/admin-only.decorator";
import { AdminPermission } from "./decorators/admin-permission.decorator";
import { AdminFeedService } from "./services/admin-feed.service";
import { AdminReasonDto } from "./dto/admin-moderation.dto";
import { AdminRequest, adminMeta } from "./types/admin-request";

@Controller("admin/feed")
@UseGuards(JwtAuthGuard, AdminGuard, AdminPermissionGuard)
@AdminOnly()
export class AdminFeedController {
  constructor(private readonly feed: AdminFeedService) {}

  @Get("posts")
  @AdminPermission("feed.manage")
  async listPosts(
    @Query("search") search?: string,
    @Query("authorId") authorId?: string,
    @Query("communityId") communityId?: string,
    @Query("status") status?: ContentStatus,
    @Query("hasReports") hasReports?: string,
    @Query("dateFrom") dateFrom?: string,
    @Query("dateTo") dateTo?: string,
    @Query("cursor") cursor?: string,
    @Query("limit") limit?: string,
  ) {
    return this.feed.listPosts({
      search,
      authorId: authorId ? Number(authorId) : undefined,
      communityId: communityId ? Number(communityId) : undefined,
      status,
      hasReports: hasReports === "true",
      dateFrom,
      dateTo,
      cursor: cursor ? Number(cursor) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Post("posts/:id/hide")
  @AdminPermission("feed.manage")
  async hidePost(@Param("id", ParseIntPipe) id: number, @Req() req: AdminRequest, @Body() dto: AdminReasonDto) {
    return this.feed.hidePost(id, adminMeta(req).adminId, dto.reason);
  }

  @Post("posts/:id/restore")
  @AdminPermission("feed.manage")
  async restorePost(@Param("id", ParseIntPipe) id: number, @Req() req: AdminRequest, @Body() dto: AdminReasonDto) {
    return this.feed.restorePost(id, adminMeta(req).adminId, dto.reason);
  }

  @Post("posts/:id/feature")
  @AdminPermission("feed.manage")
  async featurePost(@Param("id", ParseIntPipe) id: number, @Req() req: AdminRequest, @Body() dto: { position?: number }) {
    return this.feed.featurePost(id, adminMeta(req).adminId, dto.position ?? 0);
  }

  @Post("posts/:id/unfeature")
  @AdminPermission("feed.manage")
  async unfeaturePost(@Param("id", ParseIntPipe) id: number, @Req() req: AdminRequest) {
    return this.feed.unfeaturePost(id, adminMeta(req).adminId);
  }

  @Get("posts/:id/comments")
  @AdminPermission("feed.manage")
  async listComments(@Param("id", ParseIntPipe) id: number) {
    return this.feed.listComments(id);
  }

  @Post("comments/:id/hide")
  @AdminPermission("feed.manage")
  async hideComment(@Param("id", ParseIntPipe) id: number, @Req() req: AdminRequest, @Body() dto: AdminReasonDto) {
    return this.feed.hideComment(id, adminMeta(req).adminId, dto.reason);
  }

  @Post("comments/:id/restore")
  @AdminPermission("feed.manage")
  async restoreComment(@Param("id", ParseIntPipe) id: number, @Req() req: AdminRequest, @Body() dto: AdminReasonDto) {
    return this.feed.restoreComment(id, adminMeta(req).adminId, dto.reason);
  }
}
