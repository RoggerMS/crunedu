import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { PAGINATION_LIMITS } from "../common/pagination.constants";
import { Prisma } from "@prisma/client";
import {
  CreateProductDto,
  UpdateProductDto,
  CreateProductInquiryDto,
  CreateProductReportDto,
  GetCatalogQueryDto,
  CATALOG_SORTS,
} from "./dtos";

const MAX_PRODUCT_DESCRIPTION = 3000;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_IMAGES_PER_PRODUCT = 6;

const productListSelect = {
  id: true,
  title: true,
  description: true,
  price: true,
  currency: true,
  type: true,
  priceType: true,
  isNegotiable: true,
  condition: true,
  status: true,
  deliveryType: true,
  campus: true,
  course: true,
  brand: true,
  model: true,
  quantity: true,
  isFeatured: true,
  viewCount: true,
  favoriteCount: true,
  publishedAt: true,
  createdAt: true,
  category: { select: { id: true, name: true, slug: true, description: true, icon: true } },
  admin: { select: { id: true, email: true, profile: { select: { firstName: true, lastName: true, avatarUrl: true } } } },
  images: { select: { id: true, imageUrl: true, mimeType: true, sizeBytes: true, position: true, isCover: true, altText: true }, orderBy: { position: "asc" as const } },
  safePoint: { select: { id: true, name: true } },
  _count: { select: { favorites: true, inquiries: true } },
};

type ProductListItem = any;

const mapProductListItem = (product: ProductListItem, viewerUserId?: number) => {
  const sellerRecord = product.admin;
  const seller = {
    id: sellerRecord?.id ? String(sellerRecord.id) : "crunedu",
    name: sellerRecord?.profile?.firstName
      ? `${sellerRecord.profile.firstName} ${sellerRecord.profile.lastName ?? ""}`.trim()
      : sellerRecord?.email ?? "CrunEdu",
    avatarUrl: sellerRecord?.profile?.avatarUrl ?? null,
    rating: null,
    verified: sellerRecord?.role === "ADMIN",
    sales: 0,
  };

  return {
    id: String(product.id),
    type: product.type?.toLowerCase() ?? "sale",
    title: product.title,
    description: product.description,
    price: product.price ? Number(product.price) : null,
    currency: product.currency ?? "PEN",
    priceType: product.priceType?.toLowerCase() ?? "fixed",
    isNegotiable: Boolean(product.isNegotiable),
    condition: product.condition?.toLowerCase() ?? null,
    status: product.status?.toLowerCase() ?? "available",
    deliveryType: product.deliveryType?.toLowerCase() ?? "campus",
    campus: product.campus ?? null,
    course: product.course ?? null,
    brand: product.brand ?? null,
    model: product.model ?? null,
    quantity: product.quantity ?? 1,
    isFeatured: Boolean(product.isFeatured),
    category: {
      id: product.category.id,
      slug: product.category.slug,
      name: product.category.name,
      icon: product.category.icon ?? null,
    },
    images: product.images ?? [],
    seller,
    safePoint: product.safePoint ?? null,
    location: product.campus ?? product.safePoint?.name ?? null,
    createdAt: product.createdAt?.toISOString() ?? new Date().toISOString(),
    publishedAt: product.publishedAt?.toISOString() ?? null,
    stats: {
      views: product.viewCount ?? 0,
      saves: product.favoriteCount ?? 0,
      contacts: product._count?.inquiries ?? 0,
    },
    viewerState: {
      saved: false,
      isMine: viewerUserId != null && product.admin?.id === viewerUserId,
      canEdit: viewerUserId != null && product.admin?.id === viewerUserId,
      canDelete: viewerUserId != null && product.admin?.id === viewerUserId,
      canReport: viewerUserId != null && product.admin?.id !== viewerUserId,
    },
  };
};

