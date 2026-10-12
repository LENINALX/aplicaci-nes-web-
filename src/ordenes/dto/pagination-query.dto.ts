import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { EstadoOrden } from '../enums/estado-orden.enum';
import { TipoServicio } from '../enums/tipo-servicio.enum';

export enum OrdenesSortBy {
  CODIGO = 'codigo',
  FECHA_INGRESO = 'fechaIngreso',
  CREATED_AT = 'createdAt',
  COSTO_ESTIMADO = 'costoEstimado',
}

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 10;

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MaxLength(100)
  q?: string;

  @IsOptional()
  @IsEnum(EstadoOrden)
  estado?: EstadoOrden;

  @IsOptional()
  @IsEnum(TipoServicio)
  tipoServicio?: TipoServicio;

  @IsOptional()
  @IsEnum(OrdenesSortBy)
  sortBy: OrdenesSortBy = OrdenesSortBy.CREATED_AT;

  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder: SortOrder = SortOrder.DESC;
}
