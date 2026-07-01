import { IsEnum, IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from "class-validator";

export enum AdminSanctionType {
  TEMP_POST_LIMIT = "TEMP_POST_LIMIT",
  SUSPENSION = "SUSPENSION",
}

export class AdminUserSanctionDto {
  @IsEnum(AdminSanctionType)
  type!: AdminSanctionType;

  @IsString()
  @MinLength(3)
  @MaxLength(500)
  reason!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  hours?: number;
}
