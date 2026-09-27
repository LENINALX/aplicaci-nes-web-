import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { createTypeOrmConfig } from './config/typeorm.config';
import { OrdenesModule } from './ordenes/ordenes.module';

@Module({
	imports: [
		ConfigModule.forRoot({ isGlobal: true }),
		TypeOrmModule.forRoot(createTypeOrmConfig()),
		OrdenesModule,
	],
})
export class AppModule {}
