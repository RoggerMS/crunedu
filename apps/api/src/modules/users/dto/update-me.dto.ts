import { Transform } from "class-transformer";
import { IsOptional, IsString, MaxLength } from "class-validator";

function sanitizeText(value: unknown): unknown {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim().replace(/\s+/g, " ");
  return trimmed.length > 0 ? trimmed : null;
}

export class UpdateMeDto {
  @IsOptional()
  @IsString()
  @MaxLength(60)
  @Transform(({ value }) => sanitizeText(value))
  firstName?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  @Transform(({ value }) => sanitizeText(value))
  lastName?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  @Transform(({ value }) => sanitizeText(value))
  bio?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Transform(({ value }) => sanitizeText(value))
  faculty?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Transform(({ value }) => sanitizeText(value))
  career?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  @Transform(({ value }) => sanitizeText(value))
  cycle?: string | null;
}
