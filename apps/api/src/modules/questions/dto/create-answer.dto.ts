import { IsNotEmpty, IsString, MaxLength, MinLength } from "class-validator";

export class CreateAnswerDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(3000)
  content: string;
}
