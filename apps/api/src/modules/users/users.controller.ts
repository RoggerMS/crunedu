import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard, JwtPayload } from "../posts/jwt-auth.guard";
import { UpdateMeDto } from "./dto/update-me.dto";
import { UsersService } from "./users.service";

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
  getUserProfile(@Param("id", ParseIntPipe) id: number, @Req() request: AuthenticatedRequest) {
    return this.service.getUserProfile(id, request.user?.sub);
  }

  @Post("follows/:userId")
  @UseGuards(JwtAuthGuard)
  follow(@Param("userId", ParseIntPipe) userId: number, @Req() request: AuthenticatedRequest) {
    return this.service.followUser(request.user!.sub, userId);
  }

  @Delete("follows/:userId")
  @UseGuards(JwtAuthGuard)
  unfollow(@Param("userId", ParseIntPipe) userId: number, @Req() request: AuthenticatedRequest) {
    return this.service.unfollowUser(request.user!.sub, userId);
  }

  @Get("users/:id/followers")
  getFollowers(@Param("id", ParseIntPipe) id: number, @Req() request: AuthenticatedRequest) {
    return this.service.getFollowers(id, request.user?.sub);
  }

  @Get("users/:id/following")
  getFollowing(@Param("id", ParseIntPipe) id: number, @Req() request: AuthenticatedRequest) {
    return this.service.getFollowing(id, request.user?.sub);
  }
}
