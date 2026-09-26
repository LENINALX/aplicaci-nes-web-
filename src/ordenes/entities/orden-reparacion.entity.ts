// Entidad OrdenReparacion (TypeORM)
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EstadoOrden } from '../enums/estado-orden.enum';
import { TipoServicio } from '../enums/tipo-servicio.enum';

@Entity('ordenes_reparacion')
export class OrdenReparacion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Código visible para el taller, ej. OR-2026-0001 (lo genera el service)
  @Column({ type: 'varchar', length: 20, unique: true })
  codigo: string;

  // Semilla SaaS: cada taller será un tenant
  @Index()
  @Column({ type: 'varchar', length: 50, default: 'default' })
  tenantId: string;

  // Datos del vehículo (embebidos en Etapa 1)
  @Column({ type: 'varchar', length: 10 })
  placaVehiculo: string;

  @Column({ type: 'varchar', length: 50 })
  marca: string;

  @Column({ type: 'varchar', length: 50 })
  modelo: string;

  @Column({ type: 'int' })
  anio: number;

  // Datos del cliente (embebidos en Etapa 1)
  @Column({ type: 'varchar', length: 100 })
  nombreCliente: string;

  @Column({ type: 'varchar', length: 15 })
  telefonoCliente: string;

  @Column({ type: 'enum', enum: TipoServicio })
  tipoServicio: TipoServicio;

  @Column({ type: 'text' })
  descripcionDanio: string;

  @Column({ type: 'enum', enum: EstadoOrden, default: EstadoOrden.RECIBIDO })
  estado: EstadoOrden;

  // PostgreSQL devuelve numeric como string; se convierte a number
  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
    default: 0,
    transformer: {
      to: (value?: number) => value,
      from: (value: string | null) => (value === null ? null : Number(value)),
    },
  })
  costoEstimado: number;

  @Column({ type: 'date', default: () => 'CURRENT_DATE' })
  fechaIngreso: string;

  @Column({ type: 'date', nullable: true })
  fechaEstimadaEntrega: string | null;

  @Column({ type: 'text', nullable: true })
  notas: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
