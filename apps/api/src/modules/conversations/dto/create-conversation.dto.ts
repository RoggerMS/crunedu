import { Transform, Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";

export const CONVERSATION_TYPES = ["OPEN", "STUDY", "QUESTION", "DEBATE"] as const;
export type ConversationTypeValue = (typeof CONVERSATION_TYPES)[number];

export const CONVERSATION_VISIBILITY = ["PUBLIC", "UNIVERSITY", "PRIVATE"] as const;
export type ConversationVisibilityValue = (typeof CONVERSATION_VISIBILITY)[number];

export class CreateStanceDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  description?: string;
}

export class CreateConversationDto {
  @IsString()
  @MinLength(5)
  @MaxLength(140)
  title: string;

  @IsString()
  @MinLength(10)
  @MaxLength(1500)
  description: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  course?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  rules?: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === "string" ? value.toUpperCase() : value))
  @IsEnum(CONVERSATION_TYPES)
  type?: ConversationTypeValue;

  @IsOptional()
  @Transform(({ value }) => (typeof value === "string" ? value.toUpperCase() : value))
  @IsEnum(CONVERSATION_VISIBILITY)
  visibility?: ConversationVisibilityValue;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2)
  @Max(200)
  maxParticipants?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(25)
  maxSpeakers?: number;

  @IsOptional()
  @IsBoolean()
  allowListeners?: boolean;

  @IsOptional()
  @IsBoolean()
  allowRaiseHand?: boolean;

  @IsOptional()
  @IsBoolean()
  recordingEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  allowNewStances?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(40, { each: true })
  tags?: string[];

  @IsOptional()
  @IsBoolean()
  startNow?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateStanceDto)
  initialStances?: CreateStanceDto[];

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  initialLinkUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  initialLinkTitle?: string;
}
