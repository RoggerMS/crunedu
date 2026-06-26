import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Request, Response } from "express";
import { JwtAuthGuard, JwtPayload } from "../auth/guards/jwt-auth.guard";
import { OptionalJwtAuthGuard } from "../auth/guards/optional-jwt-auth.guard";
import { RateLimit } from "../core/rate-limit.decorator";
import { MomentsService } from "./moments.service";
import { CreateMomentDto, UpdateMomentDto, GetMomentsQueryDto, GetGalleryQueryDto, GetSavedMomentsQueryDto, GetTrendsQueryDto } from "./dto";
import { CreateMomentCommentDto } from "./dto/create-moment-comment.dto";

interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

@Controller("moments")
export class MomentsController {
  constructor(private readonly service: MomentsService) {}

  // --- Static routes first (before :id) ---
  @Get("news")
  @UseGuards(OptionalJwtAuthGuard)
  news(@Req() request: AuthenticatedRequest) {
    return this.service.getNews(request.user?.sub);
  }

  @Get("gallery")
  @UseGuards(OptionalJwtAuthGuard)
  gallery(@Query() query: GetGalleryQueryDto, @Req() request: AuthenticatedRequest) {
    return this.service.getGallery(query, request.user?.sub);
  }

  @Get("saved")
  @UseGuards(JwtAuthGuard)
  saved(@Query() query: GetSavedMomentsQueryDto, @Req() request: AuthenticatedRequest) {
    return this.service.getSaved(query, request.user!.sub);
  }

  @Get("trends")
  trends(@Query() query: GetTrendsQueryDto) {
    return this.service.getTrends(query);
  }

  @Get("topics")
  topics() {
    return this.service.getTopics();
  }

  @Post("media")
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor("file"))
  @RateLimit({ windowMs: 60_000, maxPerIp: 15, maxPerUser: 10, message: "Límite de subidas alcanzado. Espera un minuto." })
  uploadMedia(@UploadedFile() file: unknown, @Req() request: AuthenticatedRequest) {
    return this.service.uploadMedia(file, request.user!.sub);
  }

  @Get("media/:filename")
  async serveMedia(@Param("filename") filename: string, @Res({ passthrough: true }) response: Response): Promise<StreamableFile> {
    const { stream, mimeType } = await this.service.serveMedia(filename);
    response.setHeader("Content-Type", mimeType);
    response.setHeader("Cache-Control", "public, max-age=3600");
    return new StreamableFile(stream);
  }

  // --- List & detail ---
  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  list(@Query() query: GetMomentsQueryDto, @Req() request: AuthenticatedRequest) {
    return this.service.list(query, request.user?.sub);
  }

  @Get(":id")
  @UseGuards(OptionalJwtAuthGuard)
  findOne(@Param("id", ParseIntPipe) id: number, @Req() request: AuthenticatedRequest) {
    return this.service.findOne(id, request.user?.sub);
  }

  // --- Create / update / delete ---
  @Post()
  @UseGuards(JwtAuthGuard)
  @RateLimit({ windowMs: 60_000, maxPerIp: 10, maxPerUser: 5, message: "Límite alcanzado para publicar. Espera 1 minuto." })
  create(@Body() dto: CreateMomentDto, @Req() request: AuthenticatedRequest) {
    return this.service.create(dto, request.user!.sub);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard)
  update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateMomentDto, @Req() request: AuthenticatedRequest) {
    return this.service.update(id, dto, request.user!.sub, request.user!.role);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  remove(@Param("id", ParseIntPipe) id: number, @Req() request: AuthenticatedRequest) {
    return this.service.remove(id, request.user!.sub, request.user!.role);
  }

  // --- Interactions ---
  @Post(":id/boost")
  @UseGuards(JwtAuthGuard)
  @RateLimit({ windowMs: 60_000, maxPerIp: 30, maxPerUser: 20, message: "Demasiadas acciones. Espera un minuto." })
  boost(@Param("id", ParseIntPipe) id: number, @Req() request: AuthenticatedRequest) {
    return this.service.boost(id, request.user!.sub);
  }

  @Delete(":id/boost")
  @UseGuards(JwtAuthGuard)
  removeBoost(@Param("id", ParseIntPipe) id: number, @Req() request: AuthenticatedRequest) {
    return this.service.unboost(id, request.user!.sub);
  }

  @Post(":id/confirm")
  @UseGuards(JwtAuthGuard)
  @RateLimit({ windowMs: 60_000, maxPerIp: 30, maxPerUser: 20, message: "Demasiadas acciones. Espera un minuto." })
  confirm(@Param("id", ParseIntPipe) id: number, @Req() request: AuthenticatedRequest) {
    return this.service.confirm(id, request.user!.sub);
  }

  @Delete(":id/confirm")
  @UseGuards(JwtAuthGuard)
  removeConfirm(@Param("id", ParseIntPipe) id: number, @Req() request: AuthenticatedRequest) {
    return this.service.unconfirm(id, request.user!.sub);
  }

  @Post(":id/save")
  @UseGuards(JwtAuthGuard)
  save(@Param("id", ParseIntPipe) id: number, @Req() request: AuthenticatedRequest) {
    return this.service.save(id, request.user!.sub);
  }

  @Delete(":id/save")
  @UseGuards(JwtAuthGuard)
  unsave(@Param("id", ParseIntPipe) id: number, @Req() request: AuthenticatedRequest) {
    return this.service.unsave(id, request.user!.sub);
  }

  @Post(":id/share")
  share(@Param("id", ParseIntPipe) id: number) {
    return this.service.share(id);
  }

  // --- Comments ---
  @Get(":id/comments")
  @UseGuards(OptionalJwtAuthGuard)
  getComments(@Param("id", ParseIntPipe) id: number, @Req() request: AuthenticatedRequest) {
    return this.service.getComments(id, request.user?.sub);
  }

  @Post(":id/comments")
  @UseGuards(JwtAuthGuard)
  @RateLimit({ windowMs: 60_000, maxPerIp: 20, maxPerUser: 8, message: "Límite alcanzado para comentar. Espera 1 minuto." })
  createComment(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: CreateMomentCommentDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.service.createComment(id, dto, request.user!.sub);
  }

  @Delete(":id/comments/:commentId")
  @UseGuards(JwtAuthGuard)
  deleteComment(
    @Param("id", ParseIntPipe) id: number,
    @Param("commentId", ParseIntPipe) commentId: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.service.deleteComment(id, commentId, request.user!.sub, request.user!.role);
  }
}
