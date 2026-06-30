import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
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
import { createReadStream } from "node:fs";
import { JwtAuthGuard, JwtPayload } from "../auth/guards/jwt-auth.guard";
import { OptionalJwtAuthGuard } from "../auth/guards/optional-jwt-auth.guard";
import { RateLimit } from "../core/rate-limit.decorator";
import { ConversationsService } from "./conversations.service";
import {
  CreateConversationDto,
  UpdateConversationDto,
  GetConversationsQueryDto,
  CreateSharedLinkDto,
  CreateMaterialDto,
  CreateArgumentDto,
  UpdateArgumentDto,
  CreateInviteDto,
  CompanionProfileDto,
  GetCompanionsQueryDto,
  GetRecordingsQueryDto,
  UpdateParticipantRoleDto,
  BanDto,
} from "./dto";

interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

@Controller()
export class ConversationsController {
  constructor(private readonly service: ConversationsService) {}

  // ============ COMPANIONS (separate prefix, no :id conflict) ============
  @Get("conversation-companions")
  @UseGuards(OptionalJwtAuthGuard)
  listCompanions(@Query() query: GetCompanionsQueryDto, @Req() req: AuthenticatedRequest) {
    return this.service.listCompanions(query, req.user?.sub);
  }

  @Get("conversation-companions/me")
  @UseGuards(JwtAuthGuard)
  getMyCompanion(@Req() req: AuthenticatedRequest) {
    return this.service.getMyCompanionProfile(req.user!.sub);
  }

  @Put("conversation-companions/me")
  @UseGuards(JwtAuthGuard)
  @RateLimit({ windowMs: 60_000, maxPerIp: 20, maxPerUser: 10, message: "Demasiadas actualizaciones. Espera un minuto." })
  upsertMyCompanion(@Body() dto: CompanionProfileDto, @Req() req: AuthenticatedRequest) {
    return this.service.upsertMyCompanionProfile(dto, req.user!.sub);
  }

  @Delete("conversation-companions/me")
  @UseGuards(JwtAuthGuard)
  deleteMyCompanion(@Req() req: AuthenticatedRequest) {
    return this.service.deleteMyCompanionProfile(req.user!.sub);
  }

  // ============ RECORDINGS LIST (static) ============
  @Get("conversations/recordings")
  @UseGuards(OptionalJwtAuthGuard)
  listRecordings(@Query() query: GetRecordingsQueryDto, @Req() req: AuthenticatedRequest) {
    return this.service.listRecordings(query, req.user?.sub, req.user?.role);
  }

  @Get("conversations/recordings/:id")
  @UseGuards(OptionalJwtAuthGuard)
  getRecording(@Param("id", ParseIntPipe) id: number, @Req() req: AuthenticatedRequest) {
    return this.service.getRecording(id, req.user?.sub, req.user?.role);
  }

  @Post("conversations/recordings/:id/play")
  @UseGuards(OptionalJwtAuthGuard)
  @RateLimit({ windowMs: 10_000, maxPerIp: 3, message: "Demasiadas solicitudes de reproducción." })
  playRecording(@Param("id", ParseIntPipe) id: number, @Req() req: AuthenticatedRequest) {
    return this.service.playRecording(id, req.user?.sub, req.user?.role);
  }

  @Delete("conversations/recordings/:id")
  @UseGuards(JwtAuthGuard)
  deleteRecording(@Param("id", ParseIntPipe) id: number, @Req() req: AuthenticatedRequest) {
    return this.service.deleteRecording(id, req.user!.sub, req.user!.role);
  }

  // ============ MEDIA SERVING (static) ============
  @Get("conversations/media/:filename")
  async serveMedia(
    @Param("filename") filename: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const { filePath, mimeType, originalName } = await this.service.serveMaterial(filename);
    response.set({
      "Content-Type": mimeType,
      "Content-Disposition": `inline; filename="${originalName}"`,
      "Cache-Control": "private, max-age=3600",
    });
    return new StreamableFile(createReadStream(filePath));
  }

