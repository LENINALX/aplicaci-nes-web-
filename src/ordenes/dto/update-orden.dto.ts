// DTO de actualización de orden: mismos campos que la creación, todos opcionales
import { PartialType } from '@nestjs/mapped-types';
import { CreateOrdenDto } from './create-orden.dto';

// Omitir un campo conserva su valor; null solo se acepta en columnas anulables.
export class UpdateOrdenDto extends PartialType(CreateOrdenDto, {
  skipNullProperties: false,
}) {}
