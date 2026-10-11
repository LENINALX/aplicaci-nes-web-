import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { PublicUser, User } from './users.entity';

const UNIQUE_VIOLATION = '23505';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(data: Pick<User, 'nombre' | 'email' | 'passwordHash'>): Promise<PublicUser> {
    if (await this.usersRepository.existsBy({ email: data.email })) {
      throw this.emailEnUso();
    }
    try {
      const { passwordHash, ...user } = await this.usersRepository.save(
        this.usersRepository.create(data),
      );
      return user;
    } catch (error) {
      // Dos registros simultáneos con el mismo email: lo detiene la restricción única.
      if (error instanceof QueryFailedError && (error.driverError as { code?: string })?.code === UNIQUE_VIOLATION) {
        throw this.emailEnUso();
      }
      throw error;
    }
  }

  // Única consulta que incluye el hash; solo la usa el login.
  findByEmailWithPassword(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email },
      select: { id: true, email: true, nombre: true, tenantId: true, passwordHash: true },
    });
  }

  findById(id: string): Promise<PublicUser | null> {
    return this.usersRepository.findOneBy({ id });
  }

  private emailEnUso() {
    return new ConflictException('Ya existe un usuario con ese email.');
  }
}
