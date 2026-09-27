import { Body,Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post} 
from '@nestjs/common';
import { CreateOrdenDto } from './dto/create-orden.dto';
import { UpdateOrdenDto } from './dto/update-orden.dto';
import { OrdenesService } from './ordenes.service';

@Controller('ordenes')
export class OrdenesController {
	constructor(private readonly ordenesService: OrdenesService) {}

	@Get()
	findAll() {
		return this.ordenesService.findAll();
	}

	@Get(':id')
	findOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
		return this.ordenesService.findOne(id);
	}

	@Post()
	create(@Body() createOrdenDto: CreateOrdenDto) {
		return this.ordenesService.create(createOrdenDto);
	}

	@Patch(':id')
	update(
		@Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
		@Body() updateOrdenDto: UpdateOrdenDto,
	) {
		return this.ordenesService.update(id, updateOrdenDto);
	}

	@Delete(':id')
	@HttpCode(HttpStatus.NO_CONTENT)
	remove(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
		return this.ordenesService.remove(id);
	}
}
