import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export const PRODUCT_TYPES = ['SALE', 'SERVICE', 'EXCHANGE', 'DONATION', 'RENTAL', 'REQUEST'] as const;
export type ProductType = (typeof PRODUCT_TYPES)[number];

export const PRODUCT_PRICE_TYPES = ['FIXED', 'NEGOTIABLE', 'FREE', 'CONTACT', 'EXCHANGE', 'HOURLY', 'FROM'] as const;
export type ProductPriceType = (typeof PRODUCT_PRICE_TYPES)[number];

export const PRODUCT_CONDITIONS = ['NEW', 'LIKE_NEW', 'GOOD', 'USED', 'WITH_DETAILS', 'NOT_APPLICABLE'] as const;
export type ProductCondition = (typeof PRODUCT_CONDITIONS)[number];

export const PRODUCT_DELIVERY_TYPES = ['CAMPUS', 'SAFE_POINT', 'PICKUP', 'COORDINATED', 'SHIPPING', 'DIGITAL'] as const;
export type ProductDeliveryType = (typeof PRODUCT_DELIVERY_TYPES)[number];

export const PRODUCT_STATUSES = ['DRAFT', 'ACTIVE', 'HIDDEN', 'SOLD_OUT', 'DELETED'] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export class CreateProductImageDto {
  @IsString()
  @IsNotEmpty()
  imageUrl: string;

  @IsString()
  @IsNotEmpty()
  storageKey: string;

  @IsOptional()
  @IsString()
  mimeType?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  sizeBytes?: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  altText?: string;

  @IsOptional()
  @IsBoolean()
  isCover?: boolean;
}

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: 'El título debe tener al menos 3 caracteres.' })
  @MaxLength(200, { message: 'El título no puede exceder 200 caracteres.' })
  title: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10, { message: 'La descripción debe tener al menos 10 caracteres.' })
  @MaxLength(3000, { message: 'La descripción no puede exceder 3000 caracteres.' })
  description: string;

  @Type(() => Number)
  @IsInt()
  @Min(1, { message: 'La categoría es obligatoria.' })
  categoryId: number;

  @IsOptional()
  @IsEnum(PRODUCT_TYPES, { message: 'Tipo de publicación no válido.' })
  type?: ProductType;

  @IsOptional()
  @IsEnum(PRODUCT_PRICE_TYPES, { message: 'Tipo de precio no válido.' })
  priceType?: ProductPriceType;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0, { message: 'El precio no puede ser negativo.' })
  @Max(999999, { message: 'El precio es demasiado alto.' })
  price?: number;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;

  @IsOptional()
  @IsBoolean()
  isNegotiable?: boolean;

  @IsOptional()
  @IsEnum(PRODUCT_CONDITIONS, { message: 'Condición no válida.' })
  condition?: ProductCondition;

  @IsOptional()
  @IsEnum(PRODUCT_DELIVERY_TYPES, { message: 'Tipo de entrega no válido.' })
  deliveryType?: ProductDeliveryType;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  quantity?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stock?: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  campus?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  district?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  safePointId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  course?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  brand?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  model?: string;

  @IsOptional()
  @IsEnum(PRODUCT_STATUSES, { message: 'Estado no válido.' })
  status?: ProductStatus;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  whatsappMessage?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductImageDto)
  @Max(6, { message: 'No puedes subir más de 6 imágenes.' })
  images?: CreateProductImageDto[];
}

export class UpdateProductDto extends CreateProductDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id?: number;
}
