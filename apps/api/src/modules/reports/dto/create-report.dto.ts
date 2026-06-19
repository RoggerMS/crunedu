import { IsEnum, IsInt, IsOptional, IsString, MaxLength, Min } from "class-validator";

export enum ReportTargetType {
  POST = "POST",
  COMMENT = "COMMENT",
  QUESTION = "QUESTION",
  ANSWER = "ANSWER",
  DOCUMENT = "DOCUMENT",
}

export class CreateReportDto {
  @IsEnum(ReportTargetType)
  targetType!: ReportTargetType;

  @IsInt()
  @Min(1)
  targetId!: number;

  @IsString()
  @MaxLength(500)
  reason!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}
