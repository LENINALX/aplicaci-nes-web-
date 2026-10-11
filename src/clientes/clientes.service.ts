import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehiculo } from '../vehiculos/entities/vehiculo.entity';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { Cliente } from './entities/cliente.entity';

@Injectable()
export class ClientesService {
  constructor(
    @InjectRepository(Cliente)
    private readonly clientesRepository: Repository<Cliente>,
    @InjectRepository(Vehiculo)
    private readonly vehiculosRepository: Repository<Vehiculo>,
  ) {}

  findAll(): Promise<Cliente[]> {
    return this.clientesRepository.find({ order: { nombreCompleto: 'ASC' } });
  }

  async findOne(id: string): Promise<Cliente> {
    const cliente = await this.clientesRepository.findOneBy({ id });
    if (!cliente) {
      throw new NotFoundException(`No existe un cliente con id ${id}`);
    }
    return cliente;
  }

  async findVehiculos(id: string): Promise<Vehiculo[]> {
    await this.findOne(id);
    return this.vehiculosRepository.find({
      where: { cliente: { id } },
      order: { placa: 'ASC' },
    });
  }

  create(createClienteDto: CreateClienteDto): Promise<Cliente> {
    return this.clientesRepository.save(
      this.clientesRepository.create(createClienteDto),
    );
  }

  async update(
    id: string,
    updateClienteDto: UpdateClienteDto,
  ): Promise<Cliente> {
    const cliente = await this.findOne(id);
    this.clientesRepository.merge(cliente, updateClienteDto);
    return this.clientesRepository.save(cliente);
  }

  async remove(id: string): Promise<void> {
    const cliente = await this.findOne(id);
    const tieneVehiculos = await this.vehiculosRepository.exist({
      where: { cliente: { id } },
    });
    if (tieneVehiculos) {
      throw new ConflictException(
        'No se puede eliminar el cliente porque tiene vehículos asociados',
      );
    }
    await this.clientesRepository.remove(cliente);
  }
}
