import { TypeOrmModuleOptions } from "@nestjs/typeorm";

export function createTypeOrmConfig(): TypeOrmModuleOptions {
	return {
		type: 'postgres',
		host: process.env.DB_HOST ?? 'localhost',
		port: Number(process.env.DB_PORT ?? 5432),
		username: process.env.DB_USER ?? 'postgres',
		password: process.env.DB_PASS ?? '',
		database: process.env.DB_NAME ?? 'autobodyops',
		autoLoadEntities: true,
		synchronize: process.env.NODE_ENV !== 'production',
	};
}
