import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { Request } from "express";
import { CreatePostDto } from "./dto/create-post.dto";
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

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreatePostDto, @Req() request: AuthenticatedRequest) {
    return this.service.create(dto, request.user.sub);
  }
}
