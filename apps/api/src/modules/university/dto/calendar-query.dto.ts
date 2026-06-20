import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export class CalendarQueryDto {
  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  categoryId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  areaId?: number;

  @IsOptional()
  @IsString()
  @IsIn(["NORMAL", "IMPORTANT", "URGENT", "CRITICAL"])
  priority?: string;

  @IsOptional()
  @IsString()
  @IsIn(["PROCEDURE", "CALL", "EVENT", "SERVICE", "GUIDE", "NOTICE", "ACADEMIC", "PAYMENT", "SCHOLARSHIP", "CULTURE", "SPORTS", "WELLBEING"])
  type?: string;

  @IsOptional()
  @IsString()
  @IsIn(["IN_PERSON", "ONLINE", "HYBRID", "NOT_APPLICABLE"])
  modality?: string;

  @IsOptional()
  @IsString()
  @IsIn(["DRAFT", "PENDING_REVIEW", "SCHEDULED", "PUBLISHED", "ACTIVE", "CLOSED", "COMPLETED", "CANCELLED", "ARCHIVED", "REJECTED"])
  status?: string;

  @IsOptional()
  @IsString()
  @IsIn(["true", "false"])
  onlyFeatured?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  cursor?: number;

  @IsOptional()
  @IsString()
  q?: string;
}
