import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard, JwtPayload } from "../auth/guards/jwt-auth.guard";
import { CreateReportDto } from "./dto/create-report.dto";
import { ModerateReportDto } from "./dto/moderate-report.dto";
import { ReportsService } from "./reports.service";
import { DevSecurityService } from "../core/dev-security.service";

interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

@Controller("reports")
export class ReportsController {
  constructor(private readonly service: ReportsService, private readonly devSecurity: DevSecurityService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateReportDto, @Req() request: AuthenticatedRequest) {
    return this.service.create(dto, request.user.sub);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  index(
    @Req() request: AuthenticatedRequest,
    @Query("communityId") communityId?: string,
    @Query("severity") severity?: "high" | "medium" | "low",
  ) {
    this.devSecurity.assertAdmin(request.user.role, "Solo administradores pueden revisar reportes.");

    return this.service.index({ communityId: communityId ? Number(communityId) : undefined, severity });
  }

  @Patch(":id/moderate")
  @UseGuards(JwtAuthGuard)
  moderate(@Param("id", ParseIntPipe) id: number, @Req() request: AuthenticatedRequest, @Body() dto: ModerateReportDto) {
    this.devSecurity.assertAdmin(request.user.role, "Solo administradores pueden moderar contenido.");

    return this.service.moderate(id, request.user.sub, dto);
  }

  @Get("reputation/:userId")
  @UseGuards(JwtAuthGuard)
  reputation(@Param("userId", ParseIntPipe) userId: number, @Req() request: AuthenticatedRequest) {
    this.devSecurity.assertAdmin(request.user.role, "Solo administradores pueden revisar reputación.");
    return this.service.getUserReputation(userId);
  }
}
