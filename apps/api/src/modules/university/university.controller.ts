import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, Req, Res, UseGuards } from "@nestjs/common";
import { Request, Response } from "express";
import { JwtAuthGuard, JwtPayload } from "../auth/guards/jwt-auth.guard";
import { DevSecurityService } from "../core/dev-security.service";
import { UniversityService } from "./university.service";
import { CreateSuggestionDto } from "./dto/create-suggestion.dto";
import { UniversityQueryDto } from "./dto/university-query.dto";
import { CalendarQueryDto } from "./dto/calendar-query.dto";
import { SearchQueryDto } from "./dto/search-query.dto";
import { OverviewQueryDto } from "./dto/overview-query.dto";

interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

@Controller("universidad")
export class UniversityController {
  constructor(
    private readonly service: UniversityService,
    private readonly devSecurity: DevSecurityService,
  ) {}

  // --- Static routes (defined before :id to avoid conflict) ---

  @Get("overview")
  overview(@Query() query: OverviewQueryDto) {
    return this.service.overview(query);
  }

  @Get("search")
  search(@Query() query: SearchQueryDto) {
    return this.service.search(query);
  }

  @Get("categorias")
  getCategories() {
    return this.service.getCategories();
  }

  @Get("areas")
  getAreas() {
    return this.service.getAreas(1);
  }

  @Get("calendario/eventos")
  getCalendarEvents(@Query() query: CalendarQueryDto) {
    return this.service.getCalendarEvents(1, query);
  }

  @Get("calendario/items")
  getCalendarItems(@Query() query: CalendarQueryDto) {
    return this.service.getCalendarItems(1, query);
  }

  @Get("calendario/alertas")
  getPriorityAlerts() {
    return this.service.getPriorityAlerts(1);
  }

  @Get("calendario/mes")
  getMonthEvents(@Query("year") year: string, @Query("month") month: string) {
    return this.service.getMonthEvents(1, parseInt(year) || new Date().getFullYear(), parseInt(month) || (new Date().getMonth() + 1));
  }

  @Get("calendario/dia")
  getDayEvents(@Query("date") date: string) {
    return this.service.getDayEvents(1, date || new Date().toISOString().slice(0, 10));
  }

  @Get("guardados")
  @UseGuards(JwtAuthGuard)
  getSavedItems(@Req() request: AuthenticatedRequest, @Query("type") type?: string) {
    return this.service.getSavedItems(request.user.sub, type);
  }

  @Get("recordatorios")
  @UseGuards(JwtAuthGuard)
  getReminders(@Req() request: AuthenticatedRequest) {
    return this.service.getReminders(request.user.sub);
  }

  @Post("sugerir")
  @UseGuards(JwtAuthGuard)
  createSuggestion(@Body() dto: CreateSuggestionDto, @Req() request: AuthenticatedRequest) {
    return this.service.createSuggestion(dto, request.user.sub);
  }

  // --- Calendario by date (before :id) ---
  @Get("calendario/:date")
  getDayEventsByDate(@Param("date") date: string) {
    return this.service.getDayEvents(1, date);
  }

  @Post(":id/guardar")
  @UseGuards(JwtAuthGuard)
  toggleSave(@Param("id", ParseIntPipe) id: number, @Req() request: AuthenticatedRequest) {
    return this.service.toggleSave(request.user.sub, id);
  }

  @Delete(":id/guardar")
  @UseGuards(JwtAuthGuard)
  removeSave(@Param("id", ParseIntPipe) id: number, @Req() request: AuthenticatedRequest) {
    return this.service.removeSave(request.user.sub, id);
  }

  @Post(":id/recordatorios")
  @UseGuards(JwtAuthGuard)
  createReminder(@Param("id", ParseIntPipe) id: number, @Body("remindAt") remindAt: string, @Req() request: AuthenticatedRequest) {
    return this.service.createReminder(request.user.sub, id, remindAt);
  }

  @Post(":id/reportar")
  @UseGuards(JwtAuthGuard)
  reportContent(@Param("id", ParseIntPipe) id: number, @Body("reason") reason: string, @Body("description") description: string, @Req() request: AuthenticatedRequest) {
    return this.service.reportContent(request.user.sub, id, reason, description);
  }

  @Post(":id/sugerir-correccion")
  @UseGuards(JwtAuthGuard)
  suggestCorrection(@Param("id", ParseIntPipe) id: number, @Body("suggestion") suggestion: string, @Req() request: AuthenticatedRequest) {
    return this.service.suggestCorrection(request.user.sub, id, suggestion);
  }

