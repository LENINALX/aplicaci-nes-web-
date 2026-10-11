import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { ClientesService } from './clientes.service';

@Controller('clientes')
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}

  @Get()
  findAll() {
    return this.clientesService.findAll();
  }

  @Get(':id/vehiculos')
  findVehiculos(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.clientesService.findVehiculos(id);
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.clientesService.findOne(id);
  }

  @Post()
  create(@Body() createClienteDto: CreateClienteDto) {
    return this.clientesService.create(createClienteDto);
  }

  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() updateClienteDto: UpdateClienteDto,
  ) {
    return this.clientesService.update(id, updateClienteDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.clientesService.remove(id);
  }
}
