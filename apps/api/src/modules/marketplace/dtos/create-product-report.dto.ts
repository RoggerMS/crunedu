import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export const PRODUCT_REPORT_REASONS = [
  'PRODUCT_FORBIDDEN',
  'FRAUD',
  'MISLEADING',
  'FAKE_PRICE',
  'DUPLICATE',
  'OFFENSIVE',
  'PERSONAL_DATA',
  'SPAM',
  'SOLD_STILL_ACTIVE',
  'OTHER',
] as const;
export type ProductReportReason = (typeof PRODUCT_REPORT_REASONS)[number];

export class CreateProductReportDto {
  @IsEnum(PRODUCT_REPORT_REASONS, { message: 'Motivo de reporte no válido.' })
  reason: ProductReportReason;

  @IsOptional()
  @IsString()
  @MinLength(5, { message: 'Agrega más detalle al reporte.' })
  @MaxLength(1000, { message: 'La descripción no puede exceder 1000 caracteres.' })
  description?: string;
}
