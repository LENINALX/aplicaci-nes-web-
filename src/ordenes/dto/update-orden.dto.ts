// DTO de actualización de orden: mismos campos que la creación, todos opcionales
import { PartialType } from '@nestjs/mapped-types';
import { CreateOrdenDto } from './create-orden.dto';

export class UpdateOrdenDto extends PartialType(CreateOrdenDto) {}
