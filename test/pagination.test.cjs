const { test } = require('node:test');
const assert = require('node:assert/strict');
require('reflect-metadata');
const { plainToInstance } = require('class-transformer');
const { validate } = require('class-validator');
const { EstadoOrden } = require('../dist/ordenes/enums/estado-orden.enum');
const { TipoServicio } = require('../dist/ordenes/enums/tipo-servicio.enum');
const {
  OrdenesSortBy,
  PaginationQueryDto,
  SortOrder,
} = require('../dist/ordenes/dto/pagination-query.dto');
const { OrdenesService } = require('../dist/ordenes/ordenes.service');

test('valida y transforma parámetros de página, filtro y orden', async () => {
  const query = plainToInstance(PaginationQueryDto, {
    page: '2',
    limit: '25',
    q: '  Toyota  ',
    estado: EstadoOrden.RECIBIDO,
    tipoServicio: TipoServicio.PINTURA,
    sortBy: OrdenesSortBy.CODIGO,
    sortOrder: SortOrder.ASC,
  });

  assert.deepEqual(await validate(query), []);
  assert.equal(query.page, 2);
  assert.equal(query.limit, 25);
  assert.equal(query.q, 'Toyota');
});

test('aplica valores predeterminados cuando no se envían query params', async () => {
  const query = plainToInstance(PaginationQueryDto, {});

  assert.deepEqual(await validate(query), []);
  assert.equal(query.page, 1);
  assert.equal(query.limit, 10);
  assert.equal(query.sortBy, OrdenesSortBy.CREATED_AT);
  assert.equal(query.sortOrder, SortOrder.DESC);
});

for (const params of [
  { page: '0' },
  { limit: '101' },
  { page: '1.5' },
  { estado: 'INVALIDO' },
  { tipoServicio: 'INVALIDO' },
  { sortBy: 'nombreCliente' },
  { sortOrder: 'RANDOM' },
]) {
  test(`rechaza parámetros inválidos: ${JSON.stringify(params)}`, async () => {
    const query = plainToInstance(PaginationQueryDto, params);
    assert.notDeepEqual(await validate(query), []);
  });
}

test('filtra y pagina órdenes con ordenamiento permitido y metadatos', async () => {
  const calls = [];
  const rows = [{ id: 'orden-1' }];
  const queryBuilder = {
    andWhere: (...args) => { calls.push(['andWhere', ...args]); return queryBuilder; },
    orderBy: (...args) => { calls.push(['orderBy', ...args]); return queryBuilder; },
    addOrderBy: (...args) => { calls.push(['addOrderBy', ...args]); return queryBuilder; },
    skip: (...args) => { calls.push(['skip', ...args]); return queryBuilder; },
    take: (...args) => { calls.push(['take', ...args]); return queryBuilder; },
    getManyAndCount: async () => [rows, 21],
  };
  const service = new OrdenesService({
    createQueryBuilder: () => queryBuilder,
  });
  const query = plainToInstance(PaginationQueryDto, {
    page: '2',
    limit: '10',
    q: 'Toyota',
    estado: EstadoOrden.RECIBIDO,
    tipoServicio: TipoServicio.PINTURA,
    sortBy: OrdenesSortBy.CODIGO,
    sortOrder: SortOrder.ASC,
  });

  const result = await service.findAll(query);

  assert.deepEqual(result, {
    data: rows,
    meta: { totalItems: 21, totalPages: 3, page: 2, limit: 10 },
  });
  assert.equal(calls.filter(([method]) => method === 'andWhere').length, 3);
  assert.deepEqual(calls.find(([method]) => method === 'orderBy'), [
    'orderBy',
    'orden.codigo',
    'ASC',
  ]);
  assert.deepEqual(calls.find(([method]) => method === 'skip'), ['skip', 10]);
  assert.deepEqual(calls.find(([method]) => method === 'take'), ['take', 10]);
});
