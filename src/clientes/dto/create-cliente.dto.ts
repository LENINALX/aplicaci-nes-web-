import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  Matches,
  ValidateIf,
} from 'class-validator';

export class CreateClienteDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombreCompleto: string;

  @IsString()
  @Matches(/^\+?\d{7,14}$/, {
    message: 'telefono debe tener entre 7 y 14 dígitos (se permite + al inicio)',
  })
  telefono: string;

  @ValidateIf((_, value) => value !== undefined)
  @IsEmail()
  @MaxLength(120)
  email?: string;
}
