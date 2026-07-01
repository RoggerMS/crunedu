import { IsString, MinLength, MaxLength } from "class-validator";

export class CreateAdminSessionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  password!: string;
}
