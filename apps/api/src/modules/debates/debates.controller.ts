import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, Req, UseGuards } from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard, JwtPayload } from "../auth/guards/jwt-auth.guard";
import { CreateDebateDto } from "./dto/create-debate.dto";
import { CreateDebateResponseDto } from "./dto/create-debate-response.dto";
import { ListDebatesQueryDto } from "./dto/list-debates-query.dto";
import { DebatesService } from "./debates.service";

interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

@Controller("debates")
export class DebatesController {
  constructor(private readonly service: DebatesService) {}

  @Get()
  list(@Query() query: ListDebatesQueryDto) {
    return this.service.list(query);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateDebateDto, @Req() request: AuthenticatedRequest) {
    return this.service.create(dto, request.user.sub);
  }

  @Post(":id/responses")
  @UseGuards(JwtAuthGuard)
  respond(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: CreateDebateResponseDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.service.respond(id, dto, request.user.sub);
  }
}
