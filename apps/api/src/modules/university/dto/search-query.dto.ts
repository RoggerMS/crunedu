import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export class SearchQueryDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsIn(["EVENTO", "CONVOCATORIA", "TRAMITE", "SERVICIO", "GUIA", "AVISO", "ACADEMIC", "PAYMENT", "SCHOLARSHIP", "CULTURE", "SPORTS", "WELLBEING"])
  type?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  categoryId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  areaId?: number;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @IsString()
  modality?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsIn(["PUBLISHED", "HIDDEN", "DELETED", "PENDING_REVIEW"])
  status?: string;

  @IsOptional()
  @IsIn(["asc", "desc"])
  sort?: string = "desc";

  @IsOptional()
  @IsString()
  sortBy?: string = "createdAt";

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  cursor?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;

  @IsOptional()
  @IsString()
  visibility?: string;
}
