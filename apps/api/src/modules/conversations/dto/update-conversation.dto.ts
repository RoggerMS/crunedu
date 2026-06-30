import { Transform, Type } from "class-transformer";
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";
import { CONVERSATION_TYPES, CONVERSATION_VISIBILITY } from "./create-conversation.dto";

export class UpdateConversationDto {
  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(140)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(1500)
  description?: string;

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
  type?: (typeof CONVERSATION_TYPES)[number];

  @IsOptional()
  @Transform(({ value }) => (typeof value === "string" ? value.toUpperCase() : value))
  @IsEnum(CONVERSATION_VISIBILITY)
  visibility?: (typeof CONVERSATION_VISIBILITY)[number];

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
  @IsString()
  @MaxLength(2000)
  conclusion?: string;
}
