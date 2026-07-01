import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard, JwtPayload } from "../auth/guards/jwt-auth.guard";
import { OptionalJwtAuthGuard } from "../auth/guards/optional-jwt-auth.guard";
import { UpdateMeDto } from "./dto/update-me.dto";
import { UsersService } from "./users.service";
import { RateLimit } from "../core/rate-limit.decorator";

interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

@Controller()
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @Get("users/me")
  @UseGuards(JwtAuthGuard)
  getMe(@Req() request: AuthenticatedRequest) {
    return this.service.getMe(request.user!.sub);
  }

  @Patch("users/me")
  @UseGuards(JwtAuthGuard)
  updateMe(@Req() request: AuthenticatedRequest, @Body() dto: UpdateMeDto) {
    return this.service.updateMe(request.user!.sub, dto);
  }

  @Get("users/:id")
  @UseGuards(OptionalJwtAuthGuard)
  getUserProfile(@Param("id", ParseIntPipe) id: number, @Req() request: AuthenticatedRequest) {
    return this.service.getUserProfile(id, request.user?.sub);
  }

  @Post("follows/:userId")
  @UseGuards(JwtAuthGuard)
  @RateLimit({ windowMs: 60_000, maxPerIp: 20, maxPerUser: 12, message: "Estás siguiendo cuentas demasiado rápido. Espera 1 minuto." })
  follow(@Param("userId", ParseIntPipe) userId: number, @Req() request: AuthenticatedRequest) {
    return this.service.followUser(request.user!.sub, userId);
  }

  @Delete("follows/:userId")
  @UseGuards(JwtAuthGuard)
  unfollow(@Param("userId", ParseIntPipe) userId: number, @Req() request: AuthenticatedRequest) {
    return this.service.unfollowUser(request.user!.sub, userId);
  }

  @Get("users/:id/posts")
  @UseGuards(OptionalJwtAuthGuard)
  getUserPosts(@Param("id", ParseIntPipe) id: number, @Req() request: AuthenticatedRequest) {
    return this.service.getUserPosts(id, request.user?.sub);
  }

  @Get("users/:id/followers")
  @UseGuards(OptionalJwtAuthGuard)
  getFollowers(@Param("id", ParseIntPipe) id: number, @Req() request: AuthenticatedRequest) {
    return this.service.getFollowers(id, request.user?.sub);
  }

  @Get("users/:id/following")
  @UseGuards(OptionalJwtAuthGuard)
  getFollowing(@Param("id", ParseIntPipe) id: number, @Req() request: AuthenticatedRequest) {
    return this.service.getFollowing(id, request.user?.sub);
  }

  @Get("users/:id/friends")
  @UseGuards(OptionalJwtAuthGuard)
  getFriends(@Param("id", ParseIntPipe) id: number, @Req() request: AuthenticatedRequest) {
    return this.service.getFriends(id, request.user?.sub);
  }
}
