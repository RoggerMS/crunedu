import { IsEnum, IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from "class-validator";

export class AdminReasonDto {
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  reason!: string;
}

export class AdminContentStatusDto {
  @IsEnum(["PUBLISHED", "HIDDEN", "DELETED", "PENDING_REVIEW"])
  status!: "PUBLISHED" | "HIDDEN" | "DELETED" | "PENDING_REVIEW";

  @IsString()
  @MinLength(3)
  @MaxLength(500)
  reason!: string;
}

export class AdminBulkActionDto {
  @IsInt()
  @Min(1)
  ids!: number[];
}
