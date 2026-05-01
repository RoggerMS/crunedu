import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class CreateDebateDto {
  @IsString()
  courseKey!: string;

  @IsString()
  @MinLength(5)
  @MaxLength(160)
  weeklyTopic!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(1500)
  stance!: string;

  @IsOptional()
  @IsString()
  audioNoteUrl?: string;
}
