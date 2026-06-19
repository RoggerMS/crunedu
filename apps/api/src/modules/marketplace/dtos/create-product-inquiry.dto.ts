import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export const QUICK_MESSAGE_TYPES = [
  'AVAILABILITY',
  'PRICE',
  'LOCATION',
  'RESERVE',
  'CUSTOM',
] as const;
export type QuickMessageType = (typeof QUICK_MESSAGE_TYPES)[number];

export const CONTACT_METHODS = ['chat', 'whatsapp', 'email'] as const;
export type ContactMethod = (typeof CONTACT_METHODS)[number];

export class CreateProductInquiryDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: 'El mensaje debe tener al menos 3 caracteres.' })
  @MaxLength(500, { message: 'El mensaje no puede exceder 500 caracteres.' })
  message: string;

  @IsOptional()
  @IsEnum(QUICK_MESSAGE_TYPES, { message: 'Tipo de mensaje rápido no válido.' })
  quickMessageType?: QuickMessageType;

  @IsOptional()
  @IsEnum(CONTACT_METHODS, { message: 'Método de contacto no válido.' })
  preferredContactMethod?: ContactMethod;
}
