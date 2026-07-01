import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ContentPlacementArea, ContentPlacementStatus } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { AdminAuditService } from "./admin-audit.service";

export interface UpsertPlacementInput {
  area: ContentPlacementArea;
  entityType: string;
  entityId: number;
  position?: number;
  slot?: string;
  startsAt?: Date;
  endsAt?: Date;
  adminId: number;
}

@Injectable()
export class AdminPlacementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AdminAuditService,
  ) {}

  async upsert(input: UpsertPlacementInput) {
    const existing = await this.prisma.contentPlacement.findUnique({
      where: {
        area_entityType_entityId: {
          area: input.area,
          entityType: input.entityType,
          entityId: input.entityId,
        },
      },
    });

    if (existing) {
      return this.prisma.contentPlacement.update({
        where: { id: existing.id },
        data: {
          position: input.position ?? existing.position,
          slot: input.slot ?? existing.slot,
          status: ContentPlacementStatus.ACTIVE,
          startsAt: input.startsAt ?? existing.startsAt,
          endsAt: input.endsAt ?? existing.endsAt,
        },
      });
    }

    return this.prisma.contentPlacement.create({
      data: {
        area: input.area,
        entityType: input.entityType,
        entityId: input.entityId,
        position: input.position ?? 0,
        slot: input.slot,
        status: ContentPlacementStatus.ACTIVE,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        createdById: input.adminId,
      },
    });
  }

  async listByArea(area: ContentPlacementArea) {
    const items = await this.prisma.contentPlacement.findMany({
      where: { area, status: ContentPlacementStatus.ACTIVE },
      orderBy: [{ position: "asc" }, { id: "asc" }],
    });
    return { items };
  }

  async listAll(area?: ContentPlacementArea) {
    const items = await this.prisma.contentPlacement.findMany({
      where: area ? { area } : {},
      orderBy: [{ area: "asc" }, { position: "asc" }, { id: "asc" }],
      take: 100,
    });
    return { items };
  }

  async reorder(area: ContentPlacementArea, orderedIds: number[], adminId: number) {
    if (orderedIds.length > 50) throw new BadRequestException("Máximo 50 ubicaciones por reorden.");
    await this.prisma.$transaction(
      orderedIds.map((id, index) =>
        this.prisma.contentPlacement.update({ where: { id }, data: { position: index } }),
      ),
    );
    await this.audit.record(adminId, "PLACEMENT_REORDER", "placements", {
      targetType: "ContentPlacement",
      safeAfter: { area, count: orderedIds.length },
    });
    return { reordered: orderedIds.length };
  }

  async deactivate(area: ContentPlacementArea, entityType: string, entityId: number, adminId: number) {
    const placement = await this.prisma.contentPlacement.findUnique({
      where: { area_entityType_entityId: { area, entityType, entityId } },
    });
    if (!placement) return { deactivated: false };
    await this.prisma.contentPlacement.update({
      where: { id: placement.id },
      data: { status: ContentPlacementStatus.ARCHIVED },
    });
    await this.audit.record(adminId, "PLACEMENT_DEACTIVATE", "placements", {
      targetType: "ContentPlacement",
      targetId: placement.id,
    });
    return { deactivated: true };
  }

  async remove(id: number, adminId: number) {
    const placement = await this.prisma.contentPlacement.findUnique({ where: { id } });
    if (!placement) throw new NotFoundException("Ubicación no encontrada.");
    await this.prisma.contentPlacement.update({ where: { id }, data: { status: ContentPlacementStatus.ARCHIVED } });
    await this.audit.record(adminId, "PLACEMENT_REMOVE", "placements", { targetType: "ContentPlacement", targetId: id });
    return { archived: true };
  }
}
