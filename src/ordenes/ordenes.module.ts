import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdenReparacion } from './entities/orden-reparacion.entity';
import { OrdenesController } from './ordenes.controller';
import { OrdenesService } from './ordenes.service';

@Module({
	imports: [TypeOrmModule.forFeature([OrdenReparacion])],
	controllers: [OrdenesController],
	providers: [OrdenesService],
})
export class OrdenesModule {}
