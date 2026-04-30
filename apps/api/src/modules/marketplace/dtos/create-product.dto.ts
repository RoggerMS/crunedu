import { IsString, IsNumber, IsOptional, IsBoolean, IsEnum, MinLength, MaxLength, Min, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { ProductStatus } from '@prisma/client';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: 'El título debe tener al menos 3 caracteres.' })
  @MaxLength(200, { message: 'El título no puede exceder 200 caracteres.' })
  title: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10, { message: 'La descripción debe tener al menos 10 caracteres.' })
  @MaxLength(2000, { message: 'La descripción no puede exceder 2000 caracteres.' })
  description: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0, { message: 'El precio debe ser mayor a 0.' })
  price: number;

  @Type(() => Number)
  @IsNumber()
  categoryId: number;

  @IsOptional()
  @IsEnum(ProductStatus, { message: 'Estado no válido.' })
  status?: ProductStatus;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  stock?: number;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsEnum(['whatsapp', 'email'], { message: 'Método de contacto no válido.' })
  contactMethod?: 'whatsapp' | 'email';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  whatsappMessage?: string;
}

export class UpdateProductDto extends CreateProductDto {
  @Type(() => Number)
  @IsNumber()
  id: number;
}
