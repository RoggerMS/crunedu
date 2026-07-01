import { Type } from "class-transformer";
import { IsEnum, IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from "class-validator";

export class CreatePromotionDto {
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  destinationUrl?: string;

  @IsOptional()
  @IsEnum(["FEED_RIGHT_SIDEBAR", "FEED_INLINE", "STORE_TOP", "UNIVERSITY_SIDEBAR"])
  placement?: "FEED_RIGHT_SIDEBAR" | "FEED_INLINE" | "STORE_TOP" | "UNIVERSITY_SIDEBAR";

  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;

  @IsOptional()
  @Type(() => Date)
  startsAt?: Date;

  @IsOptional()
  @Type(() => Date)
  endsAt?: Date;
}

export class UpdatePromotionDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  destinationUrl?: string;

  @IsOptional()
  @IsEnum(["FEED_RIGHT_SIDEBAR", "FEED_INLINE", "STORE_TOP", "UNIVERSITY_SIDEBAR"])
  placement?: "FEED_RIGHT_SIDEBAR" | "FEED_INLINE" | "STORE_TOP" | "UNIVERSITY_SIDEBAR";

  @IsOptional()
  @IsEnum(["DRAFT", "SCHEDULED", "ACTIVE", "PAUSED", "ENDED", "ARCHIVED"])
  status?: "DRAFT" | "SCHEDULED" | "ACTIVE" | "PAUSED" | "ENDED" | "ARCHIVED";

  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;

  @IsOptional()
  @Type(() => Date)
  startsAt?: Date;

  @IsOptional()
  @Type(() => Date)
  endsAt?: Date;
}

export class AdminPromotionStatusDto {
  @IsEnum(["DRAFT", "SCHEDULED", "ACTIVE", "PAUSED", "ENDED", "ARCHIVED"])
  status!: "DRAFT" | "SCHEDULED" | "ACTIVE" | "PAUSED" | "ENDED" | "ARCHIVED";
}
