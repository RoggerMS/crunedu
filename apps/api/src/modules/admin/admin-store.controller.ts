import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ProductStatus } from "@prisma/client";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { AdminGuard } from "./guards/admin.guard";
import { AdminPermissionGuard } from "./guards/admin-permission.guard";
import { AdminOnly } from "./decorators/admin-only.decorator";
import { AdminPermission } from "./decorators/admin-permission.decorator";
import { AdminStoreService } from "./services/admin-store.service";
import { AdminInquiryStatusDto } from "./dto/admin-placements.dto";
import { AdminReasonDto } from "./dto/admin-moderation.dto";
import { AdminRequest, adminMeta } from "./types/admin-request";

@Controller("admin/store")
@UseGuards(JwtAuthGuard, AdminGuard, AdminPermissionGuard)
@AdminOnly()
export class AdminStoreController {
  constructor(private readonly store: AdminStoreService) {}

  @Get("products")
  @AdminPermission("store.manage")
  async listProducts(
    @Query("search") search?: string,
    @Query("status") status?: ProductStatus,
    @Query("categoryId") categoryId?: string,
    @Query("isFeatured") isFeatured?: string,
    @Query("cursor") cursor?: string,
    @Query("limit") limit?: string,
  ) {
    return this.store.listProducts({
      search, status,
      categoryId: categoryId ? Number(categoryId) : undefined,
      isFeatured: isFeatured === undefined ? undefined : isFeatured === "true",
      cursor: cursor ? Number(cursor) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get("categories")
  @AdminPermission("store.manage")
  async listCategories() {
    return this.store.listCategories();
  }

  @Get("inquiries")
  @AdminPermission("store.manage")
  async listInquiries(
    @Query("status") status?: string,
    @Query("cursor") cursor?: string,
    @Query("limit") limit?: string,
  ) {
    return this.store.listInquiries({
      status,
      cursor: cursor ? Number(cursor) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get("reports")
  @AdminPermission("store.manage")
  async listReports() {
    return this.store.listReports();
  }

  @Get("metrics")
  @AdminPermission("store.manage")
  async metrics() {
    return this.store.metrics();
  }

  @Post("products/:id/status")
  @AdminPermission("store.manage")
  async setProductStatus(@Param("id", ParseIntPipe) id: number, @Req() req: AdminRequest, @Body() dto: { status: ProductStatus; reason: string }) {
    return this.store.setProductStatus(id, dto.status, adminMeta(req).adminId, dto.reason ?? "");
  }

  @Post("products/:id/feature")
  @AdminPermission("store.manage")
  async featureProduct(@Param("id", ParseIntPipe) id: number, @Req() req: AdminRequest, @Body() dto: { position?: number }) {
    return this.store.setProductFeatured(id, true, dto.position ?? 0, adminMeta(req).adminId);
  }

  @Post("products/:id/unfeature")
  @AdminPermission("store.manage")
  async unfeatureProduct(@Param("id", ParseIntPipe) id: number, @Req() req: AdminRequest) {
    return this.store.setProductFeatured(id, false, 0, adminMeta(req).adminId);
  }

  @Post("inquiries/:id/status")
  @AdminPermission("store.manage")
  async setInquiryStatus(@Param("id", ParseIntPipe) id: number, @Req() req: AdminRequest, @Body() dto: AdminInquiryStatusDto) {
    return this.store.setInquiryStatus(id, dto.status, adminMeta(req).adminId);
  }
}
