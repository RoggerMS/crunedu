import { IsEnum, IsString, MaxLength, MinLength } from "class-validator";

export class AdminRoleChangeDto {
  @IsEnum(["USER", "MODERATOR", "ADMIN"])
  role!: "USER" | "MODERATOR" | "ADMIN";

  @IsString()
  @MinLength(3)
  @MaxLength(500)
  reason!: string;
}
