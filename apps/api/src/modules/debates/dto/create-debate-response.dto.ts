import { IsString, MaxLength, MinLength } from "class-validator";

export class CreateDebateResponseDto {
  @IsString()
  @MinLength(2)
  @MaxLength(1000)
  content!: string;
}
