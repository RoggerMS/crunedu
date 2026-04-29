import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class MarketplaceService {
  constructor(private readonly prisma: PrismaService) {}

  async listCategories() {
    return this.prisma.productCategory.findMany({ orderBy: { name: "asc" } });
  }

  async listCatalog(communityId?: number) {
    return this.prisma.product.findMany({
      where: {
        status: "ACTIVE",
        ...(communityId ? { categoryId: communityId } : {}),
      },
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      include: { category: true },
    });
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

  async createInquiry(userId: number, productId: number, body: any) {
    const product = await this.prisma.product.findFirst({ where: { id: productId, status: "ACTIVE" } });
    if (!product) throw new NotFoundException("Producto no disponible.");
    if (!body?.contactName || !body?.contactPhone || !body?.message || !body?.preferredContactMethod) {
      throw new BadRequestException("Faltan campos obligatorios para la consulta.");
    }

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

  async adminListInquiries() {
    return this.prisma.productInquiry.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        product: { select: { id: true, title: true } },
        user: { select: { id: true, email: true } },
      },
    });
  }

  async adminUpsertProduct(user: { sub: number; role: string }, payload: any) {
    if (user.role !== "ADMIN") {
      throw new ForbiddenException("Solo administradores pueden gestionar productos.");
    }

    if (payload.id) {
      return this.prisma.product.update({
        where: { id: payload.id },
        data: {
          title: payload.title,
          description: payload.description,
          price: payload.price,
          categoryId: payload.categoryId,
          status: payload.status,
          isFeatured: Boolean(payload.isFeatured),
          stock: payload.stock,
          contactMethod: payload.contactMethod ?? "whatsapp",
        },
      });
    }

    return this.prisma.product.create({
      data: {
        title: payload.title,
        description: payload.description,
        price: payload.price,
        categoryId: payload.categoryId,
        status: payload.status ?? "ACTIVE",
        isFeatured: Boolean(payload.isFeatured),
        stock: payload.stock ?? 1,
        createdBy: user.sub,
        contactMethod: payload.contactMethod ?? "whatsapp",
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
