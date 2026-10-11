const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validate } = require('class-validator');
const { Cliente } = require('../dist/clientes/entities/cliente.entity');
const { CreateClienteDto } = require('../dist/clientes/dto/create-cliente.dto');
const { CreateVehiculoDto } = require('../dist/vehiculos/dto/create-vehiculo.dto');
const { ClientesService } = require('../dist/clientes/clientes.service');
const { VehiculosService } = require('../dist/vehiculos/vehiculos.service');
const { getMetadataArgsStorage } = require('typeorm');

const clienteId = '8f2d78df-55a7-4a24-8eef-4626bfbd9ee4';

test('los DTOs validan los campos obligatorios y el formato relacionado', async () => {
  const cliente = Object.assign(new CreateClienteDto(), {
    nombreCompleto: 'Ana Pérez',
    telefono: '+593991234567',
    email: 'ana@example.com',
  });
  const vehiculo = Object.assign(new CreateVehiculoDto(), {
    placa: 'ABC1234',
    marca: 'Toyota',
    modelo: 'Corolla',
    anio: 2020,
    clienteId,
  });

  assert.deepEqual(await validate(cliente), []);
  assert.deepEqual(await validate(vehiculo), []);
  assert.ok((await validate(Object.assign(new CreateVehiculoDto(), {
    placa: 'placa inválida',
    marca: '',
    modelo: 'Corolla',
    anio: 1800,
    clienteId: 'no-es-un-uuid',
  }))).length > 0);
});

test('la entidad declara relación many-to-one con borrado restringido', () => {
  const relation = getMetadataArgsStorage().relations.find(
    (item) => item.target === require('../dist/vehiculos/entities/vehiculo.entity').Vehiculo,
  );
  assert.ok(relation);
  assert.equal(relation.relationType, 'many-to-one');
  assert.equal(relation.options.onDelete, 'RESTRICT');
});

test('el CRUD consulta vehículos de un cliente existente', async () => {
  const cliente = { id: clienteId, nombreCompleto: 'Ana Pérez' };
  const vehiculos = [{ id: 'vehiculo-1', placa: 'ABC1234' }];
  const clientesRepository = {
    findOneBy: async () => cliente,
  };
  let query;
  const vehiculosRepository = {
    find: async (options) => {
      query = options;
      return vehiculos;
    },
  };
  const service = new ClientesService(clientesRepository, vehiculosRepository);

  assert.deepEqual(await service.findVehiculos(clienteId), vehiculos);
  assert.deepEqual(query.where, { cliente: { id: clienteId } });
  assert.deepEqual(query.order, { placa: 'ASC' });
});

test('el CRUD impide borrar clientes con vehículos asociados', async () => {
  const cliente = { id: clienteId };
  let removed = false;
  const clientesRepository = {
    findOneBy: async () => cliente,
    remove: async () => { removed = true; },
  };
  const vehiculosRepository = {
    exist: async () => true,
  };
  const service = new ClientesService(clientesRepository, vehiculosRepository);

  await assert.rejects(service.remove(clienteId), {
    status: 409,
    message: 'No se puede eliminar el cliente porque tiene vehículos asociados',
  });
  assert.equal(removed, false);
});

test('crear vehículo exige que exista el cliente asociado', async () => {
  const vehiculosRepository = {
    create: (value) => value,
    save: async (value) => value,
  };
  const clientesRepository = {
    findOneBy: async () => null,
  };
  const service = new VehiculosService(vehiculosRepository, clientesRepository);

  await assert.rejects(
    service.create({
      placa: 'ABC1234',
      marca: 'Toyota',
      modelo: 'Corolla',
      anio: 2020,
      clienteId,
    }),
    { status: 404, message: `No existe un cliente con id ${clienteId}` },
  );
});
