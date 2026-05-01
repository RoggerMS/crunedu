import { Transform, Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";

const SEARCH_TYPES = ["posts", "questions", "communities", "products"] as const;
export type SearchType = (typeof SEARCH_TYPES)[number];

export class SearchQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : ""))
  q?: string;

  @IsOptional()
  @IsIn(SEARCH_TYPES)
  type?: SearchType;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  limit?: number;
}
