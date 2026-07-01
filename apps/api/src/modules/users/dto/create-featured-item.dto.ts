import { Type } from "class-transformer";
import { IsInt, Min } from "class-validator";

export class CreateFeaturedItemDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  entityId!: number;
}
