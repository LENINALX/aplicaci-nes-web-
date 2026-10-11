import { SecurityModule } from '../security/security.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vehiculo } from '../vehiculos/entities/vehiculo.entity';
import { Cliente } from './entities/cliente.entity';
import { ClientesController } from './clientes.controller';
import { ClientesService } from './clientes.service';

@Module({
  imports: [SecurityModule, TypeOrmModule.forFeature([Cliente, Vehiculo])],
  controllers: [ClientesController],
  providers: [ClientesService],
})
export class ClientesModule {}
