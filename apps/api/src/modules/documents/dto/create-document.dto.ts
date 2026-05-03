import { IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from "class-validator";
import { Type } from "class-transformer";

export class CreateDocumentDto {
  @IsString()
  @MinLength(5)
  @MaxLength(120)
  title: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(1200)
  description?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  course: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  cycle?: string;

  @IsString()
  @MinLength(5)
  @MaxLength(500)
  fileUrl: string;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  communityId?: number;
}
