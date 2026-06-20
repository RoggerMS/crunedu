import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateSuggestionDto } from "./dto/create-suggestion.dto";
import { UniversityQueryDto } from "./dto/university-query.dto";
import { CalendarQueryDto } from "./dto/calendar-query.dto";
import { SearchQueryDto } from "./dto/search-query.dto";
import { OverviewQueryDto } from "./dto/overview-query.dto";
import { Prisma } from "@prisma/client";

@Injectable()
export class UniversityService {
  constructor(private readonly prisma: PrismaService) {}

  async overview(query: OverviewQueryDto) {
    const universityId = query.universityId ?? 1;
    const now = new Date();

    const [alerts, upcomingDates, mostConsulted, areas, upcomingEvents] = await Promise.all([
      this.getPriorityAlerts(universityId),
      this.prisma.universityCalendarItem.findMany({
        where: { universityId, status: "PUBLISHED", startsAt: { gte: now } },
        take: 5,
        orderBy: { startsAt: "asc" },
        include: { category: true },
      }),
      this.prisma.universityContent.findMany({
        where: { status: "PUBLISHED", deletedAt: null },
        orderBy: { views: "desc" },
        take: 5,
        select: { id: true, title: true, views: true, type: true, category: true },
      }),
      this.prisma.universityArea.findMany({
        where: { universityId, isActive: true },
        orderBy: { name: "asc" },
      }),
      this.prisma.universityCalendarOccurrence.findMany({
        where: {
          item: { universityId, status: { in: ["PUBLISHED", "ACTIVE"] } },
          startsAt: { gte: now },
        },
        take: 5,
        orderBy: { startsAt: "asc" },
        include: { item: { include: { category: true } } },
      }),
    ]);

    return {
      alerts: alerts.map((a) => ({
        id: a.id,
        title: a.title,
        summary: a.summary,
        priority: a.priority,
        endsAt: a.endsAt?.toISOString() ?? null,
        daysRemaining: a.endsAt ? Math.ceil((a.endsAt.getTime() - now.getTime()) / 86400000) : null,
        category: a.category ? { name: a.category.name, color: a.category.color, icon: a.category.icon } : null,
      })),
      upcomingDates: upcomingDates.map((d) => ({
        id: d.id,
        title: d.title,
        startsAt: d.startsAt?.toISOString() ?? null,
        category: d.category ? { name: d.category.name, color: d.category.color } : null,
      })),
      mostConsulted: mostConsulted.map((c) => ({ id: c.id, title: c.title, views: c.views, type: c.type })),
      areas: areas.map((a) => ({ id: a.id, name: a.name, slug: a.slug, icon: a.icon, contactEmail: a.contactEmail })),
      upcomingEvents: upcomingEvents.map((e) => ({
        id: e.id,
        title: e.item.title,
        startsAt: e.startsAt.toISOString(),
        location: e.locationName ?? e.item.locationName,
        category: e.item.category ? { name: e.item.category.name, color: e.item.category.color } : null,
      })),
    };
  }

  async search(query: SearchQueryDto) {
    const where: Prisma.UniversityContentWhereInput = {
      status: "PUBLISHED",
      deletedAt: null,
    };

    if (query.type) {
      const validTypes = new Set(["EVENTO", "CONVOCATORIA", "TRAMITE", "SERVICIO", "GUIA", "AVISO"]);
      if (validTypes.has(query.type)) {
        (where as any).type = query.type;
      }
    }
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.areaId) where.areaId = query.areaId;
    if (query.priority) where.priority = query.priority;
    if (query.modality) where.modality = query.modality;
    if (query.visibility) (where as any).visibility = query.visibility;
    if (query.startDate) {
      where.OR = [
        { startDate: { gte: new Date(query.startDate) } },
        { deadline: { gte: new Date(query.startDate) } },
      ];
    }
    if (query.endDate) {
      const endFilter = { lte: new Date(query.endDate) };
      if (where.OR) {
        where.AND = [
          { OR: [{ startDate: endFilter }, { deadline: endFilter }] },
        ];
      } else {
        where.OR = [{ startDate: endFilter }, { deadline: endFilter }];
      }
    }
    if (query.q) {
      const searchFilter = { contains: query.q, mode: "insensitive" as const };
      const qFilter = [
        { title: searchFilter },
        { description: searchFilter },
        { area: searchFilter },
        { category: searchFilter },
      ];
      if (where.OR) {
        (where as any).AND = [...((where as any).AND || []), { OR: qFilter }];
      } else {
        where.OR = qFilter;
      }
    }