  // ============ STATIC LIST ROUTES ============
  @Get("conversations")
  @UseGuards(OptionalJwtAuthGuard)
  index(@Query() query: GetConversationsQueryDto, @Req() req: AuthenticatedRequest) {
    return this.service.index(query, req.user?.sub, req.user?.role);
  }

  @Get("conversations/live")
  @UseGuards(OptionalJwtAuthGuard)
  live(@Req() req: AuthenticatedRequest) {
    return this.service.getLive(req.user?.sub, req.user?.role);
  }

  @Get("conversations/waiting")
  @UseGuards(OptionalJwtAuthGuard)
  waiting(@Req() req: AuthenticatedRequest) {
    return this.service.getWaiting(req.user?.sub, req.user?.role);
  }

  @Get("conversations/debates")
  @UseGuards(OptionalJwtAuthGuard)
  debates(@Req() req: AuthenticatedRequest) {
    return this.service.getDebates(req.user?.sub, req.user?.role);
  }

  // ============ CREATE ============
  @Post("conversations")
  @UseGuards(JwtAuthGuard)
  @RateLimit({ windowMs: 60_000, maxPerIp: 10, maxPerUser: 5, message: "Estás creando conversaciones demasiado rápido." })
  create(@Body() dto: CreateConversationDto, @Req() req: AuthenticatedRequest) {
    return this.service.create(dto, req.user!.sub);
  }

  @Post("conversations/drafts")
  @UseGuards(JwtAuthGuard)
  createDraft(@Body() dto: Partial<CreateConversationDto>, @Req() req: AuthenticatedRequest) {
    return this.service.createDraft(dto, req.user!.sub);
  }

  // ============ DYNAMIC :id ROUTES ============
  @Get("conversations/:id")
  @UseGuards(OptionalJwtAuthGuard)
  detail(
    @Param("id", ParseIntPipe) id: number,
    @Query("inviteToken") inviteToken: string | undefined,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.detail(id, req.user?.sub, req.user?.role, inviteToken);
  }

