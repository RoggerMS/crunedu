import { Transform, Type } from "class-transformer";
import { IsEnum, IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from "class-validator";

export const MATERIAL_TYPES = ["PDF", "DOCX", "PPTX", "IMAGE", "OTHER"] as const;

export class CreateMaterialDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  title: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  objectKey: string;

  @IsString()
  @MinLength(1)
  @MaxLength(500)
  fileUrl: string;

  @IsString()
  @MaxLength(100)
  mimeType: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  sizeBytes: number;

  @IsOptional()
  @Transform(({ value }) => (typeof value === "string" ? value.toUpperCase() : value))
  @IsEnum(MATERIAL_TYPES)
  type?: (typeof MATERIAL_TYPES)[number];
}
