import { IsOptional, IsString, Matches } from "class-validator";

export class ListDebatesQueryDto {
  @IsString()
  courseKey!: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-W\d{2}$/)
  week?: string;
}
