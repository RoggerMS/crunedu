import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, Req, UseGuards } from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard, JwtPayload } from "../posts/jwt-auth.guard";
import { CreateAnswerDto } from "./dto/create-answer.dto";
import { CreateQuestionDto } from "./dto/create-question.dto";
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

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateQuestionDto, @Req() request: AuthenticatedRequest) {
    return this.service.create(dto, request.user.sub);
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
