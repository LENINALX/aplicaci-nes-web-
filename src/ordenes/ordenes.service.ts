import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { Repository } from 'typeorm';
import { CreateOrdenDto } from './dto/create-orden.dto';
import {
	OrdenesSortBy,
	PaginationQueryDto,
	SortOrder,
} from './dto/pagination-query.dto';
import { UpdateOrdenDto } from './dto/update-orden.dto';
import { OrdenReparacion } from './entities/orden-reparacion.entity';

const sortColumns: Record<OrdenesSortBy, string> = {
	[OrdenesSortBy.CODIGO]: 'orden.codigo',
	[OrdenesSortBy.FECHA_INGRESO]: 'orden.fechaIngreso',
	[OrdenesSortBy.CREATED_AT]: 'orden.createdAt',
	[OrdenesSortBy.COSTO_ESTIMADO]: 'orden.costoEstimado',
};

@Injectable()
export class OrdenesService {
	constructor(
		@InjectRepository(OrdenReparacion)
		private readonly ordenesRepository: Repository<OrdenReparacion>,
	) {}

	async findAll(query: PaginationQueryDto): Promise<{
		data: OrdenReparacion[];
		meta: {
			totalItems: number;
			totalPages: number;
			page: number;
			limit: number;
		};
	}> {
		const { page, limit } = query;
		const queryBuilder = this.ordenesRepository.createQueryBuilder('orden');

		if (query.estado) {
			queryBuilder.andWhere('orden.estado = :estado', {
				estado: query.estado,
			});
		}
		if (query.tipoServicio) {
			queryBuilder.andWhere('orden.tipoServicio = :tipoServicio', {
				tipoServicio: query.tipoServicio,
			});
		}
		if (query.q?.trim()) {
			queryBuilder.andWhere(
				`(
					"orden"."codigo" ILIKE :search OR
					"orden"."placaVehiculo" ILIKE :search OR
					"orden"."marca" ILIKE :search OR
					"orden"."modelo" ILIKE :search OR
					"orden"."nombreCliente" ILIKE :search OR
					"orden"."descripcionDanio" ILIKE :search
				)`,
				{ search: `%${query.q.trim()}%` },
			);
		}

		const [data, totalItems] = await queryBuilder
			.orderBy(
				sortColumns[query.sortBy ?? OrdenesSortBy.CREATED_AT],
				query.sortOrder ?? SortOrder.DESC,
			)
			.addOrderBy('orden.id', 'ASC')
			.skip((page - 1) * limit)
			.take(limit)
			.getManyAndCount();

		return {
			data,
			meta: {
				totalItems,
				totalPages: Math.ceil(totalItems / limit),
				page,
				limit,
			},
		};
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
