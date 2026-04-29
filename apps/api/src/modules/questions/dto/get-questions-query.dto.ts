import { Type } from "class-transformer";
import { IsInt, IsOptional, Max, Min } from "class-validator";
import { PAGINATION_LIMITS } from "../../common/pagination.constants";

export class GetQuestionsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  cursor?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(PAGINATION_LIMITS.questions.max)
  limit?: number;
}
