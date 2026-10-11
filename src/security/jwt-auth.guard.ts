import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authorization = request.headers.authorization;
    const match = typeof authorization === 'string'
      ? /^Bearer ([^\s]+)$/i.exec(authorization)
      : null;
    if (!match) throw new UnauthorizedException('Se requiere un token Bearer.');

    const secret = this.config.getOrThrow<string>('JWT_SECRET');
    try {
      const payload = await this.jwtService.verifyAsync(match[1], {
        secret,
        algorithms: ['HS256'],
      });
      // Contrato con Auth: sub identifica al usuario y exp limita la sesión.
      if (typeof payload.sub !== 'string' || !payload.sub.trim() ||
          !Number.isInteger(payload.exp)) {
        throw new Error('Token sin identidad o expiración.');
      }
      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Token inválido o expirado.');
    }
  }
}
