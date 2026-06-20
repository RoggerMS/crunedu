import { Type } from "class-transformer";
import { IsInt, IsOptional, Min } from "class-validator";

export class OverviewQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  universityId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  facultyId?: number;
}
