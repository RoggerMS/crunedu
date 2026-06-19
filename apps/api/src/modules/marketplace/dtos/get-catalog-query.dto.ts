import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export const CATALOG_SORTS = [
  'relevance',
  'recent',
  'low_price',
  'high_price',
  'most_viewed',
  'most_saved',
  'verified',
  'campus',
] as const;
export type CatalogSort = (typeof CATALOG_SORTS)[number];

export const PRODUCT_TYPES_QUERY = ['SALE', 'SERVICE', 'EXCHANGE', 'DONATION', 'RENTAL', 'REQUEST'] as const;
export const PRODUCT_DELIVERY_TYPES_QUERY = ['CAMPUS', 'SAFE_POINT', 'PICKUP', 'COORDINATED', 'SHIPPING', 'DIGITAL'] as const;
export const PRODUCT_CONDITIONS_QUERY = ['NEW', 'LIKE_NEW', 'GOOD', 'USED', 'WITH_DETAILS', 'NOT_APPLICABLE'] as const;

export class GetCatalogQueryDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  categoryId?: number;

  @IsOptional()
  @IsString()
  categorySlug?: string;

  @IsOptional()
  @IsEnum(PRODUCT_TYPES_QUERY)
  type?: (typeof PRODUCT_TYPES_QUERY)[number];

  @IsOptional()
  @IsEnum(PRODUCT_DELIVERY_TYPES_QUERY)
  deliveryType?: (typeof PRODUCT_DELIVERY_TYPES_QUERY)[number];

  @IsOptional()
  @IsEnum(PRODUCT_CONDITIONS_QUERY)
  condition?: (typeof PRODUCT_CONDITIONS_QUERY)[number];

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  priceMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  priceMax?: number;

  @IsOptional()
  @IsString()
  campus?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  safePointId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  sellerId?: number;

  @IsOptional()
  @IsBoolean()
  saved?: boolean;

  @IsOptional()
  @IsBoolean()
  mine?: boolean;

  @IsOptional()
  @IsEnum(CATALOG_SORTS)
  sort?: CatalogSort;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  cursor?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(40)
  limit?: number;
}
