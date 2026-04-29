import { Body, Controller, Get, Patch, Req, UseGuards } from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard, JwtPayload } from "../posts/jwt-auth.guard";
import { UpdateMeDto } from "./dto/update-me.dto";
import { UsersService } from "./users.service";

interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

@Controller("users")
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @Get("me")
  @UseGuards(JwtAuthGuard)
  getMe(@Req() request: AuthenticatedRequest) {
    return this.service.getMe(request.user.sub);
  }

  @Patch("me")
  @UseGuards(JwtAuthGuard)
  updateMe(@Req() request: AuthenticatedRequest, @Body() dto: UpdateMeDto) {
    return this.service.updateMe(request.user.sub, dto);
  }
}
