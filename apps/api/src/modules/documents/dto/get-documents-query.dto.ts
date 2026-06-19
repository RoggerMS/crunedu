import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";

export type DocumentSort = "recent" | "most_saved" | "most_downloaded" | "best_rated";
export type DocumentVisibilityFilter = "public" | "community" | "private";

export class GetDocumentsQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  q?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  course?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  materialType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  fileType?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  communityId?: number;

  @IsOptional()
  @IsIn(["public", "community", "private"])
  visibility?: DocumentVisibilityFilter;

  @IsOptional()
  @IsString()
  @IsIn(["true", "false"])
  saved?: string;

  @IsOptional()
  @IsString()
  @IsIn(["true", "false"])
  mine?: string;

  @IsOptional()
  @IsIn(["recent", "most_saved", "most_downloaded", "best_rated"])
  sort?: DocumentSort;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  cursor?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}
