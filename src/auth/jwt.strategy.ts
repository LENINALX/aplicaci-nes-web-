import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { isUUID } from 'class-validator';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PublicUser } from '../users/users.entity';
import { UsersService } from '../users/users.service';

// Contrato con JwtAuthGuard (integrante 2): HS256, sub = id del usuario, exp obligatorio.
export interface JwtPayload {
  sub: string;
  email: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
      algorithms: ['HS256'],
    });
  }

  // Passport ya verificó firma y expiración; aquí se comprueba que el usuario exista.
  async validate(payload: JwtPayload): Promise<PublicUser> {
    if (!isUUID(payload.sub) || !Number.isInteger(payload.exp)) {
      throw new UnauthorizedException('Token sin identidad o expiración.');
    }
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('El usuario del token ya no existe.');
    }
    return user;
  }
}
