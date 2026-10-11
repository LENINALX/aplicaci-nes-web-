import { ConfigService } from '@nestjs/config';
import type { TypeOrmModuleOptions } from '@nestjs/typeorm';
import type { DataSourceOptions } from 'typeorm';
import { join } from 'node:path';

// Una misma configuración para Nest y el CLI, en src (TS) y dist (JS).
export function databaseOptions(config: ConfigService): DataSourceOptions {
  return {
    type: 'postgres',
    host: config.getOrThrow<string>('DB_HOST'),
    port: config.getOrThrow<number>('DB_PORT'),
    username: config.getOrThrow<string>('DB_USER'),
    password: config.getOrThrow<string>('DB_PASS'),
    database: config.getOrThrow<string>('DB_NAME'),
    entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],
    migrations: [join(__dirname, '..', 'migrations', '*.{ts,js}')],
    migrationsTableName: 'typeorm_migrations',
    synchronize: false,
    migrationsRun: false,
  };
}

export function typeOrmConfig(config: ConfigService): TypeOrmModuleOptions {
  return { ...databaseOptions(config), autoLoadEntities: true };
}
