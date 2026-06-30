import { Transform } from "class-transformer";
import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator";

export const PARTICIPANT_ROLES = ["HOST", "MODERATOR", "SPEAKER", "LISTENER"] as const;

export class UpdateParticipantRoleDto {
  @Transform(({ value }) => (typeof value === "string" ? value.toUpperCase() : value))
  @IsEnum(PARTICIPANT_ROLES)
  role: (typeof PARTICIPANT_ROLES)[number];

  @IsOptional()
  @IsString()
  @MaxLength(200)
  reason?: string;
}

export class BanDto {
  @IsOptional()
  @IsString()
  @MaxLength(300)
  reason?: string;
}
