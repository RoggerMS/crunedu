import { Type } from "class-transformer";
import { ArrayMaxSize, IsArray, IsEnum, IsInt, IsOptional, IsString, MaxLength, Min } from "class-validator";
import { DocumentVisibilityDto } from "./create-document.dto";

export class UpdateDocumentDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  course?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  cycle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  materialType?: string;

  @IsOptional()
  @IsEnum(DocumentVisibilityDto)
  visibility?: DocumentVisibilityDto;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  communityId?: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(8)
  @IsString({ each: true })
  tags?: string[];
}
