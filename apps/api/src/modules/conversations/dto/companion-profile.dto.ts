import { Transform, Type } from "class-transformer";
import { IsArray, IsBoolean, IsOptional, IsString, MaxLength } from "class-validator";

export class CompanionProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(40, { each: true })
  topics?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(60, { each: true })
  courses?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(120)
  availabilityText?: string;

  @IsOptional()
  @IsBoolean()
  availableForVoice?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class GetCompanionsQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @Type(() => Number)
  universityId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  topic?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  course?: string;

  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true)
  availableForVoice?: boolean;

  @IsOptional()
  @Type(() => Number)
  limit?: number;
}
