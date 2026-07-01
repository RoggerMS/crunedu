import { Controller, Get, Param, Post, Query, Res } from "@nestjs/common";
import { PromotionPlacement } from "@prisma/client";
import { Response } from "express";
import { AdminPromotionsService } from "./services/admin-promotions.service";

@Controller("promotions")
export class PromotionsPublicController {
  constructor(private readonly promotions: AdminPromotionsService) {}

  @Get("active")
  async active(@Query("placement") placement: PromotionPlacement) {
    return this.promotions.getActiveForPlacement(placement ?? PromotionPlacement.FEED_RIGHT_SIDEBAR);
  }

  @Post(":id/impression")
  async impression(@Param("id") idParam: string) {
    const id = Number(idParam);
    if (!Number.isInteger(id) || id <= 0) return { ok: false };
    return this.promotions.recordImpression(id);
  }

  @Post(":id/click")
  async click(@Param("id") idParam: string) {
    const id = Number(idParam);
    if (!Number.isInteger(id) || id <= 0) return { ok: false };
    return this.promotions.recordClick(id);
  }

  @Get("images/:filename")
  async serveImage(@Param("filename") filename: string, @Res({ passthrough: true }) response: Response) {
    const result = await this.promotions.serveImage(filename);
    response.setHeader("Content-Type", result.mimeType);
    response.setHeader("Cache-Control", "public, max-age=86400");
    return result.buffer;
  }
}
