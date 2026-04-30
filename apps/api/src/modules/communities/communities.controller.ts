import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, Req, UseGuards } from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard, JwtPayload } from "../auth/guards/jwt-auth.guard";
import { CommunitiesService } from "./communities.service";

interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

@Controller("communities")
export class CommunitiesController {
  constructor(private readonly service: CommunitiesService) {}

  @Get()
  index() {
    return this.service.index();
  }

  @Get("recommended")
  @UseGuards(JwtAuthGuard)
  recommended(@Req() request: AuthenticatedRequest) {
    return this.service.recommendedForUser(request.user.sub);
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Get(":id/posts")
  communityPosts(
    @Param("id", ParseIntPipe) id: number,
    @Query("cursor") cursor?: string,
    @Query("limit") limit?: string,
  ) {
    return this.service.communityPosts(id, cursor ? Number(cursor) : undefined, limit ? Number(limit) : undefined);
  }

  @Post(":id/join")
  @UseGuards(JwtAuthGuard)
  join(@Param("id", ParseIntPipe) id: number, @Req() request: AuthenticatedRequest) {
    return this.service.joinCommunity(id, request.user.sub);
  }

  @Post(":id/leave")
  @UseGuards(JwtAuthGuard)
  leave(@Param("id", ParseIntPipe) id: number, @Req() request: AuthenticatedRequest) {
    return this.service.leaveCommunity(id, request.user.sub);
  }

  @Post(":id/posts/:postId/hide")
  @UseGuards(JwtAuthGuard)
  hidePost(
    @Param("id", ParseIntPipe) id: number,
    @Param("postId", ParseIntPipe) postId: number,
    @Body() body: { reason?: string },
    @Req() request: AuthenticatedRequest,
  ) {
    return this.service.hidePost(id, postId, request.user.sub, body.reason);
  }
}
