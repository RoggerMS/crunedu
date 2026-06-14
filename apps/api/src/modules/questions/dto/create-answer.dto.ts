import { Type } from "class-transformer";
import { IsArray, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min, MinLength, ValidateNested } from "class-validator";

export class CreateAnswerImageDto {
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

export class CreateAnswerDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(3000)
  content: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAnswerImageDto)
  images?: CreateAnswerImageDto[];
}
