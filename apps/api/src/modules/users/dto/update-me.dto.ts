import { Transform } from "class-transformer";
import { IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min } from "class-validator";

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
  @MaxLength(30)
  @Matches(/^[a-z0-9._-]+$/i, { message: "El nombre de usuario solo puede usar letras, números, puntos, guiones y guiones bajos." })
  @Transform(({ value }) => sanitizeText(value))
  username?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => sanitizeText(value))
  headline?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  @Transform(({ value }) => sanitizeText(value))
  currentCity?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  @Transform(({ value }) => sanitizeText(value))
  hometown?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  coverPositionY?: number;

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
