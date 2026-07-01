import { Transform, Type } from "class-transformer";
import { IsBoolean, IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from "class-validator";

function sanitizeText(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const trimmed = value.trim().replace(/\s+/g, " ");
  return trimmed.length > 0 ? trimmed : null;
}

export class CreateEducationDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  @Transform(({ value }) => sanitizeText(value))
  institution!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Transform(({ value }) => sanitizeText(value))
  program?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  @Transform(({ value }) => sanitizeText(value))
  degree?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  @Transform(({ value }) => sanitizeText(value))
  field?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  startYear?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  endYear?: number | null;

  @IsOptional()
  @IsBoolean()
  isCurrent?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  @Transform(({ value }) => sanitizeText(value))
  description?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Transform(({ value }) => sanitizeText(value))
  location?: string | null;
}
