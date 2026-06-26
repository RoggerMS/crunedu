import { Type } from "class-transformer";
import { IsArray, IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength, ValidateNested } from "class-validator";

export const MOMENT_TYPES = ["NOW", "ALERT", "FOOD", "HUMOR", "EVENT", "CAMPUS", "COMMUNITY", "LOST_FOUND"] as const;
export type MomentTypeValue = (typeof MOMENT_TYPES)[number];

export class CreateMomentMediaDto {
  @IsString()
  @MinLength(1)
  imageUrl: string;

  @IsString()
  @MinLength(1)
  storageKey: string;

  @IsString()
  @MinLength(1)
  mimeType: string;

  @IsInt()
  @Min(1)
  sizeBytes: number;
}

export class CreateMomentDto {
  @IsString()
  @MinLength(3)
  @MaxLength(140)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsEnum(MOMENT_TYPES)
  type?: MomentTypeValue;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  location?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(40, { each: true })
  tags?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(168)
  durationHours?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMomentMediaDto)
  media?: CreateMomentMediaDto[];
}
