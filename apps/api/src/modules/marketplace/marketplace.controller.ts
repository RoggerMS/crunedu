import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  Res,
  StreamableFile,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor, FilesInterceptor } from "@nestjs/platform-express";
import { Request, Response } from "express";
import { createReadStream } from "node:fs";
import { access } from "node:fs/promises";
import { JwtAuthGuard, JwtPayload } from "../auth/guards/jwt-auth.guard";
import { OptionalJwtAuthGuard } from "../auth/guards/optional-jwt-auth.guard";
import { DevSecurityService } from "../core/dev-security.service";
import { RateLimit } from "../core/rate-limit.decorator";
import { MarketplaceService } from "./marketplace.service";
import {
  CreateProductDto,
  UpdateProductDto,
  CreateProductInquiryDto,
  CreateProductReportDto,
  GetCatalogQueryDto,
} from "./dtos";

interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

@Controller("marketplace")
export class MarketplaceController {
  constructor(
    private readonly service: MarketplaceService,
    private readonly devSecurity: DevSecurityService,
  ) {}

  // --- Public catalog ---
  @Get("categories")
  categories() {
    return this.service.listCategories();
  }

  @Get("safe-points")
  safePoints() {
    return this.service.listSafePoints();
  }

  @Get("products")
  @UseGuards(OptionalJwtAuthGuard)
  catalog(@Query() query: GetCatalogQueryDto, @Req() request: AuthenticatedRequest) {
    return this.service.listCatalog(query, request.user?.sub);
  }

