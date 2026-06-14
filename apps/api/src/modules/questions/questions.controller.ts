import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, Req, Res, StreamableFile, UnauthorizedException, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { createReadStream } from "node:fs";
import { access } from "node:fs/promises";
import { Request, Response } from "express";
import { JwtAuthGuard, JwtPayload } from "../auth/guards/jwt-auth.guard";
import { CreateAnswerDto } from "./dto/create-answer.dto";
import { CreateQuestionDto } from "./dto/create-question.dto";
import { VoteAnswerDto } from "./dto/vote-answer.dto";
import { GetQuestionsQueryDto } from "./dto/get-questions-query.dto";
import { QuestionsService } from "./questions.service";

interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

@Controller("questions")
export class QuestionsController {
  constructor(private readonly service: QuestionsService) {}

  @Get()
  index(@Query() query: GetQuestionsQueryDto) {
    return this.service.index(query);
  }

  @Post("images")
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor("image"))
  uploadImage(@UploadedFile() file: any, @Req() request: AuthenticatedRequest) {
    if (!request.user?.sub) throw new UnauthorizedException();
    return this.service.uploadImage(file);
  }

  @Post("answers/images")
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor("image"))
  uploadAnswerImage(@UploadedFile() file: any, @Req() request: AuthenticatedRequest) {
    if (!request.user?.sub) throw new UnauthorizedException();
    return this.service.uploadAnswerImage(file);
  }

  @Get("answers/images/:filename")
  async getAnswerImage(@Param("filename") filename: string, @Res({ passthrough: true }) response: Response): Promise<StreamableFile> {
    const filePath = `${process.cwd()}/tmp/uploads/answers/${filename}`;
    await access(filePath);
    if (filename.endsWith(".png")) response.setHeader("Content-Type", "image/png");
    else if (filename.endsWith(".webp")) response.setHeader("Content-Type", "image/webp");
    else response.setHeader("Content-Type", "image/jpeg");
    return new StreamableFile(createReadStream(filePath));
  }

  @Get("images/:filename")
  async getImage(@Param("filename") filename: string, @Res({ passthrough: true }) response: Response): Promise<StreamableFile> {
    const filePath = `${process.cwd()}/tmp/uploads/questions/${filename}`;
    await access(filePath);
    if (filename.endsWith(".png")) response.setHeader("Content-Type", "image/png");
    else if (filename.endsWith(".webp")) response.setHeader("Content-Type", "image/webp");
    else response.setHeader("Content-Type", "image/jpeg");
    return new StreamableFile(createReadStream(filePath));
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateQuestionDto, @Req() request: AuthenticatedRequest) {
    return this.service.create(dto, request.user.sub);
  }

  @Patch(":id/answers/:answerId/useful")
  @UseGuards(JwtAuthGuard)
  markAnswerUseful(
    @Param("id", ParseIntPipe) id: number,
    @Param("answerId", ParseIntPipe) answerId: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.service.markAnswerUseful(id, answerId, request.user.sub, request.user.role);
  }

  @Post(":id/answers/:answerId/vote")
  @UseGuards(JwtAuthGuard)
  voteAnswer(
    @Param("id", ParseIntPipe) id: number,
    @Param("answerId", ParseIntPipe) answerId: number,
    @Body() dto: VoteAnswerDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.service.voteAnswer(id, answerId, dto.value, request.user.sub);
  }

  @Post(":id/answers")
  @UseGuards(JwtAuthGuard)
  createAnswer(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: CreateAnswerDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.service.createAnswer(id, dto, request.user.sub);
  }
}
