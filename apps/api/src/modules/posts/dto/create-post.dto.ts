import { Type } from "class-transformer";
import { IsInt, IsNotEmpty, IsString, MaxLength, MinLength } from "class-validator";

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(120)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(5000)
  content: string;

  @Type(() => Number)
  @IsInt()
  communityId: number;
}
