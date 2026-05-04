import { Type } from "class-transformer";
import { IsArray, IsInt, IsOptional, IsString, MaxLength, Min, MinLength, ValidateNested } from "class-validator";

export class CreatePostDto {
  @IsString()
  @MinLength(5)
  @MaxLength(5000)
  content: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  communityId: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePostImageDto)
  images?: CreatePostImageDto[];
}


export class CreatePostImageDto {
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