    const limit = query.limit ?? 20;
    const safeLimit = Math.min(limit, 50);
    const take = safeLimit + 1;

    const orderBy: any = {};
    const sortDir = query.sort === "asc" ? "asc" : "desc";
    const sortField = ["views", "savesCount", "createdAt", "updatedAt", "startDate", "deadline"].includes(query.sortBy ?? "")
      ? (query.sortBy as string)
      : "createdAt";
    orderBy[sortField] = sortDir;

    const items = await this.prisma.universityContent.findMany({
      where,
      orderBy: [orderBy, { id: "desc" }],
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      take,
      include: { categoryRel: true, areaRel: true },
    });

    const nextCursor = items.length > safeLimit ? items[safeLimit].id : null;

    return {
      items: items.slice(0, safeLimit).map((item) => this.mapExtendedResponse(item)),
      nextCursor,
    };
  }

  async findOne(id: number) {
    const item = await this.prisma.universityContent.findFirst({
      where: { id, status: "PUBLISHED", deletedAt: null },
      include: { categoryRel: true, areaRel: true, user: { select: { id: true, profile: { select: { firstName: true, lastName: true } } } } },
    });
    if (!item) throw new NotFoundException("Contenido universitario no encontrado.");

    await this.prisma.universityContent.update({
      where: { id },
      data: { views: { increment: 1 } },
    }).catch(() => {});

    return this.mapExtendedResponse({ ...item, views: item.views + 1 });
  }

  async getCalendarEvents(universityId: number, query: CalendarQueryDto) {
    const now = new Date();
    const startDate = query.startDate ? new Date(query.startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = query.endDate ? new Date(query.endDate) : new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const where: Prisma.UniversityCalendarOccurrenceWhereInput = {
      item: { universityId, status: { in: ["PUBLISHED", "ACTIVE"] } },
      startsAt: { gte: startDate },
      endsAt: { lte: endDate },
    };

    if (query.categoryId) (where.item as any).categoryId = query.categoryId;
    if (query.areaId) (where.item as any).areaId = query.areaId;
    if (query.priority) (where.item as any).priority = query.priority;
    if (query.q) {
      (where.item as any).OR = [
        { title: { contains: query.q, mode: "insensitive" } },
        { description: { contains: query.q, mode: "insensitive" } },
      ];
    }

    const occurrences = await this.prisma.universityCalendarOccurrence.findMany({
      where,
      include: { item: { include: { category: true, area: true } } },
      orderBy: { startsAt: "asc" },
    });

    return occurrences.map((occ) => ({
      id: occ.id,
      itemId: occ.itemId,
      title: occ.item.title,
      summary: occ.item.summary,
      type: occ.item.type,
      modality: occ.item.modality,
      priority: occ.item.priority,
      startsAt: occ.startsAt.toISOString(),
      endsAt: occ.endsAt.toISOString(),
      allDay: occ.allDay,
      location: occ.locationName || occ.item.locationName,
      category: { id: occ.item.category.id, name: occ.item.category.name, color: occ.item.category.color, icon: occ.item.category.icon },
      area: occ.item.area ? { id: occ.item.area.id, name: occ.item.area.name } : null,
    }));
  }

  async getCalendarItems(universityId: number, query: CalendarQueryDto) {
    const now = new Date();
    const startDate = query.startDate ? new Date(query.startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = query.endDate ? new Date(query.endDate) : new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const where: Prisma.UniversityCalendarItemWhereInput = {
      universityId,
      status: { in: ["PUBLISHED", "ACTIVE"] },
      OR: [
        { startsAt: { gte: startDate, lte: endDate } },
        { endsAt: { gte: startDate, lte: endDate } },
        { startsAt: { lte: startDate }, endsAt: { gte: endDate } },
      ],
    };

    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.areaId) where.areaId = query.areaId;
    if (query.priority) (where as any).priority = query.priority;
    if (query.q) {
      where.OR = [
        { title: { contains: query.q, mode: "insensitive" } },
        { description: { contains: query.q, mode: "insensitive" } },
      ];
    }

    const items = await this.prisma.universityCalendarItem.findMany({
      where,
      include: { category: true, area: true, occurrences: true },
      orderBy: [{ isFeatured: "desc" }, { startsAt: "asc" }],
      take: 100,
    });

    return items.map((item) => ({
      id: item.id,
      title: item.title,
      slug: item.slug,
      summary: item.summary,
      description: item.description,
      type: item.type,
      modality: item.modality,
      status: item.status,
      priority: item.priority,
      startsAt: item.startsAt?.toISOString() ?? null,
      endsAt: item.endsAt?.toISOString() ?? null,
      allDay: item.allDay,
      locationName: item.locationName,
      onlineUrl: item.onlineUrl,
      sourceUrl: item.sourceUrl,
      isFeatured: item.isFeatured,
      viewCount: item.viewCount,
      saveCount: item.saveCount,
      category: { id: item.category.id, name: item.category.name, color: item.category.color, icon: item.category.icon },
      area: item.area ? { id: item.area.id, name: item.area.name } : null,
      occurrences: item.occurrences.map((occ) => ({
        id: occ.id,
        startsAt: occ.startsAt.toISOString(),
        endsAt: occ.endsAt.toISOString(),
        allDay: occ.allDay,
        locationName: occ.locationName,
      })),
      createdAt: item.createdAt.toISOString(),
    }));
  }

  async getMonthEvents(universityId: number, year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const items = await this.prisma.universityCalendarItem.findMany({
      where: {
        universityId,
        status: { in: ["PUBLISHED", "ACTIVE"] },
        OR: [
          { startsAt: { gte: startDate, lte: endDate } },
          { endsAt: { gte: startDate, lte: endDate } },
          { startsAt: { lte: startDate }, endsAt: { gte: endDate } },
        ],
      },
      include: { category: true, occurrences: { where: { startsAt: { gte: startDate }, endsAt: { lte: endDate } } } },
    });

    return items.map((item) => ({
      id: item.id,
      title: item.title,
      type: item.type,
      startsAt: item.startsAt?.toISOString() ?? null,
      endsAt: item.endsAt?.toISOString() ?? null,
      allDay: item.allDay,
      category: { color: item.category.color, name: item.category.name, icon: item.category.icon },
      occurrences: item.occurrences.map((o) => ({
        startsAt: o.startsAt.toISOString(),
        endsAt: o.endsAt.toISOString(),
        allDay: o.allDay,
      })),
    }));
  }

  async getDayEvents(universityId: number, date: string) {
    const dayStart = new Date(date + "T00:00:00");
    const dayEnd = new Date(date + "T23:59:59");

    const [items, occurrences] = await Promise.all([
      this.prisma.universityCalendarItem.findMany({
        where: {
          universityId,
          status: { in: ["PUBLISHED", "ACTIVE"] },
          OR: [
            { startsAt: { gte: dayStart, lte: dayEnd } },
            { endsAt: { gte: dayStart, lte: dayEnd } },
            { startsAt: { lte: dayStart }, endsAt: { gte: dayEnd } },
          ],
        },
        include: { category: true, area: true },
        orderBy: [{ allDay: "desc" }, { startsAt: "asc" }],
      }),
      this.prisma.universityCalendarOccurrence.findMany({
        where: {
          item: { universityId, status: { in: ["PUBLISHED", "ACTIVE"] } },
          startsAt: { gte: dayStart, lte: dayEnd },
        },
        include: { item: { include: { category: true, area: true } } },
        orderBy: { startsAt: "asc" },
      }),
    ]);

    return {
      items: items.map((item) => ({
        id: item.id,
        title: item.title,
        summary: item.summary,
        description: item.description,
        type: item.type,
        modality: item.modality,
        priority: item.priority,
        startsAt: item.startsAt?.toISOString() ?? null,
        endsAt: item.endsAt?.toISOString() ?? null,
        allDay: item.allDay,
        locationName: item.locationName,
        onlineUrl: item.onlineUrl,
        category: item.category ? { id: item.category.id, name: item.category.name, color: item.category.color } : null,
        area: item.area ? { id: item.area.id, name: item.area.name, contactEmail: item.area.contactEmail } : null,
      })),
      occurrences: occurrences.map((occ) => ({
        id: occ.id,
        itemId: occ.itemId,
        title: occ.item.title,
        summary: occ.item.summary,
        startsAt: occ.startsAt.toISOString(),
        endsAt: occ.endsAt.toISOString(),
        allDay: occ.allDay,
        location: occ.locationName || occ.item.locationName,
        category: occ.item.category ? { name: occ.item.category.name, color: occ.item.category.color } : null,
        area: occ.item.area ? { name: occ.item.area.name } : null,
      })),
    };
  }

  async getPriorityAlerts(universityId: number) {
    return this.prisma.universityCalendarItem.findMany({
      where: {
        universityId,
        priority: { in: ["URGENT", "CRITICAL"] },
        status: { in: ["PUBLISHED", "ACTIVE"] },
        endsAt: { gte: new Date() },
      },
      take: 5,
      orderBy: { endsAt: "asc" },
      include: { category: true },
    });
  }

  async toggleSave(userId: number, contentId: number) {
    const content = await this.prisma.universityContent.findFirst({
      where: { id: contentId, status: "PUBLISHED", deletedAt: null },
    });
    if (!content) throw new NotFoundException("Contenido no encontrado.");

    const existing = await this.prisma.universityContentSaved.findUnique({
      where: { contentId_userId: { contentId, userId } },
    });

    if (existing) {
      await this.prisma.universityContentSaved.delete({ where: { id: existing.id } });
      await this.prisma.universityContent.updateMany({
        where: { id: contentId, savesCount: { gt: 0 } },
        data: { savesCount: { decrement: 1 } },
      });
      return { saved: false };
    }

    await this.prisma.universityContentSaved.create({ data: { contentId, userId } });
    await this.prisma.universityContent.update({
      where: { id: contentId },
      data: { savesCount: { increment: 1 } },
    });
    return { saved: true };
  }

  async removeSave(userId: number, contentId: number) {
    const existing = await this.prisma.universityContentSaved.findUnique({
      where: { contentId_userId: { contentId, userId } },
    });

    if (!existing) return { saved: false };

    await this.prisma.universityContentSaved.delete({ where: { id: existing.id } });
    await this.prisma.universityContent.updateMany({
      where: { id: contentId, savesCount: { gt: 0 } },
      data: { savesCount: { decrement: 1 } },
    });
    return { saved: false };
  }

  async getSavedItems(userId: number, type?: string) {
    const where: Prisma.UniversityContentSavedWhereInput = { userId };
    const saved = await this.prisma.universityContentSaved.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        content: {
          include: { categoryRel: true, areaRel: true },
        },
      },
    });

    let items = saved.map((s) => this.mapExtendedResponse(s.content));
    if (type) {
      const t = type.toUpperCase();
      items = items.filter((i: any) => i.type === t);
    }
    return items;
  }

  async createReminder(userId: number, itemId: number, remindAt: string) {
    const item = await this.prisma.universityCalendarItem.findFirst({
      where: { id: itemId, status: { in: ["PUBLISHED", "ACTIVE"] } },
    });
    if (!item) throw new NotFoundException("Evento no encontrado.");

    const remindDate = new Date(remindAt);
    if (isNaN(remindDate.getTime())) throw new BadRequestException("Fecha de recordatorio inválida.");

    const existing = await this.prisma.universityReminder.findFirst({
      where: { userId, itemId, remindAt: remindDate },
    });
    if (existing) throw new ConflictException("Ya existe un recordatorio para esta fecha.");

    const reminder = await this.prisma.universityReminder.create({
      data: { userId, itemId, remindAt: remindDate },
    });
    return { id: reminder.id, message: "Recordatorio creado." };
  }

  async getReminders(userId: number) {
    return this.prisma.universityReminder.findMany({
      where: { userId },
      orderBy: { remindAt: "asc" },
      include: { item: { include: { category: true } } },
    });
  }

  async deleteReminder(userId: number, reminderId: number) {
    const reminder = await this.prisma.universityReminder.findFirst({
      where: { id: reminderId, userId },
    });
    if (!reminder) throw new NotFoundException("Recordatorio no encontrado.");
    await this.prisma.universityReminder.delete({ where: { id: reminderId } });
    return { message: "Recordatorio eliminado." };
  }

  async reportContent(userId: number, contentId: number, reason: string, description?: string) {
    const content = await this.prisma.universityContent.findFirst({
      where: { id: contentId, deletedAt: null },
    });
    if (!content) throw new NotFoundException("Contenido no encontrado.");

    const report = await this.prisma.report.create({
      data: {
        reporterId: userId,
        reason,
        description,
        status: "OPEN",
      },
    });
    return { id: report.id, message: "Reporte enviado. Gracias por ayudar a mantener la calidad de la información." };
  }

  async suggestCorrection(userId: number, contentId: number, suggestion: string) {
    const content = await this.prisma.universityContent.findFirst({
      where: { id: contentId, deletedAt: null },
    });
    if (!content) throw new NotFoundException("Contenido no encontrado.");

    await this.prisma.universitySuggestion.create({
      data: {
        type: "correccion",
        title: `Corrección: ${content.title}`,
        description: suggestion,
        area: content.area,
        userId,
      },
    });
    return { message: "Tu sugerencia de corrección fue enviada para revisión." };
  }

  async getIcsCalendar(contentId: number) {
    const content = await this.prisma.universityContent.findFirst({
      where: { id: contentId, deletedAt: null },
    });
    if (!content) throw new NotFoundException("Contenido no encontrado.");

    const dtStart = content.startDate || content.deadline || new Date();
    const dtEnd = content.endDate || content.deadline || dtStart;
    const now = new Date();
    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//CrunEdu//Universidad//ES",
      "BEGIN:VEVENT",
      `UID:${contentId}@crunedu.local`,
      `DTSTAMP:${fmt(now)}`,
      `DTSTART:${fmt(dtStart)}`,
      `DTEND:${fmt(dtEnd)}`,
      `SUMMARY:${content.title}`,
      `DESCRIPTION:${(content.description || "").replace(/\n/g, "\\n")}`,
      content.location ? `LOCATION:${content.location}` : "",
      "END:VEVENT",
      "END:VCALENDAR",
    ].filter(Boolean).join("\r\n");

    return ics;
  }

  async getCategories() {
    return this.prisma.universityCategory.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
    });
  }

  async getAreas(universityId: number) {
    return this.prisma.universityArea.findMany({
      where: { universityId, isActive: true },
      orderBy: { name: "asc" },
    });
  }

  async index(query: UniversityQueryDto) {
    const where: Prisma.UniversityContentWhereInput = { status: "PUBLISHED", deletedAt: null };

    const validTypes = new Set(["EVENTO", "CONVOCATORIA", "TRAMITE", "SERVICIO", "GUIA", "AVISO"]);
    if (query.type && validTypes.has(query.type)) (where as any).type = query.type;
    if (query.area) where.area = { contains: query.area, mode: "insensitive" };
    if (query.category) where.category = { contains: query.category, mode: "insensitive" };
    if (query.q) {
      where.OR = [
        { title: { contains: query.q, mode: "insensitive" } },
        { description: { contains: query.q, mode: "insensitive" } },
      ];
    }

    const limit = query.limit ?? 15;
    const safeLimit = Math.min(limit, 30);
    const take = safeLimit + 1;

    const items = await this.prisma.universityContent.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      take,
      include: { categoryRel: true, areaRel: true },
    });

    const nextCursor = items.length > safeLimit ? items[safeLimit].id : null;

    return {
      items: items.slice(0, safeLimit).map((item) => this.mapExtendedResponse(item)),
      nextCursor,
    };
  }

  async createSuggestion(dto: CreateSuggestionDto, userId: number) {
    const suggestion = await this.prisma.universitySuggestion.create({
      data: {
        type: dto.type.trim(),
        title: dto.title.trim(),
        description: dto.description.trim(),
        area: dto.area?.trim() || "",
        date: dto.date ? new Date(dto.date) : null,
        location: dto.location?.trim() || null,
        externalUrl: dto.externalUrl?.trim() || null,
        userId,
      },
    });
    return { id: suggestion.id, message: "Tu sugerencia fue enviada para revisión." };
  }

  // --- Admin methods ---

  async adminList(query: SearchQueryDto) {
    const where: Prisma.UniversityContentWhereInput = { deletedAt: null };
    if (query.type) (where as any).type = query.type;
    if (query.status) (where as any).status = query.status;
    if (query.q) {
      where.OR = [
        { title: { contains: query.q, mode: "insensitive" } },
        { description: { contains: query.q, mode: "insensitive" } },
      ];
    }

    const limit = query.limit ?? 20;
    const take = Math.min(limit, 50) + 1;

    const items = await this.prisma.universityContent.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      take,
      include: { categoryRel: true, areaRel: true, user: { select: { id: true, email: true, profile: { select: { firstName: true, lastName: true } } } } },
    });

    const nextCursor = items.length > take - 1 ? items[take - 1].id : null;
    return { items: items.slice(0, take - 1).map((i) => this.mapExtendedResponse(i)), nextCursor };
  }

  async adminCreate(data: any, userId: number) {
    const content = await this.prisma.universityContent.create({
      data: {
        type: data.type,
        title: data.title,
        description: data.description,
        area: data.area || "",
        category: data.category || "",
        visibility: data.visibility || "PUBLICO",
        priority: data.priority || "normal",
        modality: data.modality || "presencial",
        status: data.status || "PENDING_REVIEW",
        categoryId: data.categoryId || null,
        areaId: data.areaId || null,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        deadline: data.deadline ? new Date(data.deadline) : null,
        location: data.location || null,
        cost: data.cost || null,
        schedule: data.schedule || null,
        sourceUrl: data.sourceUrl || null,
        officialUrl: data.officialUrl || null,
        contactEmail: data.contactEmail || null,
        contactPhone: data.contactPhone || null,
        capacity: data.capacity ? Number(data.capacity) : null,
        userId,
      },
    });

    await this.auditLog("CREATE", "UniversityContent", content.id, null, data, userId);
    return this.mapExtendedResponse(content);
  }

  async adminUpdate(id: number, data: any, userId: number) {
    const existing = await this.prisma.universityContent.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundException("Contenido no encontrado.");

    const updateData: any = {};
    const fields = ["type", "title", "description", "area", "category", "visibility", "priority", "modality", "status", "location", "cost", "schedule", "sourceUrl", "officialUrl", "contactEmail", "contactPhone", "timezone"];
    for (const f of fields) {
      if (data[f] !== undefined) updateData[f] = data[f];
    }
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
    if (data.areaId !== undefined) updateData.areaId = data.areaId;
    if (data.capacity !== undefined) updateData.capacity = Number(data.capacity);
    if (data.startDate !== undefined) updateData.startDate = data.startDate ? new Date(data.startDate) : null;
    if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null;
    if (data.deadline !== undefined) updateData.deadline = data.deadline ? new Date(data.deadline) : null;

    const updated = await this.prisma.universityContent.update({
      where: { id },
      data: updateData,
    });

    await this.auditLog("UPDATE", "UniversityContent", id, existing, data, userId);
    return this.mapExtendedResponse(updated);
  }

  async adminPublish(id: number, userId: number) {
    const content = await this.prisma.universityContent.findFirst({ where: { id, deletedAt: null } });
    if (!content) throw new NotFoundException("Contenido no encontrado.");
    const updated = await this.prisma.universityContent.update({
      where: { id },
      data: { status: "PUBLISHED" },
    });
    await this.auditLog("PUBLISH", "UniversityContent", id, content, updated, userId);
    return this.mapExtendedResponse(updated);
  }

  async adminArchive(id: number, userId: number) {
    const content = await this.prisma.universityContent.findFirst({ where: { id, deletedAt: null } });
    if (!content) throw new NotFoundException("Contenido no encontrado.");
    const updated = await this.prisma.universityContent.update({
      where: { id },
      data: { status: "HIDDEN" },
    });
    await this.auditLog("ARCHIVE", "UniversityContent", id, content, updated, userId);
    return this.mapExtendedResponse(updated);
  }

  async adminCancel(id: number, userId: number) {
    const content = await this.prisma.universityContent.findFirst({ where: { id, deletedAt: null } });
    if (!content) throw new NotFoundException("Contenido no encontrado.");
    const updated = await this.prisma.universityContent.update({
      where: { id },
      data: { status: "DELETED", deletedAt: new Date() },
    });
    await this.auditLog("CANCEL", "UniversityContent", id, content, updated, userId);
    return this.mapExtendedResponse(updated);
  }

  async adminDuplicate(id: number, userId: number) {
    const original = await this.prisma.universityContent.findFirst({ where: { id, deletedAt: null } });
    if (!original) throw new NotFoundException("Contenido no encontrado.");
    const duplicated = await this.prisma.universityContent.create({
      data: {
        type: original.type,
        title: `${original.title} (copia)`,
        description: original.description,
        area: original.area,
        category: original.category,
        visibility: original.visibility,
        priority: original.priority || "normal",
        modality: original.modality || "presencial",
        status: "PENDING_REVIEW",
        categoryId: original.categoryId,
        areaId: original.areaId,
        location: original.location,
        cost: original.cost,
        schedule: original.schedule,
        userId,
      },
    });
    await this.auditLog("DUPLICATE", "UniversityContent", duplicated.id, null, { originalId: id }, userId);
    return this.mapExtendedResponse(duplicated);
  }

  async getSuggestions(status?: string) {
    const where: any = {};
    if (status) where.status = status;
    return this.prisma.universitySuggestion.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { id: true, email: true, profile: { select: { firstName: true, lastName: true } } } } },
    });
  }

  async approveSuggestion(id: number, userId: number) {
    const suggestion = await this.prisma.universitySuggestion.findUnique({ where: { id } });
    if (!suggestion) throw new NotFoundException("Sugerencia no encontrada.");
    const updated = await this.prisma.universitySuggestion.update({
      where: { id },
      data: { status: "APPROVED" },
    });
    await this.auditLog("APPROVE_SUGGESTION", "UniversitySuggestion", id, suggestion, updated, userId);
    return { message: "Sugerencia aprobada." };
  }

  async rejectSuggestion(id: number, userId: number) {
    const suggestion = await this.prisma.universitySuggestion.findUnique({ where: { id } });
    if (!suggestion) throw new NotFoundException("Sugerencia no encontrada.");
    const updated = await this.prisma.universitySuggestion.update({
      where: { id },
      data: { status: "REJECTED" },
    });
    await this.auditLog("REJECT_SUGGESTION", "UniversitySuggestion", id, suggestion, updated, userId);
    return { message: "Sugerencia rechazada." };
  }

  async getReports() {
    return this.prisma.report.findMany({
      where: { status: "OPEN" },
      orderBy: { createdAt: "desc" },
      include: { reporter: { select: { id: true, email: true } } },
    });
  }

  async resolveReport(id: number, userId: number) {
    const report = await this.prisma.report.findUnique({ where: { id } });
    if (!report) throw new NotFoundException("Reporte no encontrado.");
    const updated = await this.prisma.report.update({
      where: { id },
      data: { status: "RESOLVED", moderatedById: userId, moderatedAt: new Date() },
    });
    await this.auditLog("RESOLVE_REPORT", "Report", id, report, updated, userId);
    return { message: "Reporte resuelto." };
  }

  async getAuditLogs() {
    return this.prisma.universityAuditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { user: { select: { id: true, email: true } } },
    });
  }

  private async auditLog(action: string, entityType: string, entityId: number, before: any, after: any, userId: number) {
    await this.prisma.universityAuditLog.create({
      data: {
        action,
        entityType,
        entityId,
        before: before ? JSON.parse(JSON.stringify(before)) : null,
        after: after ? JSON.parse(JSON.stringify(after)) : null,
        userId,
      },
    }).catch(() => {});
  }

  private mapExtendedResponse(item: any) {
    return {
      id: item.id,
      type: item.type,
      title: item.title,
      description: item.description,
      area: item.area,
      category: item.category,
      visibility: item.visibility,
      priority: item.priority ?? "normal",
      modality: item.modality ?? "presencial",
      statusTags: item.statusTags,
      startDate: item.startDate?.toISOString() ?? null,
      endDate: item.endDate?.toISOString() ?? null,
      deadline: item.deadline?.toISOString() ?? null,
      time: item.time ?? null,
      location: item.location ?? null,
      cost: item.cost ?? null,
      icon: item.icon ?? null,
      steps: item.steps,
      documents: item.documents,
      schedule: item.schedule ?? null,
      warning: item.warning ?? null,
      sourceUrl: item.sourceUrl ?? null,
      officialUrl: item.officialUrl ?? null,
      contactEmail: item.contactEmail ?? null,
      contactPhone: item.contactPhone ?? null,
      capacity: item.capacity ?? null,
      timezone: item.timezone ?? "America/Lima",
      fileUrl: item.fileUrl ?? null,
      fileName: item.fileName ?? null,
      fileType: item.fileType ?? null,
      fileSize: item.fileSize ?? null,
      externalUrl: item.externalUrl ?? null,
      views: item.views,
      savesCount: item.savesCount,
      createdAt: item.createdAt?.toISOString?.() ?? item.createdAt,
      categoryRel: item.categoryRel ? { id: item.categoryRel.id, name: item.categoryRel.name, slug: item.categoryRel.slug, icon: item.categoryRel.icon, color: item.categoryRel.color } : null,
      areaRel: item.areaRel ? { id: item.areaRel.id, name: item.areaRel.name, slug: item.areaRel.slug, icon: item.areaRel.icon, contactEmail: item.areaRel.contactEmail } : null,
    };
  }
}
