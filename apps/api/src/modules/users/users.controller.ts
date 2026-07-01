import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, Req, Res, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Request, Response } from "express";
import { JwtAuthGuard, JwtPayload } from "../auth/guards/jwt-auth.guard";
import { OptionalJwtAuthGuard } from "../auth/guards/optional-jwt-auth.guard";
import { UpdateMeDto } from "./dto/update-me.dto";
import { UpdateCoverPositionDto } from "./dto/update-cover-position.dto";
import { CreateEducationDto } from "./dto/create-education.dto";
import { CreateEmploymentDto } from "./dto/create-employment.dto";
import { CreateInterestDto, CreateLinkDto, CreateCustomDetailDto } from "./dto/create-profile-items.dto";
import { CreateFeaturedItemDto } from "./dto/create-featured-item.dto";
import { ReorderItemsDto, UpdateSectionSettingsDto } from "./dto/profile-settings.dto";
import { UpdatePrivacySettingsDto } from "./dto/update-privacy-settings.dto";
import { UsersService } from "./users.service";
import { RateLimit } from "../core/rate-limit.decorator";

interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

@Controller()
export class UsersController {
  constructor(private readonly service: UsersService) {}

  // ==================== CORE PROFILE ====================

  @Get("users/me")
  @UseGuards(JwtAuthGuard)
  getMe(@Req() request: AuthenticatedRequest) {
    return this.service.getMe(request.user!.sub);
  }

  @Patch("users/me")
  @UseGuards(JwtAuthGuard)
  updateMe(@Req() request: AuthenticatedRequest, @Body() dto: UpdateMeDto) {
    return this.service.updateMe(request.user!.sub, dto);
  }

  @Get("users/:id")
  @UseGuards(OptionalJwtAuthGuard)
  getUserProfile(@Param("id", ParseIntPipe) id: number, @Req() request: AuthenticatedRequest) {
    return this.service.getUserProfile(id, request.user?.sub);
  }

  // ==================== AVATAR & COVER ====================

