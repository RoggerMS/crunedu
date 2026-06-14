import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from "class-validator";

export class CreateQuestionDto {
  @IsString()
  @MinLength(5)
  @MaxLength(160)
  title: string;

  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  content: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  communityId?: number;
}
