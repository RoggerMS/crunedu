import { IsEnum, IsInt, IsOptional, IsString, MaxLength, Min } from "class-validator";

export enum ReportReviewStatus {
  OPEN = "open",
  REVIEWING = "reviewing",
  RESOLVED = "resolved",
}

export enum ModerationDecision {
  WARNING = "warning",
  TEMP_POST_LIMIT = "temp_post_limit",
  SUSPENSION = "suspension",
  DISMISS = "dismiss",
}

export class ModerateReportDto {
  @IsEnum(ReportReviewStatus)
  status!: ReportReviewStatus;

  @IsEnum(ModerationDecision)
  decision!: ModerationDecision;

  @IsString()
  @MaxLength(500)
  reason!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  sanctionHours?: number;
}
