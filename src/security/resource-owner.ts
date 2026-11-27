import { ForbiddenException } from '@nestjs/common';
import { Role } from '../common/enums/role.enum';
import { PublicUser } from '../users/users.entity';

export function assertResourceOwner(
  ownerId: string | null,
  actor: Pick<PublicUser, 'id' | 'role'>,
): void {
  if (actor.role !== Role.ADMIN && ownerId !== actor.id) {
    throw new ForbiddenException('Solo el propietario o un administrador puede modificar este recurso.');
  }
}
