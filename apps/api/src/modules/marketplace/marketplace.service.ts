import {
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ProductStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { PAGINATION_LIMITS } from "../common/pagination.constants";
import { CreateProductInquiryDto, CreateProductDto, UpdateProductDto } from "./dtos";

type CatalogContext = {
  faculty?: string;
  career?: string;
};

@Injectable()
export class MarketplaceService {
  constructor(private readonly prisma: PrismaService) {}

  async listCategories() {
    return this.prisma.productCategory.findMany({ orderBy: { name: "asc" } });
  }

  private buildContextFilter(context?: CatalogContext) {
    const normalizedFilters = Array.from(new Set([context?.career, context?.faculty]
      .map((value) => value?.trim())
      .filter((value): value is string => Boolean(value))));

    if (normalizedFilters.length === 0) {
      return undefined;
    }

    return {
      OR: [
        ...normalizedFilters.map((value) => ({ title: { contains: value, mode: "insensitive" as const } })),
        ...normalizedFilters.map((value) => ({ description: { contains: value, mode: "insensitive" as const } })),
        ...normalizedFilters.map((value) => ({ category: { name: { contains: value, mode: "insensitive" as const } } })),
      ],
    };
  }

  async listCatalog(categoryId?: number, context?: CatalogContext, cursor?: number, limit?: number) {
    const safeLimit = Number.isFinite(limit) && (limit as number) > 0 ? Math.min(Math.floor(limit as number), PAGINATION_LIMITS.marketplaceProducts.max) : PAGINATION_LIMITS.marketplaceProducts.default;
    const contextFilter = this.buildContextFilter(context);

    const products = await this.prisma.product.findMany({
      where: {
        status: "ACTIVE",
        ...(categoryId ? { categoryId } : {}),
        ...(contextFilter ? contextFilter : {}),
      },
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }, { id: "desc" }],
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: { category: true },
      take: safeLimit + 1,
    });

    const featuredProducts = await this.prisma.product.findMany({
      where: {
        status: "ACTIVE",
        isFeatured: true,
        ...(categoryId ? { categoryId } : {}),
        ...(contextFilter ? contextFilter : {}),
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      include: { category: true },
      take: PAGINATION_LIMITS.marketplaceFeaturedProducts.default,
    });
    const nextCursor = products.length > safeLimit ? products[safeLimit].id : null;

    return {
      items: products.slice(0, safeLimit),
      featuredProducts,
      nextCursor,
      context: {
        faculty: context?.faculty?.trim() ?? "",
        career: context?.career?.trim() ?? "",
      },
    };
  }

  async getProductDetail(id: number) {
    const product = await this.prisma.product.findFirst({
      where: { id, status: "ACTIVE" },
      include: { category: true, admin: { select: { id: true, email: true } } },
    });

    if (!product) throw new NotFoundException("Producto no encontrado.");

    await this.prisma.product.update({
      where: { id: product.id },
      data: { viewCount: { increment: 1 } },
    });

    return { ...product, viewCount: product.viewCount + 1 };
  }

  async createInquiry(userId: number, productId: number, body: CreateProductInquiryDto) {
    const product = await this.prisma.product.findFirst({ where: { id: productId, status: "ACTIVE" } });
    if (!product) throw new NotFoundException("Producto no disponible.");

    await this.prisma.product.update({ where: { id: productId }, data: { contactClickCount: { increment: 1 } } });

    return this.prisma.productInquiry.create({
      data: {
        productId,
        userId,
        contactName: body.contactName,
        contactPhone: body.contactPhone,
        message: body.message,
        preferredContactMethod: body.preferredContactMethod,
      },
    });
  }

  async adminListInquiries(cursor?: number, limit?: number) {
    const safeLimit = Number.isFinite(limit) && (limit as number) > 0 ? Math.min(Math.floor(limit as number), PAGINATION_LIMITS.marketplaceInquiries.max) : PAGINATION_LIMITS.marketplaceInquiries.default;
    const items = await this.prisma.productInquiry.findMany({
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      take: safeLimit + 1,
      include: {
        product: { select: { id: true, title: true } },
        user: { select: { id: true, email: true } },
      },
    });
    const nextCursor = items.length > safeLimit ? items[safeLimit].id : null;
    return { items: items.slice(0, safeLimit), nextCursor };
  }

  async adminUpsertProduct(user: { sub: number; role: string }, payload: CreateProductDto | UpdateProductDto) {
    const isUpdate = "id" in payload && payload.id;

    if (isUpdate) {
      return this.prisma.product.update({
        where: { id: payload.id },
        data: {
          title: payload.title,
          description: payload.description,
          price: payload.price,
          categoryId: payload.categoryId,
          status: payload.status ?? ProductStatus.ACTIVE,
          isFeatured: Boolean(payload.isFeatured),
          stock: payload.stock ?? 1,
          contactMethod: payload.contactMethod ?? "whatsapp",
          whatsappMessage: payload.whatsappMessage ?? null,
        },
      });
    }

    return this.prisma.product.create({
      data: {
        title: payload.title,
        description: payload.description,
        price: payload.price,
        categoryId: payload.categoryId,
        status: payload.status ?? ProductStatus.ACTIVE,
        isFeatured: Boolean(payload.isFeatured),
        stock: payload.stock ?? 1,
        createdBy: user.sub,
        contactMethod: payload.contactMethod ?? "whatsapp",
        whatsappMessage: payload.whatsappMessage ?? null,
      },
    });
  }

  async getConversionMetrics() {
    const [products, inquiriesByStatus] = await Promise.all([
      this.prisma.product.findMany({
        select: { id: true, title: true, viewCount: true, contactClickCount: true },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.productInquiry.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
    ]);

    const inquiriesMap: Record<string, number> = {};
    for (const row of inquiriesByStatus as Array<{ status: string; _count: { _all: number } }>) {
      inquiriesMap[row.status] = row._count._all;
    }

    return {
      products,
      inquirySummary: {
        total: Object.values(inquiriesMap).reduce((sum, value) => sum + value, 0),
        completed: inquiriesMap["CLOSED"] ?? 0,
      },
    };
  }
}
