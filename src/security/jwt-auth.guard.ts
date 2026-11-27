import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { isUUID } from 'class-validator';
import { UsersService } from '../users/users.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authorization = request.headers.authorization;
    const match = typeof authorization === 'string'
      ? /^Bearer ([^\s]+)$/i.exec(authorization)
      : null;
    if (!match) throw new UnauthorizedException('Se requiere un token Bearer.');

    const secret = this.config.getOrThrow<string>('JWT_SECRET');
    let payload: { sub?: string; exp?: number };
    try {
      payload = await this.jwtService.verifyAsync(match[1], {
        secret,
        algorithms: ['HS256'],
      });
    } catch {
      throw new UnauthorizedException('Token inválido o expirado.');
    }

    if (typeof payload.sub !== 'string' || !isUUID(payload.sub) || !Number.isInteger(payload.exp)) {
      throw new UnauthorizedException('Token sin identidad o expiración.');
    }
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('El usuario del token ya no existe.');
    }
    request.user = user;
    return true;
  }
}
