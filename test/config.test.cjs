const { test } = require('node:test');
const assert = require('node:assert/strict');
const { ConfigService } = require('@nestjs/config');
const { validateEnvironment } = require('../dist/config/env.validation');
const { typeOrmConfig } = require('../dist/config/typeorm.config');
const { AppController } = require('../dist/app.controller');
const { AppService } = require('../dist/app.service');

const valid = { DB_HOST: 'localhost', DB_USER: 'test', DB_PASS: 'test-only', DB_NAME: 'test' };

test('convierte puertos y no interpreta false como verdadero', () => {
  const env = validateEnvironment({ ...valid, DB_PORT: '5433', DB_SYNC: 'false' });
  assert.equal(env.PORT, 3000);
  assert.equal(env.DB_PORT, 5433);
  assert.equal(env.DB_SYNC, false);
});

test('sincroniza únicamente cuando se solicita explícitamente', () => {
  assert.equal(validateEnvironment(valid).DB_SYNC, false);
  assert.equal(validateEnvironment({ ...valid, DB_SYNC: 'true' }).DB_SYNC, true);
});

for (const key of ['DB_HOST', 'DB_USER', 'DB_PASS', 'DB_NAME']) {
  test(`rechaza ${key} vacía`, () => {
    assert.throws(() => validateEnvironment({ ...valid, [key]: '' }), new RegExp(key));
  });
}

for (const port of ['0', '65536', 'abc', '3.5', '']) {
  test(`rechaza el puerto ${JSON.stringify(port)}`, () => {
    assert.throws(() => validateEnvironment({ ...valid, PORT: port }), /PORT/);
  });
}

test('impide sincronizar en producción', () => {
  assert.throws(() => validateEnvironment({ ...valid, NODE_ENV: 'production', DB_SYNC: 'true' }), /producción/);
});

test('TypeORM utiliza las variables validadas y registra entidades de los módulos', () => {
  const env = validateEnvironment({ ...valid, DB_PORT: '5433', DB_SYNC: 'false' });
  const options = typeOrmConfig(new ConfigService(env));
  assert.equal(options.type, 'postgres');
  assert.equal(options.port, 5433);
  assert.equal(options.database, valid.DB_NAME);
  assert.equal(options.synchronize, false);
  assert.equal(options.autoLoadEntities, true);
});

test('conserva la respuesta inicial del apartado A', () => {
  assert.equal(new AppController(new AppService()).getHello(), 'Hello World!');
});
