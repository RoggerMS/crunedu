import { Type } from "class-transformer";
import { IsBoolean, IsEnum, IsIn, IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export const MOMENT_SORTS = ["recent", "relevant"] as const;
export type MomentSort = (typeof MOMENT_SORTS)[number];

export const MOMENT_TYPES_QUERY = ["NOW", "ALERT", "FOOD", "HUMOR", "EVENT", "CAMPUS", "COMMUNITY", "LOST_FOUND"] as const;

export class GetMomentsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  cursor?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(30)
  limit?: number;

  @IsOptional()
  @IsIn(MOMENT_SORTS)
  sort?: MomentSort;

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsEnum(MOMENT_TYPES_QUERY)
  type?: (typeof MOMENT_TYPES_QUERY)[number];

  @IsOptional()
  @IsString()
  tag?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsBoolean()
  withMedia?: boolean;
}

export class GetGalleryQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  cursor?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(40)
  limit?: number;

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsEnum(MOMENT_TYPES_QUERY)
  type?: (typeof MOMENT_TYPES_QUERY)[number];

  @IsOptional()
  @IsString()
  location?: string;
}

export class GetSavedMomentsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  cursor?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(40)
  limit?: number;

  @IsOptional()
  @IsIn(["all", "active", "expired", "with_photo"])
  status?: "all" | "active" | "expired" | "with_photo";

  @IsOptional()
  @IsString()
  q?: string;
}

export class GetTrendsQueryDto {
  @IsOptional()
  @IsIn(["day", "week", "month"])
  period?: "day" | "week" | "month";

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}
