import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Request } from "express";
import { CreatePostDto } from "./dto/create-post.dto";
import { CreatePostCommentDto } from "./dto/create-post-comment.dto";
import { UpdatePostDto } from "./dto/update-post.dto";
import { JwtAuthGuard, JwtPayload } from "./jwt-auth.guard";
import { PostsService } from "./posts.service";
import { RateLimit } from "../core/rate-limit.decorator";
import { GetPostsQueryDto } from "./dto/get-posts-query.dto";
import { GetDiscoveryQueryDto } from "./dto/get-discovery-query.dto";

interface AuthenticatedRequest extends Request { user: JwtPayload }

@Controller("posts")
export class PostsController {
  constructor(private readonly service: PostsService, private readonly jwtService: JwtService) {}

  @Get()
  index(@Query() query: GetPostsQueryDto, @Req() request: Request) {
    return this.service.index(query, this.extractUserId(request));
  }

  @Get("discovery")
  discovery(@Query() query: GetDiscoveryQueryDto, @Req() request: Request) {
    return this.service.getDiscoveryFeed(query, this.extractUserId(request));
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number, @Req() request: Request) {
    return this.service.findOne(id, this.extractUserId(request));
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @RateLimit({ windowMs: 60_000, maxPerIp: 10, maxPerUser: 3, message: "Límite alcanzado para publicar. Espera 1 minuto e inténtalo de nuevo." })
  create(@Body() dto: CreatePostDto, @Req() request: AuthenticatedRequest) { return this.service.create(dto, request.user.sub); }

  @Get(":id/comments")
  getComments(@Param("id", ParseIntPipe) id: number) { return this.service.getComments(id); }

  @Post(":id/comments")
  @UseGuards(JwtAuthGuard)
  @RateLimit({ windowMs: 60_000, maxPerIp: 20, maxPerUser: 8, message: "Límite alcanzado para comentar. Espera 1 minuto e inténtalo de nuevo." })
  createComment(@Param("id", ParseIntPipe) id: number, @Body() dto: CreatePostCommentDto, @Req() request: AuthenticatedRequest) { return this.service.createComment(id, dto, request.user.sub); }

  @Patch(":id")
  @UseGuards(JwtAuthGuard)
  update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdatePostDto, @Req() request: AuthenticatedRequest) { return this.service.update(id, dto, request.user.sub); }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  remove(@Param("id", ParseIntPipe) id: number, @Req() request: AuthenticatedRequest) { return this.service.remove(id, request.user.sub, request.user.role); }

  private extractUserId(request: Request): number | undefined {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) return undefined;
    const token = authHeader.replace("Bearer ", "").trim();

    try {
      const payload = this.jwtService.verify<JwtPayload>(token);
      return payload.sub;
    } catch {
      return undefined;
    }
  }
}
