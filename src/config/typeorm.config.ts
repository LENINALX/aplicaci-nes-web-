import { ConfigService } from '@nestjs/config';
import type { TypeOrmModuleOptions } from '@nestjs/typeorm';

export function typeOrmConfig(config: ConfigService): TypeOrmModuleOptions {
  return {
    type: 'postgres',
    host: config.getOrThrow<string>('DB_HOST'),
    port: config.getOrThrow<number>('DB_PORT'),
    username: config.getOrThrow<string>('DB_USER'),
    password: config.getOrThrow<string>('DB_PASS'),
    database: config.getOrThrow<string>('DB_NAME'),
    autoLoadEntities: true,
    // Activar únicamente en desarrollo local; producción requiere migraciones.
    synchronize: config.getOrThrow<boolean>('DB_SYNC'),
  };
}
