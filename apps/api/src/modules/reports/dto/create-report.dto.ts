import { IsEnum, IsInt, IsString, MaxLength, Min } from "class-validator";

export enum ReportTargetType {
  POST = "POST",
  COMMENT = "COMMENT",
  QUESTION = "QUESTION",
  ANSWER = "ANSWER",
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
}
