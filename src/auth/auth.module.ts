import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';

// Duración del token en segundos; por defecto 1 hora.
function jwtExpiresIn(config: ConfigService): number {
  const value = Number(config.get('JWT_EXPIRES_IN') ?? 3600);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error('JWT_EXPIRES_IN debe ser un número entero de segundos mayor que 0.');
  }
  return value;
}

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: { algorithm: 'HS256', expiresIn: jwtExpiresIn(config) },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
