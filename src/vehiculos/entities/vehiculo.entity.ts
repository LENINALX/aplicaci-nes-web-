import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Cliente } from '../../clientes/entities/cliente.entity';

@Entity('vehiculos')
export class Vehiculo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 10, unique: true })
  placa: string;

  @Column({ type: 'varchar', length: 50 })
  marca: string;

  @Column({ type: 'varchar', length: 50 })
  modelo: string;

  @Column({ type: 'int' })
  anio: number;

  @ManyToOne(() => Cliente, (cliente) => cliente.vehiculos, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'clienteId' })
  cliente: Cliente;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
