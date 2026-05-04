import { IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from "class-validator";

export class UpdatePostDto {
  @IsOptional()
  @IsString()
  @MinLength(3, { message: "El contenido debe tener al menos 3 caracteres." })
  @MaxLength(5000, { message: "El contenido no puede superar 5000 caracteres." })
  content?: string;

  @IsOptional()
  @IsInt({ message: "La comunidad es obligatoria." })
  @Min(1, { message: "La comunidad es inválida." })
  communityId?: number;
}
