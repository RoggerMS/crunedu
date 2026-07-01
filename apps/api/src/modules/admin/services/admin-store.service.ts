import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ProductStatus } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { HotReadCacheService } from "../../cache/hot-read-cache.service";
import { AdminAuditService } from "./admin-audit.service";
import { AdminPlacementsService } from "./admin-placements.service";

export interface ProductFilters {
  search?: string;
  status?: ProductStatus;
  categoryId?: number;
  isFeatured?: boolean;
  cursor?: number;
  limit?: number;
}

@Injectable()
export class AdminStoreService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: HotReadCacheService,
    private readonly audit: AdminAuditService,
    private readonly placements: AdminPlacementsService,
  ) {}

  async listProducts(filters: ProductFilters) {
    const limit = Math.min(filters.limit ?? 25, 50);
    const where: Record<string, unknown> = {};
    if (filters.status) where.status = filters.status;
    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.isFeatured !== undefined) where.isFeatured = filters.isFeatured;
    if (filters.search) where.OR = [
      { title: { contains: filters.search, mode: "insensitive" } },
      { description: { contains: filters.search, mode: "insensitive" } },
    ];

    const products = await this.prisma.product.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      ...(filters.cursor ? { cursor: { id: filters.cursor }, skip: 1 } : {}),
      select: {
        id: true, title: true, status: true, type: true, price: true, stock: true, isFeatured: true,
        createdAt: true, publishedAt: true,
        category: { select: { id: true, name: true } },
        admin: { select: { id: true, email: true } },
        _count: { select: { favorites: true, inquiries: true, reports: true, images: true } },
      },
    });

    const hasMore = products.length > limit;
    const slice = products.slice(0, limit);
    return {
      items: slice.map((p) => ({
        ...p,
        favoritesCount: p._count.favorites,
        inquiriesCount: p._count.inquiries,
        reportsCount: p._count.reports,
        imagesCount: p._count.images,
      })),
      nextCursor: hasMore ? slice[slice.length - 1].id : null,
    };
  }

  async listCategories() {
    const categories = await this.prisma.productCategory.findMany({
      orderBy: [{ name: "asc" }],
      select: { id: true, name: true, _count: { select: { products: true } } },
    });
    return { items: categories.map((c) => ({ id: c.id, name: c.name, productsCount: c._count.products })) };
  }

  async listInquiries(filters: { status?: string; cursor?: number; limit?: number } = {}) {
    const limit = Math.min(filters.limit ?? 25, 50);
    const where: Record<string, unknown> = {};
    if (filters.status) where.status = filters.status;
    const items = await this.prisma.productInquiry.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      ...(filters.cursor ? { cursor: { id: filters.cursor }, skip: 1 } : {}),
      select: {
        id: true, status: true, message: true, preferredContactMethod: true, createdAt: true,
        contactName: true,
        product: { select: { id: true, title: true } },
        user: { select: { id: true, email: true } },
      },
    });
    const hasMore = items.length > limit;
    const slice = items.slice(0, limit);
    return { items: slice, nextCursor: hasMore ? slice[slice.length - 1].id : null };
  }

  async listReports() {
    const items = await this.prisma.report.findMany({
      where: { productId: { not: null } },
      orderBy: [{ createdAt: "desc" }],
      take: 100,
      select: {
        id: true, reason: true, description: true, status: true, createdAt: true,
        product: { select: { id: true, title: true } },
        reporter: { select: { id: true, email: true } },
      },
    });
    return { items };
  }

  async setProductStatus(productId: number, status: ProductStatus, adminId: number, reason: string) {
    const product = await this.prisma.product.findUnique({ where: { id: productId }, select: { id: true, status: true } });
    if (!product) throw new NotFoundException("Producto no encontrado.");
    await this.prisma.product.update({ where: { id: productId }, data: { status, publishedAt: status === ProductStatus.ACTIVE ? new Date() : undefined } });
    await this.audit.record(adminId, "PRODUCT_STATUS", "store", { targetType: "Product", targetId: productId, reason, safeBefore: { status: product.status }, safeAfter: { status } });
    return { message: `Estado actualizado a ${status}.` };
  }

  async setProductFeatured(productId: number, featured: boolean, position: number, adminId: number) {
    const product = await this.prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
    if (!product) throw new NotFoundException("Producto no encontrado.");
    await this.prisma.product.update({ where: { id: productId }, data: { isFeatured: featured } });
    if (featured) {
      await this.placements.upsert({ area: "STORE_FEATURED", entityType: "PRODUCT", entityId: productId, position, adminId });
    } else {
      await this.placements.deactivate("STORE_FEATURED", "PRODUCT", productId, adminId);
    }
    await this.audit.record(adminId, featured ? "PRODUCT_FEATURE" : "PRODUCT_UNFEATURE", "store", { targetType: "Product", targetId: productId });
    return { message: featured ? "Producto destacado." : "Destacado retirado." };
  }

  async setInquiryStatus(inquiryId: number, status: string, adminId: number) {
    const valid = ["PENDING", "CONTACTED", "RESOLVED", "CANCELLED"];
    if (!valid.includes(status)) throw new BadRequestException("Estado de consulta inválido.");
    const inquiry = await this.prisma.productInquiry.findUnique({ where: { id: inquiryId }, select: { id: true } });
    if (!inquiry) throw new NotFoundException("Consulta no encontrada.");
    await this.prisma.productInquiry.update({ where: { id: inquiryId }, data: { status: status as never } });
    await this.audit.record(adminId, "INQUIRY_STATUS", "store", { targetType: "ProductInquiry", targetId: inquiryId, safeAfter: { status } });
    return { message: "Estado de consulta actualizado." };
  }

  async metrics() {
    const [views, contactClicks, saves, inquiries, products, favorites] = await Promise.all([
      this.prisma.product.aggregate({ _sum: { viewCount: true } }),
      this.prisma.product.aggregate({ _sum: { contactClickCount: true } }),
      this.prisma.savedDocument.count(),
      this.prisma.productInquiry.groupBy({ by: ["status"], _count: { _all: true } }),
      this.prisma.product.count({ where: { status: ProductStatus.ACTIVE } }),
      this.prisma.productFavorite.count(),
    ]);
    return {
      totals: { views: views._sum.viewCount ?? 0, contactClicks: contactClicks._sum.contactClickCount ?? 0, saves, favorites },
      inquirySummary: {
        total: inquiries.reduce((acc, i) => acc + i._count._all, 0),
        byStatus: Object.fromEntries(inquiries.map((i) => [i.status, i._count._all])),
      },
      activeProducts: products,
    };
  }
}
