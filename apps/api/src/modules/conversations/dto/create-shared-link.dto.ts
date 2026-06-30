import { Transform } from "class-transformer";
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export const SHARED_LINK_TYPES = ["MEET", "ZOOM", "TEAMS", "DISCORD", "DOCUMENT", "VIDEO", "OTHER"] as const;

export class CreateSharedLinkDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  title: string;

  @IsString()
  @MinLength(8)
  @MaxLength(500)
  url: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === "string" ? value.toUpperCase() : value))
  @IsEnum(SHARED_LINK_TYPES)
  type?: (typeof SHARED_LINK_TYPES)[number];
}