  @Patch("conversations/:id")
  @UseGuards(JwtAuthGuard)
  update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateConversationDto, @Req() req: AuthenticatedRequest) {
    return this.service.update(id, dto, req.user!.sub, req.user!.role);
  }

  @Delete("conversations/:id")
  @UseGuards(JwtAuthGuard)
  remove(@Param("id", ParseIntPipe) id: number, @Req() req: AuthenticatedRequest) {
    return this.service.remove(id, req.user!.sub, req.user!.role);
  }

  // --- DRAFTS ---
  @Patch("conversations/drafts/:id")
  @UseGuards(JwtAuthGuard)
  updateDraft(@Param("id", ParseIntPipe) id: number, @Body() dto: Partial<UpdateConversationDto>, @Req() req: AuthenticatedRequest) {
    return this.service.updateDraft(id, dto, req.user!.sub);
  }

  @Post("conversations/drafts/:id/publish")
  @UseGuards(JwtAuthGuard)
  publishDraft(@Param("id", ParseIntPipe) id: number, @Req() req: AuthenticatedRequest) {
    return this.service.publishDraft(id, req.user!.sub);
  }

  // --- LIFECYCLE ---
  @Post("conversations/:id/start")
  @UseGuards(JwtAuthGuard)
  start(@Param("id", ParseIntPipe) id: number, @Req() req: AuthenticatedRequest) {
    return this.service.start(id, req.user!.sub, req.user!.role);
  }

  @Post("conversations/:id/end")
  @UseGuards(JwtAuthGuard)
  end(@Param("id", ParseIntPipe) id: number, @Req() req: AuthenticatedRequest) {
    return this.service.end(id, req.user!.sub, req.user!.role);
  }

  @Post("conversations/:id/cancel")
  @UseGuards(JwtAuthGuard)
  cancel(@Param("id", ParseIntPipe) id: number, @Req() req: AuthenticatedRequest) {
    return this.service.cancel(id, req.user!.sub, req.user!.role);
  }

  @Post("conversations/:id/join")
  @UseGuards(JwtAuthGuard)
  @RateLimit({ windowMs: 10_000, maxPerIp: 10, maxPerUser: 5, message: "Demasiados intentos de unión." })
  join(
    @Param("id", ParseIntPipe) id: number,
    @Body("inviteToken") inviteToken: string | undefined,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.join(id, req.user!.sub, req.user!.role, inviteToken);
  }

  @Post("conversations/:id/leave")
  @UseGuards(JwtAuthGuard)
  leave(@Param("id", ParseIntPipe) id: number, @Req() req: AuthenticatedRequest) {
    return this.service.leave(id, req.user!.sub);
  }

  // --- SPEAKER REQUESTS ---
  @Post("conversations/:id/speaker-requests")
  @UseGuards(JwtAuthGuard)
  createSpeakerRequest(@Param("id", ParseIntPipe) id: number, @Req() req: AuthenticatedRequest) {
    return this.service.createSpeakerRequest(id, req.user!.sub);
  }

  @Delete("conversations/:id/speaker-requests/me")
  @UseGuards(JwtAuthGuard)
  cancelSpeakerRequest(@Param("id", ParseIntPipe) id: number, @Req() req: AuthenticatedRequest) {
    return this.service.cancelSpeakerRequest(id, req.user!.sub);
  }

  @Get("conversations/:id/speaker-requests")
  @UseGuards(JwtAuthGuard)
  listSpeakerRequests(@Param("id", ParseIntPipe) id: number, @Req() req: AuthenticatedRequest) {
    return this.service.listSpeakerRequests(id, req.user!.sub);
  }

  @Post("conversations/:id/speaker-requests/:requestId/approve")
  @UseGuards(JwtAuthGuard)
  approveSpeakerRequest(
    @Param("id", ParseIntPipe) id: number,
    @Param("requestId", ParseIntPipe) requestId: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.resolveSpeakerRequest(id, requestId, true, req.user!.sub);
  }

  @Post("conversations/:id/speaker-requests/:requestId/reject")
  @UseGuards(JwtAuthGuard)
  rejectSpeakerRequest(
    @Param("id", ParseIntPipe) id: number,
    @Param("requestId", ParseIntPipe) requestId: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.resolveSpeakerRequest(id, requestId, false, req.user!.sub);
  }

  // --- MODERATION ---
  @Patch("conversations/:id/participants/:userId/role")
  @UseGuards(JwtAuthGuard)
  updateParticipantRole(
    @Param("id", ParseIntPipe) id: number,
    @Param("userId", ParseIntPipe) userId: number,
    @Body() dto: UpdateParticipantRoleDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.updateParticipantRole(id, userId, dto, req.user!.sub, req.user!.role);
  }

  @Post("conversations/:id/participants/:userId/mute")
  @UseGuards(JwtAuthGuard)
  muteParticipant(
    @Param("id", ParseIntPipe) id: number,
    @Param("userId", ParseIntPipe) userId: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.muteParticipant(id, userId, req.user!.sub, req.user!.role);
  }

  @Post("conversations/:id/participants/:userId/remove")
  @UseGuards(JwtAuthGuard)
  removeParticipant(
    @Param("id", ParseIntPipe) id: number,
    @Param("userId", ParseIntPipe) userId: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.removeParticipant(id, userId, req.user!.sub, req.user!.role);
  }

  @Post("conversations/:id/participants/:userId/ban")
  @UseGuards(JwtAuthGuard)
  banParticipant(
    @Param("id", ParseIntPipe) id: number,
    @Param("userId", ParseIntPipe) userId: number,
    @Body() dto: BanDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.banParticipant(id, userId, dto, req.user!.sub, req.user!.role);
  }

  @Delete("conversations/:id/bans/:userId")
  @UseGuards(JwtAuthGuard)
  unbanParticipant(
    @Param("id", ParseIntPipe) id: number,
    @Param("userId", ParseIntPipe) userId: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.unbanParticipant(id, userId, req.user!.sub, req.user!.role);
  }

  @Post("conversations/:id/lock")
  @UseGuards(JwtAuthGuard)
  lock(@Param("id", ParseIntPipe) id: number, @Req() req: AuthenticatedRequest) {
    return this.service.setLock(id, true, req.user!.sub, req.user!.role);
  }

  @Delete("conversations/:id/lock")
  @UseGuards(JwtAuthGuard)
  unlock(@Param("id", ParseIntPipe) id: number, @Req() req: AuthenticatedRequest) {
    return this.service.setLock(id, false, req.user!.sub, req.user!.role);
  }

  // --- INVITES ---
  @Post("conversations/:id/invites")
  @UseGuards(JwtAuthGuard)
  createInvite(@Param("id", ParseIntPipe) id: number, @Body() dto: CreateInviteDto, @Req() req: AuthenticatedRequest) {
    return this.service.createInvite(id, dto, req.user!.sub, req.user!.role);
  }

  @Get("conversations/:id/invites")
  @UseGuards(JwtAuthGuard)
  listInvites(@Param("id", ParseIntPipe) id: number, @Req() req: AuthenticatedRequest) {
    return this.service.listInvites(id, req.user!.sub, req.user!.role);
  }

  @Delete("conversations/:id/invites/:inviteId")
  @UseGuards(JwtAuthGuard)
  revokeInvite(
    @Param("id", ParseIntPipe) id: number,
    @Param("inviteId", ParseIntPipe) inviteId: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.revokeInvite(id, inviteId, req.user!.sub, req.user!.role);
  }

  // --- MATERIALS ---
  @Get("conversations/:id/materials")
  @UseGuards(OptionalJwtAuthGuard)
  listMaterials(@Param("id", ParseIntPipe) id: number) {
    return this.service.listMaterials(id);
  }

  @Post("conversations/:id/materials")
  @UseGuards(JwtAuthGuard)
  @RateLimit({ windowMs: 60_000, maxPerIp: 10, maxPerUser: 5, message: "Demasiadas subidas. Espera un minuto." })
  createMaterial(@Param("id", ParseIntPipe) id: number, @Body() dto: CreateMaterialDto, @Req() req: AuthenticatedRequest) {
    return this.service.createMaterial(id, dto, req.user!.sub, req.user!.role);
  }

  @Post("conversations/:id/materials/upload")
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor("file"))
  @RateLimit({ windowMs: 60_000, maxPerIp: 10, maxPerUser: 5, message: "Demasiadas subidas. Espera un minuto." })
  uploadMaterial(@Param("id", ParseIntPipe) id: number, @UploadedFile() file: unknown, @Req() req: AuthenticatedRequest) {
    return this.service.uploadMaterial(id, file, req.user!.sub, req.user!.role);
  }

  @Delete("conversations/:id/materials/:materialId")
  @UseGuards(JwtAuthGuard)
  deleteMaterial(
    @Param("id", ParseIntPipe) id: number,
    @Param("materialId", ParseIntPipe) materialId: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.deleteMaterial(id, materialId, req.user!.sub, req.user!.role);
  }

  // --- LINKS ---
  @Get("conversations/:id/links")
  @UseGuards(OptionalJwtAuthGuard)
  listLinks(@Param("id", ParseIntPipe) id: number) {
    return this.service.listLinks(id);
  }

  @Post("conversations/:id/links")
  @UseGuards(JwtAuthGuard)
  createLink(@Param("id", ParseIntPipe) id: number, @Body() dto: CreateSharedLinkDto, @Req() req: AuthenticatedRequest) {
    return this.service.createLink(id, dto, req.user!.sub, req.user!.role);
  }

  @Delete("conversations/:id/links/:linkId")
  @UseGuards(JwtAuthGuard)
  deleteLink(
    @Param("id", ParseIntPipe) id: number,
    @Param("linkId", ParseIntPipe) linkId: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.deleteLink(id, linkId, req.user!.sub, req.user!.role);
  }

  // --- RECORDINGS (per conversation) ---
  @Post("conversations/:id/recordings/start")
  @UseGuards(JwtAuthGuard)
  startRecording(@Param("id", ParseIntPipe) id: number, @Req() req: AuthenticatedRequest) {
    return this.service.startRecording(id, req.user!.sub, req.user!.role);
  }

  @Post("conversations/:id/recordings/stop")
  @UseGuards(JwtAuthGuard)
  stopRecording(@Param("id", ParseIntPipe) id: number, @Req() req: AuthenticatedRequest) {
    return this.service.stopRecording(id, req.user!.sub, req.user!.role);
  }

  // --- START SUBSCRIPTIONS ---
  @Post("conversations/:id/start-subscriptions")
  @UseGuards(JwtAuthGuard)
  createStartSubscription(@Param("id", ParseIntPipe) id: number, @Req() req: AuthenticatedRequest) {
    return this.service.createStartSubscription(id, req.user!.sub);
  }

  @Delete("conversations/:id/start-subscriptions/me")
  @UseGuards(JwtAuthGuard)
  cancelStartSubscription(@Param("id", ParseIntPipe) id: number, @Req() req: AuthenticatedRequest) {
    return this.service.cancelStartSubscription(id, req.user!.sub);
  }

  // --- DEBATES ---
  @Get("conversations/:id/stances")
  @UseGuards(OptionalJwtAuthGuard)
  listStances(@Param("id", ParseIntPipe) id: number) {
    return this.service.listStances(id);
  }

  @Post("conversations/:id/stances")
  @UseGuards(JwtAuthGuard)
  createStance(@Param("id", ParseIntPipe) id: number, @Body() dto: { title: string; description?: string }, @Req() req: AuthenticatedRequest) {
    return this.service.createStance(id, dto, req.user!.sub, req.user!.role);
  }

  @Post("conversations/:id/stances/:stanceId/join")
  @UseGuards(JwtAuthGuard)
  joinStance(@Param("id", ParseIntPipe) id: number, @Param("stanceId", ParseIntPipe) stanceId: number, @Req() req: AuthenticatedRequest) {
    return this.service.joinStance(id, stanceId, req.user!.sub);
  }

  @Post("conversations/:id/stances/:stanceId/arguments")
  @UseGuards(JwtAuthGuard)
  @RateLimit({ windowMs: 60_000, maxPerIp: 10, maxPerUser: 5, message: "Estás argumentando demasiado rápido." })
  createArgument(
    @Param("id", ParseIntPipe) id: number,
    @Param("stanceId", ParseIntPipe) stanceId: number,
    @Body() dto: CreateArgumentDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.createArgument(id, stanceId, dto, req.user!.sub);
  }

  @Patch("conversations/:id/arguments/:argumentId")
  @UseGuards(JwtAuthGuard)
  updateArgument(
    @Param("id", ParseIntPipe) id: number,
    @Param("argumentId", ParseIntPipe) argumentId: number,
    @Body() dto: UpdateArgumentDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.updateArgument(id, argumentId, dto, req.user!.sub, req.user!.role);
  }

  @Delete("conversations/:id/arguments/:argumentId")
  @UseGuards(JwtAuthGuard)
  deleteArgument(
    @Param("id", ParseIntPipe) id: number,
    @Param("argumentId", ParseIntPipe) argumentId: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.deleteArgument(id, argumentId, req.user!.sub, req.user!.role);
  }
}
