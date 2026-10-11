const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Module, ValidationPipe } = require('@nestjs/common');
const { NestFactory } = require('@nestjs/core');
const { ConfigModule, ConfigService } = require('@nestjs/config');
const { JwtService } = require('@nestjs/jwt');
const { SecurityModule } = require('../dist/security/security.module');
const { JwtAuthGuard } = require('../dist/security/jwt-auth.guard');
const { OrdenesController } = require('../dist/ordenes/ordenes.controller');
const { OrdenesService } = require('../dist/ordenes/ordenes.service');

const secret = 'only-for-tests-secret-at-least-32-characters';
const jwt = new JwtService({ secret });
const id = '00000000-0000-4000-8000-000000000001';
const body = {
  placaVehiculo: 'ABC123', marca: 'Toyota', modelo: 'Corolla', anio: 2020,
  nombreCliente: 'Ana Pérez', telefonoCliente: '+593991234567',
  tipoServicio: 'PINTURA', descripcionDanio: 'Rayón en puerta', costoEstimado: 250.5,
};

test('HTTP: protección real de órdenes con JWT (servicio de datos simulado)', async (t) => {
  let writes = 0;
  const service = {
    findAll: () => [], findOne: () => ({ id }),
    create: (data) => { writes++; return { id, ...data }; },
    update: (id, data) => { writes++; return { id, ...data }; },
    remove: () => { writes++; },
  };
  class TestAppModule {}
  Module({
    imports: [ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true, skipProcessEnv: true, load: [() => ({ JWT_SECRET: secret })] }), SecurityModule],
    controllers: [OrdenesController],
    providers: [{ provide: OrdenesService, useValue: service }],
  })(TestAppModule);
  const app = await NestFactory.create(TestAppModule, { logger: false, abortOnError: false });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
  await app.listen(0, '127.0.0.1');
  t.after(() => app.close());
  const base = await app.getUrl();
  const request = (method, path, token, data) => fetch(base + path, {
    method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: token } : {}) },
    body: data === undefined ? undefined : JSON.stringify(data),
  });
  assert.equal((await request('GET', '/ordenes')).status, 200);
  assert.equal((await request('GET', `/ordenes/${id}`)).status, 200);
  const invalid = [
    undefined, 'Basic abc', 'Bearer basura',
    `Bearer ${jwt.sign({ sub: id }, { expiresIn: -1 })}`,
    `Bearer ${new JwtService({ secret: 'wrong-secret' }).sign({ sub: id }, { expiresIn: 60 })}`,
    `Bearer ${jwt.sign({ sub: id }, { algorithm: 'HS384', expiresIn: 60 })}`,
    `Bearer ${jwt.sign({ sub: id })}`,
    `Bearer ${jwt.sign({}, { expiresIn: 60 })}`,
  ];
  for (const token of invalid) {
    for (const [method, path, data] of [['POST', '/ordenes', body], ['PATCH', `/ordenes/${id}`, {}], ['DELETE', `/ordenes/${id}`]]) {
      assert.equal((await request(method, path, token, data)).status, 401, `${method}: rechaza credencial inválida`);
    }
  }
  assert.equal(writes, 0, 'peticiones rechazadas no llegan al servicio');
  const token = `Bearer ${jwt.sign({ sub: id }, { expiresIn: 60 })}`;
  assert.equal((await request('POST', '/ordenes', token, body)).status, 201);
  assert.equal((await request('PATCH', `/ordenes/${id}`, token, { estado: 'LISTO' })).status, 200);
  assert.equal((await request('DELETE', `/ordenes/${id}`, token)).status, 204);
  assert.equal(writes, 3);
  assert.equal((await request('POST', '/ordenes', token, {})).status, 400);
});

test('el guard permite que los controladores lean request.user', async () => {
  const guard = new JwtAuthGuard(jwt, new ConfigService({ JWT_SECRET: secret }));
  const request = { headers: { authorization: `Bearer ${jwt.sign({ sub: id }, { expiresIn: 60 })}` } };
  assert.equal(await guard.canActivate({ switchToHttp: () => ({ getRequest: () => request }) }), true);
  assert.equal(request.user.sub, id);
});
