import { Type } from "class-transformer";
import { IsEnum, IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from "class-validator";

export class AdminPlacementDto {
  @IsEnum(["FEED_FEATURED", "FEED_RIGHT_SIDEBAR", "COMMUNITIES_FEATURED", "QUESTIONS_FEATURED", "DOCUMENTS_FEATURED", "UNIVERSITY_FEATURED", "MOMENTS_FEATURED", "STORE_FEATURED"])
  area!: "FEED_FEATURED" | "FEED_RIGHT_SIDEBAR" | "COMMUNITIES_FEATURED" | "QUESTIONS_FEATURED" | "DOCUMENTS_FEATURED" | "UNIVERSITY_FEATURED" | "MOMENTS_FEATURED" | "STORE_FEATURED";

  @IsString()
  @MinLength(2)
  @MaxLength(40)
  entityType!: string;

  @IsInt()
  @Min(1)
  entityId!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  slot?: string;

  @IsOptional()
  @Type(() => Date)
  startsAt?: Date;

  @IsOptional()
  @Type(() => Date)
  endsAt?: Date;
}

export class AdminReorderDto {
  @IsInt({ each: true })
  @Min(1, { each: true })
  orderedIds!: number[];
}

export class AdminInquiryStatusDto {
  @IsEnum(["PENDING", "CONTACTED", "RESOLVED", "CANCELLED"])
  status!: "PENDING" | "CONTACTED" | "RESOLVED" | "CANCELLED";
}
