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
  UnauthorizedException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { createReadStream } from "node:fs";
import { access } from "node:fs/promises";
import { Request, Response } from "express";
import { DocumentsService } from "./documents.service";
import { GetDocumentsQueryDto } from "./dto/get-documents-query.dto";
import { CreateDocumentDto } from "./dto/create-document.dto";
import { UpdateDocumentDto } from "./dto/update-document.dto";
import { RateDocumentDto } from "./dto/rate-document.dto";
import { JwtAuthGuard, JwtPayload } from "../auth/guards/jwt-auth.guard";
import { OptionalJwtAuthGuard } from "../auth/guards/optional-jwt-auth.guard";

interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

@Controller("apuntes")
export class DocumentsController {
  constructor(private readonly service: DocumentsService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  index(@Query() query: GetDocumentsQueryDto, @Req() request: AuthenticatedRequest) {
    return this.service.index(query, request.user?.sub, request.user?.role);
  }

  @Get("contributors")
  topContributors() {
    return this.service.topContributors();
  }

  @Post("files")
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor("file"))
  uploadFile(@UploadedFile() file: any, @Req() request: AuthenticatedRequest) {
    if (!request.user?.sub) throw new UnauthorizedException();
    return this.service.uploadFile(file);
  }

  @Get("files/:filename")
  async getFile(@Param("filename") filename: string, @Res({ passthrough: true }) response: Response): Promise<StreamableFile> {
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "");
    const filePath = `${process.cwd()}/tmp/uploads/documents/${safeName}`;
    await access(filePath);
    response.setHeader("Content-Type", this.contentTypeFor(safeName));
    response.setHeader("Content-Disposition", `inline; filename="${safeName}"`);
    return new StreamableFile(createReadStream(filePath));
  }

  @Get(":id")
  @UseGuards(OptionalJwtAuthGuard)
  findOne(@Param("id", ParseIntPipe) id: number, @Req() request: AuthenticatedRequest) {
    return this.service.findOne(id, request.user?.sub, request.user?.role);
  }

  @Get(":id/download")
  @UseGuards(OptionalJwtAuthGuard)
  async download(@Param("id", ParseIntPipe) id: number, @Req() request: AuthenticatedRequest, @Res({ passthrough: true }) response: Response) {
    const { filePath, originalName, mimeType } = await this.service.getDownload(id, request.user?.sub, request.user?.role);
    await access(filePath);
    const downloadName = (originalName || `apunte-${id}`).replace(/[^\p{L}\p{N}._-]/gu, "_");
    response.setHeader("Content-Type", mimeType || "application/octet-stream");
    response.setHeader("Content-Disposition", `attachment; filename="${downloadName}"`);
    return new StreamableFile(createReadStream(filePath));
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() body: CreateDocumentDto, @Req() request: AuthenticatedRequest) {
    if (!request.user?.sub) throw new UnauthorizedException("Inicia sesión para publicar apuntes.");
    return this.service.create(body, request.user.sub);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard)
  update(@Param("id", ParseIntPipe) id: number, @Body() body: UpdateDocumentDto, @Req() request: AuthenticatedRequest) {
    return this.service.update(id, body, request.user.sub, request.user.role);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  remove(@Param("id", ParseIntPipe) id: number, @Req() request: AuthenticatedRequest) {
    return this.service.remove(id, request.user.sub, request.user.role);
  }

  @Post(":id/save")
  @UseGuards(JwtAuthGuard)
  save(@Param("id", ParseIntPipe) id: number, @Req() request: AuthenticatedRequest) {
    return this.service.save(id, request.user.sub);
  }

  @Delete(":id/save")
  @UseGuards(JwtAuthGuard)
  unsave(@Param("id", ParseIntPipe) id: number, @Req() request: AuthenticatedRequest) {
    return this.service.unsave(id, request.user.sub);
  }

  @Post(":id/rating")
  @UseGuards(JwtAuthGuard)
  rate(@Param("id", ParseIntPipe) id: number, @Body() body: RateDocumentDto, @Req() request: AuthenticatedRequest) {
    return this.service.rate(id, body, request.user.sub);
  }

  private contentTypeFor(filename: string): string {
    const ext = filename.split(".").pop()?.toLowerCase() ?? "";
    if (ext === "png") return "image/png";
    if (ext === "webp") return "image/webp";
    if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
    if (ext === "pdf") return "application/pdf";
    if (ext === "doc" || ext === "docx") return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    if (ext === "ppt" || ext === "pptx") return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
    if (ext === "xls" || ext === "xlsx") return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    if (ext === "zip") return "application/zip";
    return "application/octet-stream";
  }
}
