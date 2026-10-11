import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from './config/typeorm.config';
import { validateEnvironment } from './config/env.validation';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClientesModule } from './clientes/clientes.module';
import { OrdenesModule } from './ordenes/ordenes.module';
import { VehiculosModule } from './vehiculos/vehiculos.module';

@Module({
	imports: [
		ConfigModule.forRoot({ isGlobal: true, cache: true, validate: validateEnvironment }),
		TypeOrmModule.forRootAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: typeOrmConfig,
		}),
		OrdenesModule,
		ClientesModule,
		VehiculosModule,
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
