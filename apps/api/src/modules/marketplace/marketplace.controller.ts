import {
  Body,
  Controller,
  BadRequestException,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard, JwtPayload } from "../posts/jwt-auth.guard";
import { MarketplaceService } from "./marketplace.service";
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
  constructor(private readonly service: MarketplaceService) {}

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
    if (request.user.role !== "ADMIN") {
      throw new ForbiddenException("Solo administradores pueden gestionar productos.");
    }
    return this.service.adminUpsertProduct(request.user, body);
  }

  @UseGuards(JwtAuthGuard)
  @Get("admin/inquiries")
  adminInquiries(@Query("cursor") cursor?: string, @Query("limit") limit?: string) {
    return this.service.adminListInquiries(cursor ? Number(cursor) : undefined, limit ? Number(limit) : undefined);
  }

  @UseGuards(JwtAuthGuard)
  @Get("admin/metrics")
  metrics() {
    return this.service.getConversionMetrics();
  }
}
