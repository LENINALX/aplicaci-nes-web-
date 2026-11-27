import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Role } from '../common/enums/role.enum';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  // Se guarda en minúsculas (lo normaliza el DTO).
  @Column({ type: 'varchar', length: 120, unique: true })
  email: string;

  // Hash bcrypt (60 caracteres). select: false evita devolverlo en las consultas.
  @Column({ type: 'varchar', length: 60, select: false })
  passwordHash: string;

  @Column({ type: 'enum', enum: Role, enumName: 'user_role', default: Role.USER })
  role: Role;

  // Semilla SaaS: cada taller será un tenant
  @Index()
  @Column({ type: 'varchar', length: 50, default: 'default' })
  tenantId: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}

export type PublicUser = Omit<User, 'passwordHash'>;