  // --- Reminder management (separate from item) ---
  @Delete("recordatorios/:reminderId")
  @UseGuards(JwtAuthGuard)
  deleteReminder(@Param("reminderId", ParseIntPipe) reminderId: number, @Req() request: AuthenticatedRequest) {
    return this.service.deleteReminder(request.user.sub, reminderId);
  }

  // --- Admin routes ---
  @Get("admin/contenido")
  @UseGuards(JwtAuthGuard)
  adminList(@Query() query: SearchQueryDto, @Req() request: AuthenticatedRequest) {
    this.assertAdmin(request.user.role);
    return this.service.adminList(query);
  }

  @Post("admin/contenido")
  @UseGuards(JwtAuthGuard)
  adminCreate(@Body() data: any, @Req() request: AuthenticatedRequest) {
    this.assertAdmin(request.user.role);
    return this.service.adminCreate(data, request.user.sub);
  }

  @Patch("admin/contenido/:id")
  @UseGuards(JwtAuthGuard)
  adminUpdate(@Param("id", ParseIntPipe) id: number, @Body() data: any, @Req() request: AuthenticatedRequest) {
    this.assertAdmin(request.user.role);
    return this.service.adminUpdate(id, data, request.user.sub);
  }

  @Post("admin/contenido/:id/publicar")
  @UseGuards(JwtAuthGuard)
  adminPublish(@Param("id", ParseIntPipe) id: number, @Req() request: AuthenticatedRequest) {
    this.assertAdmin(request.user.role);
    return this.service.adminPublish(id, request.user.sub);
  }

  @Post("admin/contenido/:id/archivar")
  @UseGuards(JwtAuthGuard)
  adminArchive(@Param("id", ParseIntPipe) id: number, @Req() request: AuthenticatedRequest) {
    this.assertAdmin(request.user.role);
    return this.service.adminArchive(id, request.user.sub);
  }

  @Post("admin/contenido/:id/cancelar")
  @UseGuards(JwtAuthGuard)
  adminCancel(@Param("id", ParseIntPipe) id: number, @Req() request: AuthenticatedRequest) {
    this.assertAdmin(request.user.role);
    return this.service.adminCancel(id, request.user.sub);
  }

  @Post("admin/contenido/:id/duplicar")
  @UseGuards(JwtAuthGuard)
  adminDuplicate(@Param("id", ParseIntPipe) id: number, @Req() request: AuthenticatedRequest) {
    this.assertAdmin(request.user.role);
    return this.service.adminDuplicate(id, request.user.sub);
  }

  @Get("admin/sugerencias")
  @UseGuards(JwtAuthGuard)
  getSuggestions(@Query("status") status: string, @Req() request: AuthenticatedRequest) {
    this.assertAdmin(request.user.role);
    return this.service.getSuggestions(status);
  }

  @Post("admin/sugerencias/:id/aprobar")
  @UseGuards(JwtAuthGuard)
  approveSuggestion(@Param("id", ParseIntPipe) id: number, @Req() request: AuthenticatedRequest) {
    this.assertAdmin(request.user.role);
    return this.service.approveSuggestion(id, request.user.sub);
  }

  @Post("admin/sugerencias/:id/rechazar")
  @UseGuards(JwtAuthGuard)
  rejectSuggestion(@Param("id", ParseIntPipe) id: number, @Req() request: AuthenticatedRequest) {
    this.assertAdmin(request.user.role);
    return this.service.rejectSuggestion(id, request.user.sub);
  }

  @Get("admin/reportes")
  @UseGuards(JwtAuthGuard)
  getReports(@Req() request: AuthenticatedRequest) {
    this.assertAdmin(request.user.role);
    return this.service.getReports();
  }

  @Post("admin/reportes/:id/resolver")
  @UseGuards(JwtAuthGuard)
  resolveReport(@Param("id", ParseIntPipe) id: number, @Req() request: AuthenticatedRequest) {
    this.assertAdmin(request.user.role);
    return this.service.resolveReport(id, request.user.sub);
  }

  @Get("admin/auditoria")
  @UseGuards(JwtAuthGuard)
  getAuditLogs(@Req() request: AuthenticatedRequest) {
    this.assertAdmin(request.user.role);
    return this.service.getAuditLogs();
  }


  // --- ICS export and parameterized read routes (after static/admin GET routes) ---
  @Get(":id/ics")
  async getIcs(@Param("id", ParseIntPipe) id: number, @Res() res: Response) {
    const ics = await this.service.getIcsCalendar(id);
    res.setHeader("Content-Type", "text/calendar; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="evento-${id}.ics"`);
    res.send(ics);
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  private assertAdmin(role: string) {
    this.devSecurity.assertAdmin(role, "Se requiere rol ADMIN para gestionar contenidos universitarios.");
  }
}
