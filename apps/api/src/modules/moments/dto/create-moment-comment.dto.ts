import { IsNotEmpty, IsString, MaxLength, MinLength } from "class-validator";

export class CreateMomentCommentDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(1000)
  content: string;
}
