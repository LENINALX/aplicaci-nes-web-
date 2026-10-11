import { Transform } from 'class-transformer';
import {
  IsByteLength,
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateUserDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail()
  @MaxLength(120)
  email: string;

  // bcrypt solo usa los primeros 72 bytes de la contraseña.
  @IsString()
  @MinLength(8)
  @IsByteLength(0, 72, { message: 'password no debe superar 72 bytes' })
  password: string;
}
