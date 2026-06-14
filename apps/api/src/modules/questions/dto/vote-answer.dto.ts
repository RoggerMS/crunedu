import { IsIn } from "class-validator";

export class VoteAnswerDto {
  @IsIn([-1, 0, 1])
  value: -1 | 0 | 1;
}
