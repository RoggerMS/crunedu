import { Type } from "class-transformer";
import { ArrayMaxSize, IsArray, IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength, ValidateNested } from "class-validator";

export enum DocumentVisibilityDto {
  PUBLIC = "public",
  COMMUNITY = "community",
  PRIVATE = "private",
}

export class UploadedDocumentFileDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  fileUrl: string;

  @IsString()
  @MinLength(1)
  @MaxLength(300)
  storageKey: string;

  @IsString()
  @MinLength(1)
  @MaxLength(30)
  fileType: string;

  @IsInt()
  @Min(1)
  sizeBytes: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  mimeType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  originalName?: string;
}

export class CreateDocumentDto {
  @IsString()
  @MinLength(5)
  @MaxLength(120)
  title: string;

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

  @IsEnum(DocumentVisibilityDto)
  visibility: DocumentVisibilityDto;

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

  @Type(() => UploadedDocumentFileDto)
  @ValidateNested()
  uploadedFile: UploadedDocumentFileDto;
}
