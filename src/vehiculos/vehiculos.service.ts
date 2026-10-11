import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cliente } from '../clientes/entities/cliente.entity';
import { CreateVehiculoDto } from './dto/create-vehiculo.dto';
import { UpdateVehiculoDto } from './dto/update-vehiculo.dto';
import { Vehiculo } from './entities/vehiculo.entity';

@Injectable()
export class VehiculosService {
  constructor(
    @InjectRepository(Vehiculo)
    private readonly vehiculosRepository: Repository<Vehiculo>,
    @InjectRepository(Cliente)
    private readonly clientesRepository: Repository<Cliente>,
  ) {}

  findAll(): Promise<Vehiculo[]> {
    return this.vehiculosRepository.find({
      relations: { cliente: true },
      order: { placa: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Vehiculo> {
    const vehiculo = await this.vehiculosRepository.findOne({
      where: { id },
      relations: { cliente: true },
    });
    if (!vehiculo) {
      throw new NotFoundException(`No existe un vehículo con id ${id}`);
    }
    return vehiculo;
  }

  async create(createVehiculoDto: CreateVehiculoDto): Promise<Vehiculo> {
    const cliente = await this.findCliente(createVehiculoDto.clienteId);
    const { clienteId: _clienteId, ...datosVehiculo } = createVehiculoDto;
    return this.vehiculosRepository.save(
      this.vehiculosRepository.create({ ...datosVehiculo, cliente }),
    );
  }

  async update(
    id: string,
    updateVehiculoDto: UpdateVehiculoDto,
  ): Promise<Vehiculo> {
    const vehiculo = await this.findOne(id);
    const { clienteId, ...datosVehiculo } = updateVehiculoDto;
    this.vehiculosRepository.merge(vehiculo, datosVehiculo);
    if (clienteId !== undefined) {
      vehiculo.cliente = await this.findCliente(clienteId);
    }
    return this.vehiculosRepository.save(vehiculo);
  }

  async remove(id: string): Promise<void> {
    const vehiculo = await this.findOne(id);
    await this.vehiculosRepository.remove(vehiculo);
  }

  private async findCliente(id: string): Promise<Cliente> {
    const cliente = await this.clientesRepository.findOneBy({ id });
    if (!cliente) {
      throw new NotFoundException(`No existe un cliente con id ${id}`);
    }
    return cliente;
  }
}