  @Get("products/:id")
  @UseGuards(OptionalJwtAuthGuard)
  productDetail(
    @Param("id", ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.service.getProductDetail(id, request.user?.sub, request.user?.role);
  }

  // --- Product CRUD (authenticated) ---
  @Post("products")
  @UseGuards(JwtAuthGuard)
  @RateLimit({ windowMs: 60_000, maxPerIp: 10, maxPerUser: 5, message: "Límite de publicaciones. Espera un minuto." })
  createProduct(@Body() body: CreateProductDto, @Req() request: AuthenticatedRequest) {
    return this.service.createProduct(body, request.user.sub);
  }

  @Patch("products/:id")
  @UseGuards(JwtAuthGuard)
  updateProduct(
    @Param("id", ParseIntPipe) id: number,
    @Body() body: UpdateProductDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.service.updateProduct(id, body, request.user.sub, request.user.role);
  }

  @Delete("products/:id")
  @UseGuards(JwtAuthGuard)
  deleteProduct(
    @Param("id", ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.service.softDeleteProduct(id, request.user.sub, request.user.role);
  }

  @Post("products/:id/publish")
  @UseGuards(JwtAuthGuard)
  publishProduct(
    @Param("id", ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.service.publishProduct(id, request.user.sub, request.user.role);
  }

  @Post("products/:id/pause")
  @UseGuards(JwtAuthGuard)
  pauseProduct(
    @Param("id", ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.service.pauseProduct(id, request.user.sub, request.user.role);
  }

  @Post("products/:id/mark-sold")
  @UseGuards(JwtAuthGuard)
  markSold(
    @Param("id", ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.service.markSold(id, request.user.sub, request.user.role);
  }

  // --- Images ---
  @Post("products/images")
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor("image"))
  uploadImage(@UploadedFile() file: any, @Req() request: AuthenticatedRequest) {
    return this.service.uploadImage(file);
  }

  @Post("products/:id/images")
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor("images", 6))
  addProductImages(
    @Param("id", ParseIntPipe) id: number,
    @UploadedFiles() files: any[],
    @Req() request: AuthenticatedRequest,
  ) {
    return this.service.addProductImages(id, files ?? [], request.user.sub);
  }

  @Patch("products/:id/images/order")
  @UseGuards(JwtAuthGuard)
  reorderImages(
    @Param("id", ParseIntPipe) id: number,
    @Body("imageIds") imageIds: number[],
    @Req() request: AuthenticatedRequest,
  ) {
    return this.service.reorderProductImages(id, imageIds, request.user.sub);
  }

  @Delete("products/:id/images/:imageId")
  @UseGuards(JwtAuthGuard)
  deleteImage(
    @Param("id", ParseIntPipe) id: number,
    @Param("imageId", ParseIntPipe) imageId: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.service.deleteProductImage(id, imageId, request.user.sub);
  }

  @Post("products/:id/images/:imageId/cover")
  @UseGuards(JwtAuthGuard)
  setCoverImage(
    @Param("id", ParseIntPipe) id: number,
    @Param("imageId", ParseIntPipe) imageId: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.service.setCoverImage(id, imageId, request.user.sub);
  }

  @Get("products/images/:filename")
  async getImage(@Param("filename") filename: string, @Res({ passthrough: true }) response: Response): Promise<StreamableFile> {
    const filePath = `${process.cwd()}/tmp/uploads/products/${filename}`;
    await access(filePath);
    if (filename.endsWith(".png")) response.setHeader("Content-Type", "image/png");
    else if (filename.endsWith(".webp")) response.setHeader("Content-Type", "image/webp");
    else response.setHeader("Content-Type", "image/jpeg");
    return new StreamableFile(createReadStream(filePath));
  }

  // --- Favorites ---
  @Post("products/:id/favorite")
  @UseGuards(JwtAuthGuard)
  toggleFavorite(
    @Param("id", ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.service.toggleFavorite(id, request.user.sub);
  }

  // --- Reports ---
  @Post("products/:id/reports")
  @UseGuards(JwtAuthGuard)
  @RateLimit({ windowMs: 180_000, maxPerIp: 10, maxPerUser: 5, message: "Límite de reportes. Espera 3 minutos." })
  reportProduct(
    @Param("id", ParseIntPipe) id: number,
    @Body() body: CreateProductReportDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.service.createReport(id, body, request.user.sub);
  }

  // --- Inquiries ---
  @Post("products/:id/inquiries")
  @UseGuards(JwtAuthGuard)
  @RateLimit({ windowMs: 60_000, maxPerIp: 15, maxPerUser: 8, message: "Límite de consultas. Espera un minuto." })
  createInquiry(
    @Param("id", ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest,
    @Body() body: CreateProductInquiryDto,
  ) {
    return this.service.createInquiry(id, request.user.sub, body);
  }

  // --- Personal panel (me) ---
  @Get("me/listings")
  @UseGuards(JwtAuthGuard)
  myListings(@Req() request: AuthenticatedRequest) {
    return this.service.listMyListings(request.user.sub);
  }

  @Get("me/favorites")
  @UseGuards(JwtAuthGuard)
  myFavorites(@Req() request: AuthenticatedRequest) {
    return this.service.listMyFavorites(request.user.sub);
  }

  @Get("me/inquiries")
  @UseGuards(JwtAuthGuard)
  myInquiries(@Req() request: AuthenticatedRequest) {
    return this.service.listMyInquiries(request.user.sub);
  }

  @Get("me/statistics")
  @UseGuards(JwtAuthGuard)
  myStatistics(@Req() request: AuthenticatedRequest) {
    return this.service.getMyStatistics(request.user.sub);
  }

  // --- Admin ---
  @Get("admin/products")
  @UseGuards(JwtAuthGuard)
  adminProducts(@Req() request: AuthenticatedRequest) {
    this.devSecurity.assertAdmin(request.user.role, "Solo administradores pueden gestionar productos.");
    return this.service.adminListProducts();
  }

  @Post("admin/products")
  @UseGuards(JwtAuthGuard)
  adminUpsertProduct(
    @Req() request: AuthenticatedRequest,
    @Body() body: CreateProductDto | UpdateProductDto,
  ) {
    this.devSecurity.assertAdmin(request.user.role, "Solo administradores pueden gestionar productos.");
    return this.service.adminUpsertProduct(request.user, body);
  }

  @Patch("admin/products/:id/status")
  @UseGuards(JwtAuthGuard)
  adminUpdateProductStatus(
    @Req() request: AuthenticatedRequest,
    @Param("id", ParseIntPipe) id: number,
    @Body("status") status: string,
  ) {
    this.devSecurity.assertAdmin(request.user.role, "Solo administradores pueden gestionar productos.");
    return this.service.adminUpdateProductStatus(id, status);
  }

  @Get("admin/inquiries")
  @UseGuards(JwtAuthGuard)
  adminInquiries(
    @Req() request: AuthenticatedRequest,
    @Query("cursor") cursor?: string,
    @Query("limit") limit?: string,
  ) {
    this.devSecurity.assertAdmin(request.user.role, "Solo administradores pueden gestionar consultas.");
    return this.service.adminListInquiries(cursor ? Number(cursor) : undefined, limit ? Number(limit) : undefined);
  }

  @Post("admin/inquiries/:id/status")
  @UseGuards(JwtAuthGuard)
  adminUpdateInquiryStatus(
    @Req() request: AuthenticatedRequest,
    @Param("id", ParseIntPipe) id: number,
    @Body("status") status: string,
  ) {
    this.devSecurity.assertAdmin(request.user.role, "Solo administradores pueden gestionar consultas.");
    return this.service.adminUpdateInquiryStatus(id, status);
  }

  @Get("admin/reports")
  @UseGuards(JwtAuthGuard)
  adminReports(
    @Req() request: AuthenticatedRequest,
    @Query("cursor") cursor?: string,
    @Query("limit") limit?: string,
  ) {
    this.devSecurity.assertAdmin(request.user.role, "Solo administradores pueden ver reportes.");
    return this.service.adminListReports(cursor ? Number(cursor) : undefined, limit ? Number(limit) : undefined);
  }

  @Get("admin/metrics")
  @UseGuards(JwtAuthGuard)
  metrics(@Req() request: AuthenticatedRequest) {
    this.devSecurity.assertAdmin(request.user.role, "Solo administradores pueden ver métricas.");
    return this.service.getConversionMetrics();
  }
}
