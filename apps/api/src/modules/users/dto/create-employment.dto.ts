import { Transform } from "class-transformer";
import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

function sanitizeText(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const trimmed = value.trim().replace(/\s+/g, " ");
  return trimmed.length > 0 ? trimmed : null;
}

export class CreateEmploymentDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Transform(({ value }) => sanitizeText(value))
  position!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  @Transform(({ value }) => sanitizeText(value))
  company!: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  @Transform(({ value }) => sanitizeText(value))
  modality?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Transform(({ value }) => sanitizeText(value))
  location?: string | null;

  @IsOptional()
  @IsString()
  startDate?: string | null;

  @IsOptional()
  @IsString()
  endDate?: string | null;

  @IsOptional()
  @IsBoolean()
  isCurrent?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  @Transform(({ value }) => sanitizeText(value))
  description?: string | null;
}
