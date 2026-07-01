import { IsEnum, IsOptional } from "class-validator";

enum ProfileVisibilityEnum {
  PUBLIC = "PUBLIC",
  FOLLOWERS = "FOLLOWERS",
  FRIENDS = "FRIENDS",
  ONLY_ME = "ONLY_ME",
}

export class UpdatePrivacySettingsDto {
  @IsOptional()
  @IsEnum(ProfileVisibilityEnum)
  bio?: ProfileVisibilityEnum;

  @IsOptional()
  @IsEnum(ProfileVisibilityEnum)
  academicInfo?: ProfileVisibilityEnum;

  @IsOptional()
  @IsEnum(ProfileVisibilityEnum)
  currentCity?: ProfileVisibilityEnum;

  @IsOptional()
  @IsEnum(ProfileVisibilityEnum)
  birthDate?: ProfileVisibilityEnum;

  @IsOptional()
  @IsEnum(ProfileVisibilityEnum)
  contact?: ProfileVisibilityEnum;

  @IsOptional()
  @IsEnum(ProfileVisibilityEnum)
  relationship?: ProfileVisibilityEnum;

  @IsOptional()
  @IsEnum(ProfileVisibilityEnum)
  friends?: ProfileVisibilityEnum;

  @IsOptional()
  @IsEnum(ProfileVisibilityEnum)
  communities?: ProfileVisibilityEnum;

  @IsOptional()
  @IsEnum(ProfileVisibilityEnum)
  followersList?: ProfileVisibilityEnum;

  @IsOptional()
  @IsEnum(ProfileVisibilityEnum)
  followingList?: ProfileVisibilityEnum;
}
