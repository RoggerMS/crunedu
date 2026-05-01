import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateDocumentDto } from "./dto/create-document.dto";
import { GetDocumentsQueryDto } from "./dto/get-documents-query.dto";

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  async index(query: GetDocumentsQueryDto) {
    const items = await this.prisma.document.findMany({
      where: {
        status: "PUBLISHED",
        ...(query.course ? { course: { equals: query.course.trim(), mode: "insensitive" } } : {}),
        ...(query.cycle ? { cycle: { equals: query.cycle.trim(), mode: "insensitive" } } : {}),
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: {
        id: true,
        title: true,
        description: true,
        course: true,
        cycle: true,
        fileUrl: true,
        createdAt: true,
        user: { select: { id: true, email: true, profile: { select: { firstName: true, lastName: true } } } },
      },
      take: 60,
    });

    return items.map((item: (typeof items)[number]) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      course: item.course,
      cycle: item.cycle,
      fileUrl: item.fileUrl,
      createdAt: item.createdAt,
      author: { id: item.user.id, email: item.user.email, firstName: item.user.profile?.firstName ?? null, lastName: item.user.profile?.lastName ?? null },
    }));
  }

  async create(dto: CreateDocumentDto, userId?: number) {
    if (!userId) throw new UnauthorizedException("Inicia sesión para publicar apuntes.");
    const fileUrl = dto.fileUrl.trim();
    if (!fileUrl.startsWith("http://") && !fileUrl.startsWith("https://")) {
      throw new BadRequestException("Debes ingresar una URL válida para el archivo.");
    }

    const created = await this.prisma.document.create({
      data: {
        title: dto.title.trim(),
        description: dto.description.trim(),
        course: dto.course.trim(),
        cycle: dto.cycle?.trim() || null,
        fileUrl,
        storageKey: `external/${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        fileType: "url",
        sizeBytes: 0,
        communityId: dto.communityId,
        userId,
      },
      select: { id: true, title: true, description: true, course: true, cycle: true, fileUrl: true, createdAt: true },
    });

    return created;
  }
}
