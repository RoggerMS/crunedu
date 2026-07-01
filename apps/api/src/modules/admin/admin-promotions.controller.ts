import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, Req, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { PromotionPlacement, PromotionStatus } from "@prisma/client";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AdminGuard } from "./guards/admin.guard";
import { AdminPermissionGuard } from "./guards/admin-permission.guard";
import { AdminStepUpGuard } from "./guards/admin-step-up.guard";
import { AdminOnly } from "./decorators/admin-only.decorator";
import { AdminPermission } from "./decorators/admin-permission.decorator";
import { RequireAdminStepUp } from "./decorators/require-admin-step-up.decorator";
import { AdminPromotionsService } from "./services/admin-promotions.service";
import { AdminPlacementsService } from "./services/admin-placements.service";
import { CreatePromotionDto, UpdatePromotionDto, AdminPromotionStatusDto } from "./dto/admin-promotions.dto";
import { AdminPlacementDto, AdminReorderDto } from "./dto/admin-placements.dto";
import { AdminRequest, adminMeta } from "./types/admin-request";

@Controller("admin")
@UseGuards(JwtAuthGuard, AdminGuard, AdminPermissionGuard, AdminStepUpGuard)
@AdminOnly()
export class AdminPromotionsController {
  constructor(
    private readonly promotions: AdminPromotionsService,
    private readonly placements: AdminPlacementsService,
  ) {}

  // ===== Promotions =====
  @Get("promotions")
  @AdminPermission("promotions.manage")
  async list(@Query("status") status?: PromotionStatus, @Query("placement") placement?: PromotionPlacement) {
    return this.promotions.list({ status, placement });
  }

  @Post("promotions")
  @AdminPermission("promotions.manage")
  @UseInterceptors(FileInterceptor("image"))
  async create(@Req() req: AdminRequest, @Body() dto: CreatePromotionDto, @UploadedFile() file: any) {
    return this.promotions.create(dto, file, adminMeta(req).adminId);
  }

  @Patch("promotions/:id")
  @AdminPermission("promotions.manage")
  async update(@Param("id", ParseIntPipe) id: number, @Req() req: AdminRequest, @Body() dto: UpdatePromotionDto) {
    return this.promotions.update(id, dto, adminMeta(req).adminId);
  }

  @Post("promotions/:id/status")
  @AdminPermission("promotions.manage")
  @RequireAdminStepUp()
  async setStatus(@Param("id", ParseIntPipe) id: number, @Req() req: AdminRequest, @Body() dto: AdminPromotionStatusDto) {
    return this.promotions.setStatus(id, dto.status, adminMeta(req).adminId);
  }

  // ===== Placements =====
  @Get("placements")
  @AdminPermission("placements.manage")
  async listPlacements(@Query("area") area?: string) {
    return this.placements.listAll(area as never);
  }

  @Post("placements")
  @AdminPermission("placements.manage")
  async upsertPlacement(@Req() req: AdminRequest, @Body() dto: AdminPlacementDto) {
    return this.placements.upsert({ ...dto, adminId: adminMeta(req).adminId });
  }

  @Post("placements/reorder")
  @AdminPermission("placements.manage")
  async reorderPlacements(@Req() req: AdminRequest, @Query("area") area: string, @Body() dto: AdminReorderDto) {
    return this.placements.reorder(area as never, dto.orderedIds, adminMeta(req).adminId);
  }

  @Post("placements/:id/remove")
  @AdminPermission("placements.manage")
  async removePlacement(@Param("id", ParseIntPipe) id: number, @Req() req: AdminRequest) {
    return this.placements.remove(id, adminMeta(req).adminId);
  }
}
