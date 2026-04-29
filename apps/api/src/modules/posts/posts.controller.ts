import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Request } from "express";
import { CreatePostDto } from "./dto/create-post.dto";
import { CreatePostCommentDto } from "./dto/create-post-comment.dto";
import { UpdatePostDto } from "./dto/update-post.dto";
import { JwtAuthGuard, JwtPayload } from "./jwt-auth.guard";
import { PostsService } from "./posts.service";
import { GetPostsQueryDto } from "./dto/get-posts-query.dto";

interface AuthenticatedRequest extends Request { user: JwtPayload }

@Controller("posts")
export class PostsController {
  constructor(private readonly service: PostsService, private readonly jwtService: JwtService) {}

  @Get()
  index(@Query() query: GetPostsQueryDto, @Req() request: Request) {
    return this.service.index(query, this.extractUserId(request));
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number, @Req() request: Request) {
    return this.service.findOne(id, this.extractUserId(request));
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreatePostDto, @Req() request: AuthenticatedRequest) { return this.service.create(dto, request.user.sub); }

  @Get(":id/comments")
  getComments(@Param("id", ParseIntPipe) id: number) { return this.service.getComments(id); }

  @Post(":id/comments")
  @UseGuards(JwtAuthGuard)
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
