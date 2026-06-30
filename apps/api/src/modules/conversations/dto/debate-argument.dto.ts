import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class CreateArgumentDto {
  @IsString()
  @MinLength(3)
  @MaxLength(1000)
  content: string;
}

export class UpdateArgumentDto {
  @IsString()
  @MinLength(3)
  @MaxLength(1000)
  content: string;
}
