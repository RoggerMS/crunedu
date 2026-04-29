import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard, JwtPayload } from "../posts/jwt-auth.guard";
import { CreateReportDto } from "./dto/create-report.dto";
import { ReportsService } from "./reports.service";

interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

@Controller("reports")
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateReportDto, @Req() request: AuthenticatedRequest) {
    return this.service.create(dto, request.user.sub);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  index(@Req() request: AuthenticatedRequest) {
    if (request.user.role !== "ADMIN") {
      throw new ForbiddenException("Solo administradores pueden revisar reportes.");
    }

    return this.service.index();
  }

  @Patch(":id/hide")
  @UseGuards(JwtAuthGuard)
  hide(@Param("id", ParseIntPipe) id: number, @Req() request: AuthenticatedRequest) {
    if (request.user.role !== "ADMIN") {
      throw new ForbiddenException("Solo administradores pueden moderar contenido.");
    }

    return this.service.hideTarget(id, request.user.sub);
  }

  @Patch(":id/restore")
  @UseGuards(JwtAuthGuard)
  restore(@Param("id", ParseIntPipe) id: number, @Req() request: AuthenticatedRequest) {
    if (request.user.role !== "ADMIN") {
      throw new ForbiddenException("Solo administradores pueden moderar contenido.");
    }

    return this.service.restoreTarget(id, request.user.sub);
  }
}
