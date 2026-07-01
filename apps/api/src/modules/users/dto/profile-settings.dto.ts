import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsBoolean, IsInt, IsOptional, Min } from "class-validator";

export class ReorderItemsDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  ids!: number[];
}

export class UpdateSectionSettingsDto {
  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsBoolean()
  friends?: boolean;

  @IsOptional()
  @IsBoolean()
  communities?: boolean;

  @IsOptional()
  @IsBoolean()
  photos?: boolean;

  @IsOptional()
  @IsBoolean()
  education?: boolean;

  @IsOptional()
  @IsBoolean()
  employment?: boolean;

  @IsOptional()
  @IsBoolean()
  interests?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  featuredOrder?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  friendsOrder?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  communitiesOrder?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  photosOrder?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  educationOrder?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  employmentOrder?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  interestsOrder?: number;
}
