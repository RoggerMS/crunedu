import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class CreateSuggestionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  type!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  description!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  area?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  date?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  externalUrl?: string;
}
