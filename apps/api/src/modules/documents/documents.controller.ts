import { Body, Controller, Get, Post, Query, Req, UseGuards } from "@nestjs/common";
import { DocumentsService } from "./documents.service";
import { GetDocumentsQueryDto } from "./dto/get-documents-query.dto";
import { CreateDocumentDto } from "./dto/create-document.dto";
import { JwtAuthGuard, JwtPayload } from "../auth/guards/jwt-auth.guard";
import { OptionalJwtAuthGuard } from "../auth/guards/optional-jwt-auth.guard";
import { Request } from "express";

interface AuthenticatedRequest extends Request { user?: JwtPayload }

@Controller("apuntes")
export class DocumentsController {
  constructor(private readonly service: DocumentsService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  index(@Query() query: GetDocumentsQueryDto) {
    return this.service.index(query);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() body: CreateDocumentDto, @Req() request: AuthenticatedRequest) {
    return this.service.create(body, request.user?.sub);
  }
}
