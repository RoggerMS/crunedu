import { Transform } from "class-transformer";
import { IsEnum, IsOptional, IsString, Matches, MaxLength, MinLength } from "class-validator";

function sanitizeText(value: unknown): unknown {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim().replace(/\s+/g, " ");
  return trimmed.length > 0 ? trimmed : null;
}

export enum BirthDateDisplayEnum {
  FULL = "FULL",
  DAY_MONTH = "DAY_MONTH",
  YEAR = "YEAR",
  HIDDEN = "HIDDEN",
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

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[a-zA-Z0-9._]+$/, { message: "El nombre de usuario solo puede contener letras, números, puntos y guiones bajos." })
  username?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Transform(({ value }) => sanitizeText(value))
  headline?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Transform(({ value }) => sanitizeText(value))
  currentCity?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Transform(({ value }) => sanitizeText(value))
  hometown?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  @Transform(({ value }) => sanitizeText(value))
  gender?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  @Transform(({ value }) => sanitizeText(value))
  pronouns?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  @Transform(({ value }) => sanitizeText(value))
  relationshipStatus?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Transform(({ value }) => sanitizeText(value))
  otherNames?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Transform(({ value }) => sanitizeText(value))
  favoriteQuote?: string | null;

  @IsOptional()
  @IsString()
  birthDate?: string | null;

  @IsOptional()
  @IsEnum(BirthDateDisplayEnum)
  birthDateDisplay?: BirthDateDisplayEnum | null;
}
