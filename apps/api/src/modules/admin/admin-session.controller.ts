import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AdminGuard } from "./guards/admin.guard";
import { AdminStepUpGuard } from "./guards/admin-step-up.guard";
import { AdminOnly } from "./decorators/admin-only.decorator";
import { RequireAdminStepUp } from "./decorators/require-admin-step-up.decorator";
import { AdminSessionService } from "./services/admin-session.service";
import { CreateAdminSessionDto } from "./dto/create-admin-session.dto";
import { AdminRequest, adminMeta } from "./types/admin-request";

@Controller("admin/session")
@UseGuards(JwtAuthGuard, AdminGuard, AdminStepUpGuard)
@AdminOnly()
export class AdminSessionController {
  constructor(private readonly sessions: AdminSessionService) {}

  @Post()
  async create(@Req() req: AdminRequest, @Body() dto: CreateAdminSessionDto) {
    const meta = adminMeta(req);
    return this.sessions.create(meta.adminId, dto.password, { ip: meta.ip, userAgent: meta.userAgent });
  }

  @Get()
  async list(@Req() req: AdminRequest) {
    return this.sessions.listActive(adminMeta(req).adminId);
  }

  @Delete("all")
  @RequireAdminStepUp()
  async revokeAll(@Req() req: AdminRequest) {
    const meta = adminMeta(req);
    return this.sessions.revokeAll(meta.adminId, { ip: meta.ip, userAgent: meta.userAgent });
  }

  @Delete(":id")
  async revoke(@Req() req: AdminRequest, @Param("id", ParseIntPipe) id: number) {
    const meta = adminMeta(req);
    return this.sessions.revoke(meta.adminId, id, { ip: meta.ip, userAgent: meta.userAgent });
  }
}
