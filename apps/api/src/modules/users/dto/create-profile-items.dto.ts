import { Transform } from "class-transformer";
import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";

function sanitizeText(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const trimmed = value.trim().replace(/\s+/g, " ");
  return trimmed.length > 0 ? trimmed : null;
}

export class CreateInterestDto {
  @IsString()
  @MinLength(2)
  @MaxLength(40)
  @Transform(({ value }) => sanitizeText(value))
  category!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  @Transform(({ value }) => sanitizeText(value))
  value!: string;
}

export class CreateLinkDto {
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  @Transform(({ value }) => sanitizeText(value))
  label!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(500)
  url!: string;
}

export class CreateCustomDetailDto {
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  @Transform(({ value }) => sanitizeText(value))
  label!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  @Transform(({ value }) => sanitizeText(value))
  value!: string;
}
