import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { Request } from "express";
import { CreatePostDto } from "./dto/create-post.dto";
import { CreatePostCommentDto } from "./dto/create-post-comment.dto";
import { UpdatePostDto } from "./dto/update-post.dto";
import { JwtAuthGuard, JwtPayload } from "./jwt-auth.guard";
import { PostsService } from "./posts.service";

interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

@Controller("posts")
export class PostsController {
  constructor(private readonly service: PostsService) {}

  @Get()
  index() {
    return this.service.index();
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreatePostDto, @Req() request: AuthenticatedRequest) {
    return this.service.create(dto, request.user.sub);
  }

  @Get(":id/comments")
  getComments(@Param("id", ParseIntPipe) id: number) {
    return this.service.getComments(id);
  }

  @Post(":id/comments")
  @UseGuards(JwtAuthGuard)
  createComment(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: CreatePostCommentDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.service.createComment(id, dto, request.user.sub);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard)
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdatePostDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.service.update(id, dto, request.user.sub);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  remove(@Param("id", ParseIntPipe) id: number, @Req() request: AuthenticatedRequest) {
    return this.service.remove(id, request.user.sub, request.user.role);
  }
}
