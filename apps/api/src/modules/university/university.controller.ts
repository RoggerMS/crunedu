import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, Req, UseGuards } from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard, JwtPayload } from "../auth/guards/jwt-auth.guard";
import { UniversityService } from "./university.service";
import { CreateSuggestionDto } from "./dto/create-suggestion.dto";
import { UniversityQueryDto } from "./dto/university-query.dto";

interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

@Controller("universidad")
export class UniversityController {
  constructor(private readonly service: UniversityService) {}

  @Get()
  index(@Query() query: UniversityQueryDto) {
    return this.service.index(query);
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post("sugerir")
  @UseGuards(JwtAuthGuard)
  createSuggestion(@Body() dto: CreateSuggestionDto, @Req() request: AuthenticatedRequest) {
    return this.service.createSuggestion(dto, request.user.sub);
  }
}
