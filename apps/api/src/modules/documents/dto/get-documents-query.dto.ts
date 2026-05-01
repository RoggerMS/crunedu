import { IsOptional, IsString, MaxLength } from "class-validator";

export class GetDocumentsQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  course?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  cycle?: string;
}
