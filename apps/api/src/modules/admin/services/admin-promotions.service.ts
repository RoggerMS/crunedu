import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PromotionPlacement, PromotionStatus } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { StorageService } from "../../storage/storage.service";
import { AdminAuditService } from "./admin-audit.service";

export interface CreatePromotionInput {
  title: string;
  description?: string;
  destinationUrl?: string;
  placement?: PromotionPlacement;
  priority?: number;
  startsAt?: Date;
  endsAt?: Date;
}

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

@Injectable()
export class AdminPromotionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly audit: AdminAuditService,
  ) {}

  async list(filters: { status?: PromotionStatus; placement?: PromotionPlacement } = {}) {
    const items = await this.prisma.promotion.findMany({
      where: {
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.placement ? { placement: filters.placement } : {}),
      },
      orderBy: [{ status: "asc" }, { priority: "desc" }, { createdAt: "desc" }],
      take: 100,
      select: {
        id: true,
        title: true,
        description: true,
        imageUrl: true,
        destinationUrl: true,
        placement: true,
        status: true,
        priority: true,
        startsAt: true,
        endsAt: true,
        impressions: true,
        clicks: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return { items };
  }

  async getActiveForPlacement(placement: PromotionPlacement) {
    const now = new Date();
    const items = await this.prisma.promotion.findMany({
      where: {
        placement,
        status: PromotionStatus.ACTIVE,
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
        ],
      },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      take: 3,
      select: {
        id: true,
        title: true,
        description: true,
        imageUrl: true,
        destinationUrl: true,
        placement: true,
        priority: true,
      },
    });
    return { items };
  }

  async create(input: CreatePromotionInput, file: any, adminId: number) {
    this.validateDestinationUrl(input.destinationUrl);
    let imageUrl: string | null = null;
    let imageStorageKey: string | null = null;

    if (file) {
      const upload = await this.uploadImage(file);
      imageUrl = upload.imageUrl;
      imageStorageKey = upload.storageKey;
    }

    const promotion = await this.prisma.promotion.create({
      data: {
        title: input.title.trim(),
        description: input.description?.trim() || null,
        destinationUrl: input.destinationUrl?.trim() || null,
        placement: input.placement ?? PromotionPlacement.FEED_RIGHT_SIDEBAR,
        status: PromotionStatus.DRAFT,
        priority: input.priority ?? 0,
        startsAt: input.startsAt ?? null,
        endsAt: input.endsAt ?? null,
        imageUrl,
        imageStorageKey,
        createdById: adminId,
      },
    });

    await this.audit.record(adminId, "PROMOTION_CREATE", "promotions", {
      targetType: "Promotion",
      targetId: promotion.id,
      safeAfter: { title: promotion.title, placement: promotion.placement },
    });

    return promotion;
  }

  async update(id: number, patch: Partial<CreatePromotionInput & { status: PromotionStatus }>, adminId: number) {
    const promotion = await this.prisma.promotion.findUnique({ where: { id } });
    if (!promotion) throw new NotFoundException("Promoción no encontrada.");
    if (patch.destinationUrl !== undefined) this.validateDestinationUrl(patch.destinationUrl);

    const updated = await this.prisma.promotion.update({
      where: { id },
      data: {
        ...(patch.title !== undefined ? { title: patch.title.trim() } : {}),
        ...(patch.description !== undefined ? { description: patch.description.trim() || null } : {}),
        ...(patch.destinationUrl !== undefined ? { destinationUrl: patch.destinationUrl.trim() || null } : {}),
        ...(patch.placement !== undefined ? { placement: patch.placement } : {}),
        ...(patch.priority !== undefined ? { priority: patch.priority } : {}),
        ...(patch.startsAt !== undefined ? { startsAt: patch.startsAt } : {}),
        ...(patch.endsAt !== undefined ? { endsAt: patch.endsAt } : {}),
        ...(patch.status !== undefined ? { status: patch.status } : {}),
      },
    });

    await this.audit.record(adminId, "PROMOTION_UPDATE", "promotions", {
      targetType: "Promotion",
      targetId: id,
      safeAfter: { status: updated.status, placement: updated.placement },
    });

    return updated;
  }

  async setStatus(id: number, status: PromotionStatus, adminId: number) {
    return this.update(id, { status }, adminId);
  }

  async recordImpression(id: number) {
    await this.prisma.promotion.update({ where: { id }, data: { impressions: { increment: 1 } } });
    return { ok: true };
  }

  async recordClick(id: number) {
    await this.prisma.promotion.update({ where: { id }, data: { clicks: { increment: 1 } } });
    return { ok: true };
  }

  async uploadImage(file: any) {
    if (!file) throw new BadRequestException("Debes adjuntar una imagen.");
    if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) throw new BadRequestException("Formato no permitido. Solo JPG, PNG o WEBP.");
    if (file.size > MAX_IMAGE_BYTES) throw new BadRequestException("La imagen supera el límite de 3MB.");
    const ext = file.originalname.split(".").pop()?.toLowerCase() || "jpg";
    const result = await this.storage.upload("promotions", file.buffer, file.mimetype, ext);
    const filename = result.storageKey.split("/").pop() ?? result.storageKey;
    return { storageKey: result.storageKey, imageUrl: `/api/admin/promotions/images/${filename}` };
  }

  async serveImage(filename: string) {
    const storageKey = `promotions/${filename}`;
    try {
      const buffer = await this.storage.getObject(storageKey);
      const stat = await this.storage.statObject(storageKey);
      return { buffer, mimeType: stat.metaData["content-type"] ?? "image/jpeg" };
    } catch {
      throw new NotFoundException("Imagen no encontrada.");
    }
  }

  private validateDestinationUrl(url?: string) {
    if (!url) return;
    const trimmed = url.trim();
    const lower = trimmed.toLowerCase();
    if (lower.startsWith("javascript:") || lower.startsWith("data:")) {
      throw new BadRequestException("La URL de destino no es válida.");
    }
    if (!lower.startsWith("https://") && !lower.startsWith("/")) {
      throw new BadRequestException("La URL de destino debe ser HTTPS o una ruta interna.");
    }
  }
}
