import { Controller, Get, Param, ParseIntPipe, Patch, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard, type JwtPayload } from "../auth/guards/jwt-auth.guard";
import { NotificationsService } from "./notifications.service";

interface AuthenticatedRequest {
  user?: JwtPayload;
}

@Controller("notifications")
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  list(@Req() request: AuthenticatedRequest) {
    return this.service.list(request.user!.sub);
  }

  @Get("unread")
  unread(@Req() request: AuthenticatedRequest) {
    return this.service.unread(request.user!.sub);
  }

  @Patch("read-all")
  readAll(@Req() request: AuthenticatedRequest) {
    return this.service.readAll(request.user!.sub);
  }

  @Patch(":id/read")
  read(@Param("id", ParseIntPipe) id: number, @Req() request: AuthenticatedRequest) {
    return this.service.read(id, request.user!.sub);
  }
}
