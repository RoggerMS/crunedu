import {
  Body,
  Controller,
  BadRequestException,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard, JwtPayload } from "../auth/guards/jwt-auth.guard";
import { MarketplaceService } from "./marketplace.service";
import { DevSecurityService } from "../core/dev-security.service";
import { CreateProductInquiryDto, CreateProductDto, UpdateProductDto } from "./dtos";

interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

function parseOptionalPositiveInt(value: string | undefined, fieldName: string): number | undefined {
  if (!value) return undefined;

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new BadRequestException(`${fieldName} debe ser un número positivo.`);
  }

  return parsed;
}

@Controller("marketplace")
export class MarketplaceController {
  constructor(private readonly service: MarketplaceService, private readonly devSecurity: DevSecurityService) {}

  @Get("categories")
  categories() {
    return this.service.listCategories();
  }

  @Get("products")
  products(
    @Query("categoryId") categoryId?: string,
    @Query("faculty") faculty?: string,
    @Query("career") career?: string,
    @Query("cursor") cursor?: string,
    @Query("limit") limit?: string,
  ) {
    return this.service.listCatalog(
      parseOptionalPositiveInt(categoryId, "categoryId"),
      { faculty, career },
      parseOptionalPositiveInt(cursor, "cursor"),
      parseOptionalPositiveInt(limit, "limit"),
    );
  }

  @Get("products/:id")
  productDetail(@Param("id", ParseIntPipe) id: number) {
    return this.service.getProductDetail(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post("products/:id/inquiries")
  inquiry(
    @Param("id", ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest,
    @Body() body: CreateProductInquiryDto,
  ) {
    return this.service.createInquiry(request.user.sub, id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Post("admin/products")
  upsertProduct(@Req() request: AuthenticatedRequest, @Body() body: CreateProductDto | UpdateProductDto) {
    this.devSecurity.assertAdmin(request.user.role, "Solo administradores pueden gestionar productos.");
    return this.service.adminUpsertProduct(request.user, body);
  }

  @UseGuards(JwtAuthGuard)
  @Get("admin/inquiries")
  adminInquiries(@Req() request: AuthenticatedRequest, @Query("cursor") cursor?: string, @Query("limit") limit?: string) {
    this.devSecurity.assertAdmin(request.user.role, "Solo administradores pueden gestionar consultas.");
    return this.service.adminListInquiries(cursor ? Number(cursor) : undefined, limit ? Number(limit) : undefined);
  }

  @UseGuards(JwtAuthGuard)
  @Get("admin/products")
  adminProducts(@Req() request: AuthenticatedRequest) {
    this.devSecurity.assertAdmin(request.user.role, "Solo administradores pueden gestionar productos.");
    return this.service.adminListProducts();
  }

  @UseGuards(JwtAuthGuard)
  @Post("admin/inquiries/:id/status")
  adminUpdateInquiryStatus(
    @Req() request: AuthenticatedRequest,
    @Param("id", ParseIntPipe) id: number,
    @Body("status") status: string,
  ) {
    this.devSecurity.assertAdmin(request.user.role, "Solo administradores pueden gestionar consultas.");
    return this.service.adminUpdateInquiryStatus(id, status);
  }

  @UseGuards(JwtAuthGuard)
  @Get("admin/metrics")
  metrics(@Req() request: AuthenticatedRequest) {
    this.devSecurity.assertAdmin(request.user.role, "Solo administradores pueden ver métricas.");
    return this.service.getConversionMetrics();
  }
}
