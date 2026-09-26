// DTO de creación de orden
// id, codigo, tenantId, createdAt y updatedAt los asigna el sistema
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { EstadoOrden } from '../enums/estado-orden.enum';
import { TipoServicio } from '../enums/tipo-servicio.enum';

export class CreateOrdenDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  placaVehiculo: string;

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

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombreCliente: string;

  @Matches(/^\+?\d{7,14}$/, {
    message: 'telefonoCliente debe tener entre 7 y 14 dígitos (se permite + al inicio)',
  })
  telefonoCliente: string;

  @IsEnum(TipoServicio)
  tipoServicio: TipoServicio;

  @IsString()
  @IsNotEmpty()
  descripcionDanio: string;

  // Si no se envía, la entidad asigna RECIBIDO
  @IsOptional()
  @IsEnum(EstadoOrden)
  estado?: EstadoOrden;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(99999999.99)
  costoEstimado?: number;

  // Formato YYYY-MM-DD; si no se envía, se usa la fecha actual
  @IsOptional()
  @IsDateString()
  fechaIngreso?: string;

  @IsOptional()
  @IsDateString()
  fechaEstimadaEntrega?: string;

  @IsOptional()
  @IsString()
  notas?: string;
}
