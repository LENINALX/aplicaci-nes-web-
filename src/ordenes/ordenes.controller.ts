import { JwtAuthGuard } from '../security/jwt-auth.guard';
import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	ParseUUIDPipe,
	Patch,
	Post,
	Query,
	UseGuards,
} from '@nestjs/common';
import { CreateOrdenDto } from './dto/create-orden.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { UpdateOrdenDto } from './dto/update-orden.dto';
import { OrdenesService } from './ordenes.service';

@Controller('ordenes')
export class OrdenesController {
	constructor(private readonly ordenesService: OrdenesService) {}

	@Get()
	findAll(@Query() query: PaginationQueryDto) {
		return this.ordenesService.findAll(query);
	}

	@Get(':id')
	findOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
		return this.ordenesService.findOne(id);
	}

	@Post()
	@UseGuards(JwtAuthGuard)
	create(@Body() createOrdenDto: CreateOrdenDto) {
		return this.ordenesService.create(createOrdenDto);
	}

	@Patch(':id')
	@UseGuards(JwtAuthGuard)
	update(
		@Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
		@Body() updateOrdenDto: UpdateOrdenDto,
	) {
		return this.ordenesService.update(id, updateOrdenDto);
	}

	@Delete(':id')
	@UseGuards(JwtAuthGuard)
	@HttpCode(HttpStatus.NO_CONTENT)
	remove(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
		return this.ordenesService.remove(id);
	}
}