  @Post("users/me/avatar")
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor("file"))
  @RateLimit({ windowMs: 60_000, maxPerIp: 10, maxPerUser: 5, message: "Demasiadas subidas. Espera un minuto." })
  uploadAvatar(@UploadedFile() file: any, @Req() request: AuthenticatedRequest) {
    return this.service.uploadAvatar(request.user!.sub, file);
  }

  @Delete("users/me/avatar")
  @UseGuards(JwtAuthGuard)
  deleteAvatar(@Req() request: AuthenticatedRequest) {
    return this.service.deleteAvatar(request.user!.sub);
  }

  @Post("users/me/cover")
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor("file"))
  @RateLimit({ windowMs: 60_000, maxPerIp: 10, maxPerUser: 5, message: "Demasiadas subidas. Espera un minuto." })
  uploadCover(@UploadedFile() file: any, @Req() request: AuthenticatedRequest) {
    return this.service.uploadCover(request.user!.sub, file);
  }

  @Delete("users/me/cover")
  @UseGuards(JwtAuthGuard)
  deleteCover(@Req() request: AuthenticatedRequest) {
    return this.service.deleteCover(request.user!.sub);
  }

  @Patch("users/me/cover-position")
  @UseGuards(JwtAuthGuard)
  updateCoverPosition(@Req() request: AuthenticatedRequest, @Body() dto: UpdateCoverPositionDto) {
    return this.service.updateCoverPosition(request.user!.sub, dto);
  }

  // Serve avatar/cover files from MinIO
  @Get("users/avatars/:filename")
  async serveAvatar(@Param("filename") filename: string, @Res({ passthrough: true }) response: Response) {
    const result = await this.service.serveStorageFile("avatars", filename);
    response.setHeader("Content-Type", result.mimeType);
    response.setHeader("Cache-Control", "public, max-age=86400");
    return result.buffer;
  }

  @Get("users/covers/:filename")
  async serveCover(@Param("filename") filename: string, @Res({ passthrough: true }) response: Response) {
    const result = await this.service.serveStorageFile("covers", filename);
    response.setHeader("Content-Type", result.mimeType);
    response.setHeader("Cache-Control", "public, max-age=86400");
    return result.buffer;
  }

  // ==================== PROFILE POSTS ====================

  @Get("users/:id/posts")
  @UseGuards(OptionalJwtAuthGuard)
  getUserPosts(
    @Param("id", ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest,
    @Query("cursor") cursor?: string,
    @Query("limit") limit?: string,
  ) {
    return this.service.getUserPosts(id, request.user?.sub, cursor ? parseInt(cursor, 10) : undefined, limit ? parseInt(limit, 10) : undefined);
  }

  // ==================== FOLLOWS ====================

  @Post("follows/:userId")
  @UseGuards(JwtAuthGuard)
  @RateLimit({ windowMs: 60_000, maxPerIp: 20, maxPerUser: 12, message: "Estás siguiendo cuentas demasiado rápido. Espera 1 minuto." })
  follow(@Param("userId", ParseIntPipe) userId: number, @Req() request: AuthenticatedRequest) {
    return this.service.followUser(request.user!.sub, userId);
  }

  @Delete("follows/:userId")
  @UseGuards(JwtAuthGuard)
  unfollow(@Param("userId", ParseIntPipe) userId: number, @Req() request: AuthenticatedRequest) {
    return this.service.unfollowUser(request.user!.sub, userId);
  }

  @Get("users/:id/followers")
  @UseGuards(OptionalJwtAuthGuard)
  getFollowers(
    @Param("id", ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest,
    @Query("cursor") cursor?: string,
    @Query("limit") limit?: string,
  ) {
    return this.service.getFollowers(id, request.user?.sub, cursor ? parseInt(cursor, 10) : undefined, limit ? parseInt(limit, 10) : undefined);
  }

  @Get("users/:id/following")
  @UseGuards(OptionalJwtAuthGuard)
  getFollowing(
    @Param("id", ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest,
    @Query("cursor") cursor?: string,
    @Query("limit") limit?: string,
  ) {
    return this.service.getFollowing(id, request.user?.sub, cursor ? parseInt(cursor, 10) : undefined, limit ? parseInt(limit, 10) : undefined);
  }

  @Get("users/:id/friends")
  @UseGuards(OptionalJwtAuthGuard)
  getFriends(
    @Param("id", ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest,
    @Query("cursor") cursor?: string,
    @Query("limit") limit?: string,
  ) {
    return this.service.getFriends(id, request.user?.sub, cursor ? parseInt(cursor, 10) : undefined, limit ? parseInt(limit, 10) : undefined);
  }

  // ==================== ABOUT ====================

  @Get("users/me/about")
  @UseGuards(JwtAuthGuard)
  getMyAbout(@Req() request: AuthenticatedRequest) {
    return this.service.getAbout(request.user!.sub, request.user!.sub);
  }

  @Get("users/:id/about")
  @UseGuards(OptionalJwtAuthGuard)
  getAbout(@Param("id", ParseIntPipe) id: number, @Req() request: AuthenticatedRequest) {
    return this.service.getAbout(id, request.user?.sub);
  }

  // ==================== EDUCATION ====================

  @Post("users/me/education")
  @UseGuards(JwtAuthGuard)
  createEducation(@Req() request: AuthenticatedRequest, @Body() dto: CreateEducationDto) {
    return this.service.createEducation(request.user!.sub, dto);
  }

  @Patch("users/me/education/:id")
  @UseGuards(JwtAuthGuard)
  updateEducation(@Param("id", ParseIntPipe) id: number, @Req() request: AuthenticatedRequest, @Body() dto: Partial<CreateEducationDto>) {
    return this.service.updateEducation(request.user!.sub, id, dto);
  }

  @Delete("users/me/education/:id")
  @UseGuards(JwtAuthGuard)
  deleteEducation(@Param("id", ParseIntPipe) id: number, @Req() request: AuthenticatedRequest) {
    return this.service.deleteEducation(request.user!.sub, id);
  }

  @Patch("users/me/education/reorder")
  @UseGuards(JwtAuthGuard)
  reorderEducation(@Req() request: AuthenticatedRequest, @Body() dto: ReorderItemsDto) {
    return this.service.reorderEducation(request.user!.sub, dto);
  }

  // ==================== EMPLOYMENT ====================

  @Post("users/me/employment")
  @UseGuards(JwtAuthGuard)
  createEmployment(@Req() request: AuthenticatedRequest, @Body() dto: CreateEmploymentDto) {
    return this.service.createEmployment(request.user!.sub, dto);
  }

  @Patch("users/me/employment/:id")
  @UseGuards(JwtAuthGuard)
  updateEmployment(@Param("id", ParseIntPipe) id: number, @Req() request: AuthenticatedRequest, @Body() dto: Partial<CreateEmploymentDto>) {
    return this.service.updateEmployment(request.user!.sub, id, dto);
  }

  @Delete("users/me/employment/:id")
  @UseGuards(JwtAuthGuard)
  deleteEmployment(@Param("id", ParseIntPipe) id: number, @Req() request: AuthenticatedRequest) {
    return this.service.deleteEmployment(request.user!.sub, id);
  }

  @Patch("users/me/employment/reorder")
  @UseGuards(JwtAuthGuard)
  reorderEmployment(@Req() request: AuthenticatedRequest, @Body() dto: ReorderItemsDto) {
    return this.service.reorderEmployment(request.user!.sub, dto);
  }

  // ==================== INTERESTS / LINKS / DETAILS ====================

  @Post("users/me/interests")
  @UseGuards(JwtAuthGuard)
  createInterest(@Req() request: AuthenticatedRequest, @Body() dto: CreateInterestDto) {
    return this.service.createInterest(request.user!.sub, dto);
  }

  @Delete("users/me/interests/:id")
  @UseGuards(JwtAuthGuard)
  deleteInterest(@Param("id", ParseIntPipe) id: number, @Req() request: AuthenticatedRequest) {
    return this.service.deleteInterest(request.user!.sub, id);
  }

  @Post("users/me/links")
  @UseGuards(JwtAuthGuard)
  createLink(@Req() request: AuthenticatedRequest, @Body() dto: CreateLinkDto) {
    return this.service.createLink(request.user!.sub, dto);
  }

  @Patch("users/me/links/:id")
  @UseGuards(JwtAuthGuard)
  updateLink(@Param("id", ParseIntPipe) id: number, @Req() request: AuthenticatedRequest, @Body() dto: Partial<CreateLinkDto>) {
    return this.service.updateLink(request.user!.sub, id, dto);
  }

  @Delete("users/me/links/:id")
  @UseGuards(JwtAuthGuard)
  deleteLink(@Param("id", ParseIntPipe) id: number, @Req() request: AuthenticatedRequest) {
    return this.service.deleteLink(request.user!.sub, id);
  }

  @Post("users/me/details")
  @UseGuards(JwtAuthGuard)
  createCustomDetail(@Req() request: AuthenticatedRequest, @Body() dto: CreateCustomDetailDto) {
    return this.service.createCustomDetail(request.user!.sub, dto);
  }

  @Delete("users/me/details/:id")
  @UseGuards(JwtAuthGuard)
  deleteCustomDetail(@Param("id", ParseIntPipe) id: number, @Req() request: AuthenticatedRequest) {
    return this.service.deleteCustomDetail(request.user!.sub, id);
  }

  // ==================== FEATURED ====================

  @Get("users/:id/featured")
  @UseGuards(OptionalJwtAuthGuard)
  getFeatured(@Param("id", ParseIntPipe) id: number, @Req() request: AuthenticatedRequest) {
    return this.service.getFeatured(id, request.user?.sub);
  }

  @Post("users/me/featured")
  @UseGuards(JwtAuthGuard)
  createFeatured(@Req() request: AuthenticatedRequest, @Body() dto: CreateFeaturedItemDto) {
    return this.service.createFeatured(request.user!.sub, dto);
  }

  @Delete("users/me/featured/:id")
  @UseGuards(JwtAuthGuard)
  deleteFeatured(@Param("id", ParseIntPipe) id: number, @Req() request: AuthenticatedRequest) {
    return this.service.deleteFeatured(request.user!.sub, id);
  }

  @Patch("users/me/featured/reorder")
  @UseGuards(JwtAuthGuard)
  reorderFeatured(@Req() request: AuthenticatedRequest, @Body() dto: ReorderItemsDto) {
    return this.service.reorderFeatured(request.user!.sub, dto);
  }

  // ==================== SETTINGS ====================

  @Get("users/me/profile-settings")
  @UseGuards(JwtAuthGuard)
  getProfileSettings(@Req() request: AuthenticatedRequest) {
    return this.service.getSectionSettings(request.user!.sub);
  }

  @Patch("users/me/profile-settings")
  @UseGuards(JwtAuthGuard)
  updateProfileSettings(@Req() request: AuthenticatedRequest, @Body() dto: UpdateSectionSettingsDto) {
    return this.service.updateSectionSettings(request.user!.sub, dto);
  }

  @Get("users/me/privacy-settings")
  @UseGuards(JwtAuthGuard)
  getPrivacySettings(@Req() request: AuthenticatedRequest) {
    return this.service.getPrivacySettings(request.user!.sub);
  }

  @Patch("users/me/privacy-settings")
  @UseGuards(JwtAuthGuard)
  updatePrivacySettings(@Req() request: AuthenticatedRequest, @Body() dto: UpdatePrivacySettingsDto) {
    return this.service.updatePrivacySettings(request.user!.sub, dto);
  }
}
