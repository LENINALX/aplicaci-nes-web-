import {
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  MaxLength,
  Min,
  IsUUID,
  Matches,
} from 'class-validator';

export class CreateVehiculoDto {
  @IsString()
  @Matches(/^[A-Z0-9-]{5,10}$/, {
    message: 'placa debe tener entre 5 y 10 caracteres alfanuméricos',
  })
  placa: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  marca: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  modelo: string;

  @IsInt()
  @Min(1950)
  @Max(new Date().getFullYear() + 1)
  anio: number;

  @IsUUID('4')
  clienteId: string;
}
