import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { Repository } from 'typeorm';
import { CreateOrdenDto } from './dto/create-orden.dto';
import { UpdateOrdenDto } from './dto/update-orden.dto';
import { OrdenReparacion } from './entities/orden-reparacion.entity';

@Injectable()
export class OrdenesService {
	constructor(
		@InjectRepository(OrdenReparacion)
		private readonly ordenesRepository: Repository<OrdenReparacion>,
	) {}

	findAll(): Promise<OrdenReparacion[]> {
		return this.ordenesRepository.find({ order: { createdAt: 'DESC' } });
	}

	async findOne(id: string): Promise<OrdenReparacion> {
		const orden = await this.ordenesRepository.findOneBy({ id });
		if (!orden) {
			throw new NotFoundException(`No existe una orden con id ${id}`);
		}
		return orden;
	}

	create(createOrdenDto: CreateOrdenDto): Promise<OrdenReparacion> {
		const year = new Date().getFullYear();
		const orden = this.ordenesRepository.create({
			...createOrdenDto,
			codigo: `OR-${year}-${randomUUID().slice(0, 8).toUpperCase()}`,
		});
		return this.ordenesRepository.save(orden);
	}

	async update(
		id: string,
		updateOrdenDto: UpdateOrdenDto,
	): Promise<OrdenReparacion> {
		const orden = await this.findOne(id);
		this.ordenesRepository.merge(orden, updateOrdenDto);
		return this.ordenesRepository.save(orden);
	}

	async remove(id: string): Promise<void> {
		const orden = await this.findOne(id);
		await this.ordenesRepository.remove(orden);
	}
}
