import { IsString, IsEnum, IsNotEmpty, MinLength, MaxLength, Matches } from 'class-validator';

export class CreateProductInquiryDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres.' })
  @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres.' })
  contactName: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^9\d{8}$/, { message: 'Ingresa un número de celular válido (9 dígitos).' })
  contactPhone: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(5, { message: 'El mensaje debe tener al menos 5 caracteres.' })
  @MaxLength(500, { message: 'El mensaje no puede exceder 500 caracteres.' })
  message: string;

  @IsEnum(['whatsapp', 'email'], { message: 'Selecciona un método de contacto válido (whatsapp o email).' })
  preferredContactMethod: 'whatsapp' | 'email';
}
