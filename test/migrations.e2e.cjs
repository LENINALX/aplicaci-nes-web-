const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomBytes } = require('node:crypto');
const { spawnSync } = require('node:child_process');
const { Client } = require('pg');
const { ConfigModule, ConfigService } = require('@nestjs/config');
const { DataSource } = require('typeorm');
const { NestFactory } = require('@nestjs/core');
const { ValidationPipe } = require('@nestjs/common');
const { databaseOptions } = require('../dist/config/typeorm.config');
const { validateDatabaseEnvironment } = require('../dist/config/env.validation');

// Crea su propia base y solo elimina esa base. Requiere permiso CREATEDB.
test('PostgreSQL real: migraciones reversibles y JWT del login en todos los CRUD', { timeout: 180000 }, async (t) => {
  await ConfigModule.forRoot({ validate: validateDatabaseEnvironment });
  const config = validateDatabaseEnvironment(process.env);
  const name = `integrante2_${randomBytes(8).toString('hex')}`;
  const admin = new Client({ host: config.DB_HOST, port: config.DB_PORT, user: config.DB_USER, password: config.DB_PASS, database: config.DB_NAME });
  await admin.connect();
  let created = false;
  let source;
  let app;
  t.after(async () => {
    try {
      if (app) await app.close();
      if (source?.isInitialized) await source.destroy();
      if (created) await admin.query(`DROP DATABASE "${name}" WITH (FORCE)`);
    } finally { await admin.end(); }
  });
  await admin.query(`CREATE DATABASE "${name}"`);
  created = true;
  Object.assign(process.env, { DB_NAME: name, DB_SYNC: 'false', JWT_SECRET: randomBytes(32).toString('hex'), JWT_EXPIRES_IN: '3600' });
  function cli(command, compiled = false, extra = []) {
    const result = spawnSync(process.execPath, [
      ...(compiled ? [] : ['-r', 'ts-node/register']),
      'node_modules/typeorm/cli.js', command, '-d', compiled ? 'dist/data-source.js' : 'src/data-source.ts', ...extra,
    ], { env: process.env, encoding: 'utf8', timeout: 30000 });
    assert.equal(result.status, 0, `${command}: ${result.error ?? ''}\n${result.stdout}\n${result.stderr}`);
    return result.stdout;
  }
  cli('migration:run');
  source = new DataSource(databaseOptions(new ConfigService(validateDatabaseEnvironment(process.env))));
  await source.initialize();
  assert.equal(await source.showMigrations(), false);
  const applied = await source.query('SELECT * FROM typeorm_migrations');
  assert.equal(applied.length, source.migrations.length);
  cli('migration:run');
  assert.equal((await source.query('SELECT * FROM typeorm_migrations')).length, applied.length);
  assert.equal((await source.driver.createSchemaBuilder().log()).upQueries.length, 0, 'migraciones y entidades deben coincidir');
  cli('migration:generate', false, ['.tmp/NoDebeGenerarse', '--check']);
  t.diagnostic('Aplicación inicial, repetición sin cambios y generación sin diferencias: correctas.');
  for (let i = 0; i < applied.length; i++) cli('migration:revert');
  assert.equal((await source.query('SELECT * FROM typeorm_migrations')).length, 0);
  const remaining = await source.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> 'typeorm_migrations'");
  assert.deepEqual(remaining, []);
  cli('migration:run', true);
  assert.equal(await source.showMigrations(), false);
  assert.equal((await source.driver.createSchemaBuilder().log()).upQueries.length, 0);
  t.diagnostic('Reversión completa y reaplicación desde dist con synchronize=false: correctas.');

  const { AppModule } = require('../dist/app.module');
  async function start() {
    app = await NestFactory.create(AppModule, { logger: false, abortOnError: false });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
    await app.listen(0, '127.0.0.1');
    return app.getUrl();
  }
  let base = await start();
  const request = (method, path, body, token) => fetch(base + path, {
    method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const credentials = { email: 'verificacion@example.com', password: 'ClavePrueba123!' };
  assert.equal((await request('POST', '/auth/register', { nombre: 'Verificación', ...credentials })).status, 201);
  const login = await request('POST', '/auth/login', credentials);
  assert.equal(login.status, 200);
  const { access_token: token } = await login.json();
  assert.ok(token);
  const id = '00000000-0000-4000-8000-000000000001';
  for (const path of ['/ordenes', '/clientes', '/vehiculos']) {
    assert.equal((await request('GET', path)).status, 200);
    for (const badToken of [undefined, 'invalido']) {
      for (const [method, target] of [['POST', path], ['PATCH', `${path}/${id}`], ['DELETE', `${path}/${id}`]]) {
        assert.equal((await request(method, target, method === 'DELETE' ? undefined : {}, badToken)).status, 401, `${method} ${target}`);
      }
    }
  }
  const clienteResponse = await request('POST', '/clientes', { nombreCompleto: 'Ana Pérez', telefono: '+593991234567' }, token);
  assert.equal(clienteResponse.status, 201);
  const cliente = await clienteResponse.json();
  const vehiculoResponse = await request('POST', '/vehiculos', { placa: 'ABC1234', marca: 'Toyota', modelo: 'Corolla', anio: 2020, clienteId: cliente.id }, token);
  assert.equal(vehiculoResponse.status, 201);
  const vehiculo = await vehiculoResponse.json();
  const ordenResponse = await request('POST', '/ordenes', { placaVehiculo: 'ABC1234', marca: 'Toyota', modelo: 'Corolla', anio: 2020, nombreCliente: 'Ana Pérez', telefonoCliente: '+593991234567', tipoServicio: 'PINTURA', descripcionDanio: 'Rayón en puerta', costoEstimado: 250 }, token);
  assert.equal(ordenResponse.status, 201);
  const orden = await ordenResponse.json();
  const records = [['/ordenes', orden.id, { estado: 'LISTO' }], ['/vehiculos', vehiculo.id, { modelo: 'Yaris' }], ['/clientes', cliente.id, { nombreCompleto: 'Ana Actualizada' }]];
  for (const [path, id, patch] of records) assert.equal((await request('PATCH', `${path}/${id}`, patch, token)).status, 200);
  await app.close();
  app = undefined;
  base = await start();
  for (const [path, id, patch] of records) {
    const response = await request('GET', `${path}/${id}`);
    assert.equal(response.status, 200);
    const saved = await response.json();
    for (const [key, value] of Object.entries(patch)) assert.equal(saved[key], value);
    assert.equal((await request('DELETE', `${path}/${id}`, undefined, token)).status, 204);
  }
  t.diagnostic('Login real, 401 sin credenciales, POST 201, PATCH 200, DELETE 204 y persistencia tras reiniciar: correctos en órdenes, clientes y vehículos.');
});
