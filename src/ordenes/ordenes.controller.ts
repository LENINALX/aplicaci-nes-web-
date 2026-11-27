import { Role } from '../common/enums/role.enum';
import { Roles } from '../security/roles.decorator';
import { RolesGuard } from '../security/roles.guard';
import { PublicUser } from '../users/users.entity';
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
	Req,
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
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles(Role.ADMIN)
	findAll(@Query() query: PaginationQueryDto) {
		return this.ordenesService.findAll(query);
	}

	@Get(':id')
	findOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
		return this.ordenesService.findOne(id);
	}

	@Post()
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles(Role.ADMIN, Role.USER)
	create(
		@Body() createOrdenDto: CreateOrdenDto,
		@Req() request: { user: PublicUser },
	) {
		return this.ordenesService.create(createOrdenDto, request.user.id);
	}

	@Patch(':id')
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles(Role.ADMIN, Role.USER)
	update(
		@Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
		@Body() updateOrdenDto: UpdateOrdenDto,
		@Req() request: { user: PublicUser },
	) {
		return this.ordenesService.update(id, updateOrdenDto, request.user);
	}

	@Delete(':id')
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles(Role.ADMIN, Role.USER)
	@HttpCode(HttpStatus.NO_CONTENT)
	remove(
		@Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
		@Req() request: { user: PublicUser },
	) {
		return this.ordenesService.remove(id, request.user);
	}
}
