import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class CreatePostDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  title?: string;

  @IsString()
  @MinLength(5)
  @MaxLength(5000)
  content: string;

  @Type(() => Number)
  @IsInt()
  communityId: number;
}
