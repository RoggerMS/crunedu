import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateSuggestionDto } from "./dto/create-suggestion.dto";
import { UniversityQueryDto } from "./dto/university-query.dto";
import { Prisma } from "@prisma/client";

@Injectable()
export class UniversityService {
  constructor(private readonly prisma: PrismaService) {}

  async index(query: UniversityQueryDto) {
    const where: Prisma.UniversityContentWhereInput = {
      status: "PUBLISHED",
    };

    const validTypes = new Set(["EVENTO", "CONVOCATORIA", "TRAMITE", "SERVICIO", "GUIA", "AVISO"]);
    if (query.type && validTypes.has(query.type)) {
      (where as any).type = query.type;
    }
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
    });

    const nextCursor = items.length > safeLimit ? items[safeLimit].id : null;

    return {
      items: items.slice(0, safeLimit).map((item) => this.mapResponse(item)),
      nextCursor,
    };
  }

  async findOne(id: number) {
    const item = await this.prisma.universityContent.findFirst({
      where: { id, status: "PUBLISHED" },
    });
    if (!item) throw new NotFoundException("Contenido universitario no encontrado.");
    return this.mapResponse(item);
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
    return {
      id: suggestion.id,
      message: "Tu sugerencia fue enviada para revisión.",
    };
  }

  private mapResponse(item: any) {
    return {
      id: item.id,
      type: item.type,
      title: item.title,
      description: item.description,
      area: item.area,
      category: item.category,
      visibility: item.visibility,
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
      fileUrl: item.fileUrl ?? null,
      fileName: item.fileName ?? null,
      fileType: item.fileType ?? null,
      fileSize: item.fileSize ?? null,
      externalUrl: item.externalUrl ?? null,
      views: item.views,
      savesCount: item.savesCount,
      createdAt: item.createdAt.toISOString(),
    };
  }
}
