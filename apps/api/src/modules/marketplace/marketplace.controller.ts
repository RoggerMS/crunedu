import {
  Body,
  Controller,
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

interface AuthenticatedRequest extends Request {
  user: JwtPayload;
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
  ) {
    return this.service.listCatalog(categoryId ? Number(categoryId) : undefined, { faculty, career });
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
    @Body() body: unknown,
  ) {
    return this.service.createInquiry(request.user.sub, id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Post("admin/products")
  upsertProduct(@Req() request: AuthenticatedRequest, @Body() body: unknown) {
    return this.service.adminUpsertProduct(request.user, body);
  }

  @UseGuards(JwtAuthGuard)
  @Get("admin/inquiries")
  adminInquiries() {
    return this.service.adminListInquiries();
  }

  @UseGuards(JwtAuthGuard)
  @Get("admin/metrics")
  metrics() {
    return this.service.getConversionMetrics();
  }
}