@Injectable()
export class MarketplaceService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly productRateLimit = new Map<number, number[]>();
  private readonly inquiryRateLimit = new Map<number, number[]>();
  private readonly reportRateLimit = new Map<number, number[]>();
  private readonly favoriteRateLimit = new Map<number, number[]>();

  private checkRateLimit(
    bucket: Map<number, number[]>,
    userId: number,
    maxEvents: number,
    windowMs: number,
    message: string,
  ) {
    const now = Date.now();
    const windowStart = now - windowMs;
    const timestamps = (bucket.get(userId) ?? []).filter((ts) => ts >= windowStart);
    if (timestamps.length >= maxEvents) {
      throw new HttpException(message, HttpStatus.TOO_MANY_REQUESTS);
    }
    timestamps.push(now);
    bucket.set(userId, timestamps);
  }

  async listCategories() {
    return this.prisma.productCategory.findMany({
      where: { isActive: true },
      orderBy: [{ order: "asc" }, { name: "asc" }],
      select: { id: true, name: true, slug: true, description: true, icon: true },
    });
  }

  async listSafePoints() {
    return this.prisma.productSafePoint.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });
  }

  async listCatalog(query: GetCatalogQueryDto, viewerUserId?: number) {
    const safeLimit = Math.min(query.limit ?? PAGINATION_LIMITS.marketplaceProducts.default, PAGINATION_LIMITS.marketplaceProducts.max);
    const sort = query.sort ?? "recent";

    const where: any = { status: "ACTIVE", deletedAt: null };

    if (query.q) {
      const search = query.q.trim();
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { course: { contains: search, mode: "insensitive" } },
        { brand: { contains: search, mode: "insensitive" } },
        { campus: { contains: search, mode: "insensitive" } },
      ];
    }

    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.categorySlug) where.category = { slug: query.categorySlug, isActive: true };
    if (query.type) where.type = query.type;
    if (query.deliveryType) where.deliveryType = query.deliveryType;
    if (query.condition) where.condition = query.condition;
    if (query.campus) where.campus = { contains: query.campus, mode: "insensitive" };
    if (query.safePointId) where.safePointId = query.safePointId;
    if (query.sellerId) where.createdBy = query.sellerId;
    if (query.mine && viewerUserId) where.createdBy = viewerUserId;

    if (query.priceMin !== undefined || query.priceMax !== undefined) {
      where.price = {};
      if (query.priceMin !== undefined) where.price.gte = query.priceMin;
      if (query.priceMax !== undefined) where.price.lte = query.priceMax;
    }

    if (query.saved && viewerUserId) {
      where.favorites = { some: { userId: viewerUserId } };
    }

    let orderBy: any[] = [];
    switch (sort) {
      case "low_price": orderBy = [{ price: "asc" }, { id: "desc" }]; break;
      case "high_price": orderBy = [{ price: "desc" }, { id: "desc" }]; break;
      case "most_viewed": orderBy = [{ viewCount: "desc" }, { id: "desc" }]; break;
      case "most_saved": orderBy = [{ favoriteCount: "desc" }, { id: "desc" }]; break;
      case "campus": orderBy = [{ createdAt: "desc" }, { id: "desc" }]; break;
      default: orderBy = [{ isFeatured: "desc" }, { createdAt: "desc" }, { id: "desc" }]; break;
    }

    const products = await this.prisma.product.findMany({
      where,
      orderBy,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      select: productListSelect,
      take: safeLimit + 1,
    });

    let featuredProducts: any[] = [];
    if (!query.q && !query.cursor && !query.campus && !query.sellerId && !query.safePointId && !query.mine && !query.saved) {
      featuredProducts = await this.prisma.product.findMany({
        where: { status: "ACTIVE", isFeatured: true, deletedAt: null },
        orderBy: { createdAt: "desc" },
        select: productListSelect,
        take: PAGINATION_LIMITS.marketplaceFeaturedProducts.default,
      });
    }

    const nextCursor = products.length > safeLimit ? products[safeLimit].id : null;
    const sliced = products.slice(0, safeLimit);

    let viewerFavorites = new Set<number>();
    if (viewerUserId && sliced.length > 0) {
      const favs = await this.prisma.productFavorite.findMany({
        where: { userId: viewerUserId, productId: { in: sliced.map((p: any) => p.id) } },
        select: { productId: true },
      });
      viewerFavorites = new Set(favs.map((f: any) => f.productId));
    }

    const items = sliced.map((p: any) => {
      const mapped = mapProductListItem(p, viewerUserId);
      if (viewerFavorites.has(p.id)) {
        mapped.viewerState.saved = true;
      }
      return mapped;
    });

    const mappedFeatured = featuredProducts.map((p: any) => mapProductListItem(p, viewerUserId));

    return {
      items,
      featuredProducts: mappedFeatured,
      nextCursor,
      filters: {
        q: query.q ?? null,
        categoryId: query.categoryId ?? null,
        categorySlug: query.categorySlug ?? null,
        type: query.type ?? null,
        deliveryType: query.deliveryType ?? null,
        condition: query.condition ?? null,
        sort,
      },
    };
  }

  async getProductDetail(id: number, viewerUserId?: number, viewerRole?: string) {
    const product = await this.prisma.product.findFirst({
      where: { id },
      include: {
        category: true,
        admin: { select: { id: true, email: true, role: true, profile: { select: { firstName: true, lastName: true, avatarUrl: true } } } },
        images: { orderBy: { position: "asc" } },
        safePoint: true,
        _count: { select: { favorites: true, inquiries: true } },
      },
    });

    if (!product || product.deletedAt) {
      throw new NotFoundException("Producto no encontrado.");
    }

    if (product.status !== "ACTIVE") {
      const isOwner = viewerUserId && product.createdBy === viewerUserId;
      const isAdmin = viewerRole === "ADMIN" || viewerRole === "MODERATOR";
      if (!isOwner && !isAdmin) {
        throw new NotFoundException("Producto no disponible.");
      }
    }

    const viewerFav = viewerUserId
      ? await this.prisma.productFavorite.findUnique({ where: { userId_productId: { userId: viewerUserId, productId: id } } })
      : null;

    await this.prisma.product.update({ where: { id }, data: { viewCount: { increment: 1 } } }).catch(() => {});

    const sellerRecord = product.admin;
    return {
      ...mapProductListItem({ ...product, viewCount: product.viewCount + 1 }, viewerUserId),
      category: {
        id: product.category.id,
        slug: product.category.slug,
        name: product.category.name,
        icon: product.category.icon ?? null,
        description: product.category.description ?? null,
      },
      seller: {
        id: sellerRecord?.id ? String(sellerRecord.id) : "crunedu",
        name: sellerRecord?.profile?.firstName
          ? `${sellerRecord.profile.firstName} ${sellerRecord.profile.lastName ?? ""}`.trim()
          : sellerRecord?.email ?? "CrunEdu",
        avatarUrl: sellerRecord?.profile?.avatarUrl ?? null,
        rating: null,
        verified: sellerRecord?.role === "ADMIN",
        sales: 0,
      },
      safePoint: product.safePoint ?? null,
      viewerState: {
        saved: !!viewerFav,
        isMine: viewerUserId != null && product.createdBy === viewerUserId,
        canEdit: viewerUserId != null && (product.createdBy === viewerUserId || viewerRole === "ADMIN" || viewerRole === "MODERATOR"),
        canDelete: viewerUserId != null && (product.createdBy === viewerUserId || viewerRole === "ADMIN" || viewerRole === "MODERATOR"),
        canReport: viewerUserId != null && product.createdBy !== viewerUserId,
      },
      viewCount: product.viewCount + 1,
    };
  }

  async createProduct(dto: CreateProductDto, userId: number) {
    this.checkRateLimit(this.productRateLimit, userId, 5, 60_000, "Estás publicando demasiado rápido. Espera un minuto.");

    const category = await this.prisma.productCategory.findUnique({ where: { id: dto.categoryId } });
    if (!category || !category.isActive) throw new BadRequestException("Categoría no disponible.");

    const isDraft = dto.status === "DRAFT";
    const status = isDraft ? "DRAFT" : "ACTIVE";
    const priceValue = dto.priceType === "FREE" || dto.priceType === "CONTACT" || dto.priceType === "EXCHANGE"
      ? null : (dto.price ?? null);

    const product = await this.prisma.product.create({
      data: {
        title: dto.title.trim(),
        description: dto.description.trim(),
        price: priceValue,
        currency: dto.currency ?? "PEN",
        categoryId: dto.categoryId,
        status,
        type: dto.type ?? "SALE",
        priceType: dto.priceType ?? "FIXED",
        isNegotiable: Boolean(dto.isNegotiable),
        condition: dto.condition ?? null,
        deliveryType: dto.deliveryType ?? "CAMPUS",
        campus: dto.campus?.trim() ?? null,
        district: dto.district?.trim() ?? null,
        safePointId: dto.safePointId ?? null,
        course: dto.course?.trim() ?? null,
        brand: dto.brand?.trim() ?? null,
        model: dto.model?.trim() ?? null,
        quantity: dto.quantity ?? 1,
        stock: dto.stock ?? 1,
        isFeatured: false,
        contactMethod: "chat",
        createdBy: userId,
        publishedAt: isDraft ? null : new Date(),
        images: dto.images?.length
          ? {
              create: dto.images.slice(0, MAX_IMAGES_PER_PRODUCT).map((img, index) => ({
                imageUrl: img.imageUrl,
                storageKey: img.storageKey,
                mimeType: img.mimeType ?? null,
                sizeBytes: img.sizeBytes ?? null,
                altText: img.altText?.trim() ?? null,
                isCover: img.isCover ?? (index === 0),
                position: index,
              })),
            }
          : undefined,
      },
      select: productListSelect,
    });

    return mapProductListItem(product, userId);
  }

  async updateProduct(id: number, dto: UpdateProductDto, userId: number, role: string) {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) throw new NotFoundException("Producto no encontrado.");
    if (existing.createdBy !== userId && role !== "ADMIN" && role !== "MODERATOR") {
      throw new ForbiddenException("No tienes permisos para editar este producto.");
    }

    if (dto.categoryId) {
      const category = await this.prisma.productCategory.findUnique({ where: { id: dto.categoryId } });
      if (!category || !category.isActive) throw new BadRequestException("Categoría no disponible.");
    }

    const priceValue = dto.priceType === "FREE" || dto.priceType === "CONTACT" || dto.priceType === "EXCHANGE"
      ? null : (dto.price ?? existing.price);

    const updated = await this.prisma.product.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.description !== undefined ? { description: dto.description.trim() } : {}),
        ...(dto.price !== undefined || dto.priceType !== undefined ? { price: priceValue } : {}),
        ...(dto.currency !== undefined ? { currency: dto.currency } : {}),
        ...(dto.categoryId !== undefined ? { categoryId: dto.categoryId } : {}),
        ...(dto.type !== undefined ? { type: dto.type } : {}),
        ...(dto.priceType !== undefined ? { priceType: dto.priceType } : {}),
        ...(dto.isNegotiable !== undefined ? { isNegotiable: dto.isNegotiable } : {}),
        ...(dto.condition !== undefined ? { condition: dto.condition } : {}),
        ...(dto.deliveryType !== undefined ? { deliveryType: dto.deliveryType } : {}),
        ...(dto.campus !== undefined ? { campus: dto.campus?.trim() ?? null } : {}),
        ...(dto.district !== undefined ? { district: dto.district?.trim() ?? null } : {}),
        ...(dto.safePointId !== undefined ? { safePointId: dto.safePointId } : {}),
        ...(dto.course !== undefined ? { course: dto.course?.trim() ?? null } : {}),
        ...(dto.brand !== undefined ? { brand: dto.brand?.trim() ?? null } : {}),
        ...(dto.model !== undefined ? { model: dto.model?.trim() ?? null } : {}),
        ...(dto.quantity !== undefined ? { quantity: dto.quantity } : {}),
        ...(dto.stock !== undefined ? { stock: dto.stock } : {}),
        ...(dto.campus !== undefined && dto.campus !== null ? { campus: dto.campus } : {}),
      },
      select: productListSelect,
    });

    return mapProductListItem(updated, userId);
  }

  async softDeleteProduct(id: number, userId: number, role: string) {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Producto no encontrado.");
    if (existing.createdBy !== userId && role !== "ADMIN" && role !== "MODERATOR") {
      throw new ForbiddenException("No tienes permisos para eliminar este producto.");
    }

    await this.prisma.product.update({
      where: { id },
      data: { status: "DELETED", deletedAt: new Date() },
    });

    return { message: "Producto eliminado." };
  }

  async publishProduct(id: number, userId: number, role: string) {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) throw new NotFoundException("Producto no encontrado.");
    if (existing.createdBy !== userId && role !== "ADMIN" && role !== "MODERATOR") {
      throw new ForbiddenException("No tienes permisos para publicar este producto.");
    }
    if (existing.status !== "DRAFT" && existing.status !== "HIDDEN") {
      throw new BadRequestException("Solo puedes publicar productos en borrador u ocultos.");
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data: { status: "ACTIVE", publishedAt: existing.publishedAt ?? new Date() },
      select: productListSelect,
    });

    return mapProductListItem(updated, userId);
  }

  async pauseProduct(id: number, userId: number, role: string) {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) throw new NotFoundException("Producto no encontrado.");
    if (existing.createdBy !== userId && role !== "ADMIN" && role !== "MODERATOR") {
      throw new ForbiddenException("No tienes permisos para pausar este producto.");
    }
    if (existing.status !== "ACTIVE") throw new BadRequestException("Solo puedes pausar productos activos.");

    const updated = await this.prisma.product.update({
      where: { id },
      data: { status: "HIDDEN" },
      select: productListSelect,
    });

    return mapProductListItem(updated, userId);
  }

  async markSold(id: number, userId: number, role: string) {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) throw new NotFoundException("Producto no encontrado.");
    if (existing.createdBy !== userId && role !== "ADMIN" && role !== "MODERATOR") {
      throw new ForbiddenException("No tienes permisos para marcar como vendido.");
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data: { status: "SOLD_OUT" },
      select: productListSelect,
    });

    return mapProductListItem(updated, userId);
  }

  async toggleFavorite(productId: number, userId: number) {
    this.checkRateLimit(this.favoriteRateLimit, userId, 20, 60_000, "Demasiadas acciones. Espera un minuto.");

    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product || product.deletedAt || product.status === "DELETED") {
      throw new NotFoundException("Producto no encontrado.");
    }

    const existing = await this.prisma.productFavorite.findUnique({
      where: { userId_productId: { userId, productId } },
    });

    if (existing) {
      await this.prisma.productFavorite.delete({ where: { id: existing.id } });
      await this.prisma.product.update({
        where: { id: productId },
        data: { favoriteCount: { decrement: 1 } },
      });
      return { saved: false, favoriteCount: Math.max(0, product.favoriteCount - 1) };
    }

    await this.prisma.productFavorite.create({ data: { userId, productId } });
    await this.prisma.product.update({
      where: { id: productId },
      data: { favoriteCount: { increment: 1 } },
    });
    return { saved: true, favoriteCount: product.favoriteCount + 1 };
  }

  async listMyFavorites(userId: number) {
    const favorites = await this.prisma.productFavorite.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { product: { select: productListSelect } },
    });

    return favorites
      .filter((f: any) => f.product && !f.product.deletedAt)
      .map((f: any) => {
        const mapped = mapProductListItem(f.product, userId);
        mapped.viewerState.saved = true;
        return mapped;
      });
  }

  async createReport(productId: number, dto: CreateProductReportDto, userId: number) {
    this.checkRateLimit(this.reportRateLimit, userId, 5, 180_000, "Reportas demasiado. Espera 3 minutos.");

    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product || product.deletedAt) throw new NotFoundException("Producto no encontrado.");

    if (product.createdBy === userId) {
      throw new BadRequestException("No puedes reportar tu propio producto.");
    }

    const recentReport = await this.prisma.report.findFirst({
      where: { reporterId: userId, productId, createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) } },
    });

    if (recentReport) {
      throw new HttpException("Ya reportaste este producto recientemente.", HttpStatus.TOO_MANY_REQUESTS);
    }

    return this.prisma.report.create({
      data: {
        reporterId: userId,
        reason: dto.reason,
        description: dto.description?.trim() ?? null,
        productId,
      },
    });
  }

  async createInquiry(productId: number, userId: number, body: CreateProductInquiryDto) {
    this.checkRateLimit(this.inquiryRateLimit, userId, 8, 60_000, "Demasiadas consultas. Espera un minuto.");

    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product || product.deletedAt || product.status !== "ACTIVE") {
      throw new NotFoundException("Producto no disponible.");
    }

    if (product.createdBy === userId) {
      throw new BadRequestException("No puedes consultar tu propio producto.");
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { profile: { select: { firstName: true, lastName: true } } },
    });

    const displayName = user?.profile?.firstName
      ? `${user.profile.firstName} ${user.profile.lastName ?? ""}`.trim()
      : null;

    await this.prisma.product.update({
      where: { id: productId },
      data: { contactClickCount: { increment: 1 } },
    });

    return this.prisma.productInquiry.create({
      data: {
        productId,
        userId,
        contactName: displayName ?? null,
        contactPhone: null,
        message: body.message.trim(),
        quickMessageType: body.quickMessageType ?? null,
        preferredContactMethod: body.preferredContactMethod ?? "chat",
      },
    });
  }

  async uploadImage(file: any) {
    if (!file) throw new BadRequestException("Debes adjuntar una imagen.");
    if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) throw new BadRequestException("Formato no permitido. Solo JPG, PNG o WEBP.");
    if (file.size > MAX_IMAGE_SIZE) throw new BadRequestException("La imagen supera el límite de 5MB.");

    const extension = file.originalname.split(".").pop()?.toLowerCase() || "jpg";
    const filename = `product-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
    const storageKey = `products/${filename}`;
    const targetDir = `${process.cwd()}/tmp/uploads/products`;

    await import("node:fs/promises").then((fs) => fs.mkdir(targetDir, { recursive: true }));
    await import("node:fs/promises").then((fs) => fs.writeFile(`${targetDir}/${filename}`, file.buffer));

    return { imageUrl: `/api/marketplace/products/images/${filename}`, storageKey, mimeType: file.mimetype, sizeBytes: file.size };
  }

  async addProductImages(productId: number, files: any[], userId: number) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { images: { select: { id: true } } },
    });
    if (!product || product.deletedAt) throw new NotFoundException("Producto no encontrado.");
    if (product.createdBy !== userId) throw new ForbiddenException("No tienes permisos.");

    const currentCount = product.images.length;
    const allowed = files.slice(0, MAX_IMAGES_PER_PRODUCT - currentCount);
    if (allowed.length === 0) throw new BadRequestException("Ya tienes el máximo de imágenes permitido.");

    const uploaded = [];
    for (const [index, file] of allowed.entries()) {
      const uploadedFile = await this.uploadImage(file);
      const image = await this.prisma.productImage.create({
        data: {
          productId,
          imageUrl: uploadedFile.imageUrl,
          storageKey: uploadedFile.storageKey,
          mimeType: uploadedFile.mimeType,
          sizeBytes: uploadedFile.sizeBytes,
          position: currentCount + index,
        },
      });
      uploaded.push(image);
    }

    return uploaded;
  }

  async deleteProductImage(productId: number, imageId: number, userId: number) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException("Producto no encontrado.");
    if (product.createdBy !== userId) throw new ForbiddenException("No tienes permisos.");

    const image = await this.prisma.productImage.findFirst({ where: { id: imageId, productId } });
    if (!image) throw new NotFoundException("Imagen no encontrada.");

    await this.prisma.productImage.delete({ where: { id: imageId } });
    return { message: "Imagen eliminada." };
  }

  async reorderProductImages(productId: number, imageIds: number[], userId: number) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException("Producto no encontrado.");
    if (product.createdBy !== userId) throw new ForbiddenException("No tienes permisos.");

    for (let i = 0; i < imageIds.length; i++) {
      await this.prisma.productImage.updateMany({
        where: { id: imageIds[i], productId },
        data: { position: i },
      });
    }

    return { message: "Orden actualizado." };
  }

  async setCoverImage(productId: number, imageId: number, userId: number) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException("Producto no encontrado.");
    if (product.createdBy !== userId) throw new ForbiddenException("No tienes permisos.");

    await this.prisma.productImage.updateMany({ where: { productId }, data: { isCover: false } });
    await this.prisma.productImage.update({ where: { id: imageId }, data: { isCover: true } });

    return { message: "Portada actualizada." };
  }

  // --- My (personal panel) ---
  async listMyListings(userId: number) {
    const products = await this.prisma.product.findMany({
      where: { createdBy: userId, deletedAt: null },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: productListSelect,
    });

    return products.map((p: any) => mapProductListItem(p, userId));
  }

  async listMyInquiries(userId: number) {
    return this.prisma.productInquiry.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { product: { select: { id: true, title: true } } },
    });
  }

  async getMyStatistics(userId: number) {
    const [activeProducts, inquiriesReceived, inquiriesSent, favorites] = await Promise.all([
      this.prisma.product.count({ where: { createdBy: userId, status: "ACTIVE", deletedAt: null } }),
      this.prisma.productInquiry.count({
        where: { product: { createdBy: userId, deletedAt: null } },
      }),
      this.prisma.productInquiry.count({ where: { userId } }),
      this.prisma.productFavorite.count({ where: { userId } }),
    ]);

    return {
      activeProducts,
      inquiriesReceived,
      inquiriesSent,
      favorites,
    };
  }

  // --- Admin ---
  async adminListProducts() {
    return this.prisma.product.findMany({
      where: { deletedAt: null },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      include: { category: true },
    });
  }

  async adminUpsertProduct(user: { sub: number; role: string }, payload: CreateProductDto | UpdateProductDto) {
    const isUpdate = "id" in payload && payload.id;

    if (isUpdate) {
      return this.prisma.product.update({
        where: { id: payload.id },
        data: {
          title: payload.title.trim(),
          description: payload.description.trim(),
          price: payload.price ?? 0,
          categoryId: payload.categoryId,
          status: payload.status ?? "ACTIVE",
          type: payload.type ?? "SALE",
          priceType: payload.priceType ?? "FIXED",
          isNegotiable: Boolean(payload.isNegotiable),
          condition: payload.condition ?? null,
          deliveryType: payload.deliveryType ?? "CAMPUS",
          campus: payload.campus?.trim() ?? null,
          course: payload.course?.trim() ?? null,
          isFeatured: Boolean(payload.isFeatured),
          stock: payload.stock ?? 1,
          quantity: payload.quantity ?? 1,
          contactMethod: "chat",
          whatsappMessage: payload.whatsappMessage ?? null,
        },
      });
    }

    return this.prisma.product.create({
      data: {
        title: payload.title.trim(),
        description: payload.description.trim(),
        price: payload.price ?? null,
        currency: payload.currency ?? "PEN",
        categoryId: payload.categoryId,
        status: payload.status ?? "ACTIVE",
        type: payload.type ?? "SALE",
        priceType: payload.priceType ?? "FIXED",
        isNegotiable: Boolean(payload.isNegotiable),
        condition: payload.condition ?? null,
        deliveryType: payload.deliveryType ?? "CAMPUS",
        campus: payload.campus?.trim() ?? null,
        course: payload.course?.trim() ?? null,
        brand: payload.brand?.trim() ?? null,
        model: payload.model?.trim() ?? null,
        isFeatured: Boolean(payload.isFeatured),
        stock: payload.stock ?? 1,
        quantity: payload.quantity ?? 1,
        createdBy: user.sub,
        publishedAt: new Date(),
        contactMethod: "chat",
        whatsappMessage: payload.whatsappMessage ?? null,
      },
    });
  }

  async adminListInquiries(cursor?: number, limit?: number) {
    const safeLimit = Math.min(limit ?? PAGINATION_LIMITS.marketplaceInquiries.default, PAGINATION_LIMITS.marketplaceInquiries.max);
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

  async adminUpdateInquiryStatus(id: number, status: string) {
    const allowed = ["PENDING", "CONTACTED", "RESOLVED", "CANCELLED"] as const;
    if (!allowed.includes(status as any)) throw new BadRequestException("Estado inválido.");
    return this.prisma.productInquiry.update({ where: { id }, data: { status: status as any } });
  }

  async adminUpdateProductStatus(id: number, status: string) {
    const allowed = ["DRAFT", "ACTIVE", "HIDDEN", "SOLD_OUT", "DELETED"] as const;
    if (!allowed.includes(status as any)) throw new BadRequestException("Estado inválido.");
    return this.prisma.product.update({
      where: { id },
      data: { status: status as any, ...(status === "DELETED" ? { deletedAt: new Date() } : {}) },
    });
  }

  async adminListReports(cursor?: number, limit?: number) {
    const safeLimit = Math.min(limit ?? 20, 50);
    const items = await this.prisma.report.findMany({
      where: { productId: { not: null } },
      orderBy: [{ createdAt: "asc" }],
      take: safeLimit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        reporter: { select: { id: true, email: true } },
        product: { select: { id: true, title: true, status: true } },
      },
    });
    const nextCursor = items.length > safeLimit ? items[safeLimit].id : null;
    return { items: items.slice(0, safeLimit), nextCursor };
  }

  async getConversionMetrics() {
    const [products, inquiriesByStatus] = await Promise.all([
      this.prisma.product.findMany({
        where: { deletedAt: null },
        select: { id: true, title: true, viewCount: true, contactClickCount: true, favoriteCount: true },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.productInquiry.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
    ]);

    const inquiryMap: Record<string, number> = {};
    for (const row of inquiriesByStatus as any[]) {
      inquiryMap[row.status] = row._count._all;
    }

    return {
      products,
      inquirySummary: {
        total: Object.values(inquiryMap).reduce((sum, v) => sum + v, 0),
        pending: inquiryMap["PENDING"] ?? 0,
        contacted: inquiryMap["CONTACTED"] ?? 0,
        resolved: inquiryMap["RESOLVED"] ?? 0,
        cancelled: inquiryMap["CANCELLED"] ?? 0,
      },
      totals: {
        views: products.reduce((sum: number, p: any) => sum + p.viewCount, 0),
        contactClicks: products.reduce((sum: number, p: any) => sum + p.contactClickCount, 0),
        saves: products.reduce((sum: number, p: any) => sum + p.favoriteCount, 0),
      },
    };
  }
}
