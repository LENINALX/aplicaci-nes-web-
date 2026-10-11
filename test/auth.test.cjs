const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const bcrypt = require('bcrypt');
const { Global, Module, ValidationPipe } = require('@nestjs/common');
const { NestFactory } = require('@nestjs/core');
const { ConfigModule, ConfigService } = require('@nestjs/config');
const { JwtService } = require('@nestjs/jwt');
const { getDataSourceToken } = require('@nestjs/typeorm');
const { AuthModule } = require('../dist/auth/auth.module');
const { JwtAuthGuard } = require('../dist/security/jwt-auth.guard');

const secret = 'only-for-tests-secret-at-least-32-characters';
const jwt = new JwtService({ secret });

// Repositorio en memoria con las mismas operaciones que usa UsersService.
function fakeUsersRepository() {
  const rows = new Map();
  const sinHash = ({ passwordHash, ...user }) => user;
  return {
    rows,
    create: (data) => ({ ...data }),
    existsBy: async ({ email }) => [...rows.values()].some((u) => u.email === email),
    save: async (entity) => {
      const now = new Date();
      const row = { id: randomUUID(), tenantId: 'default', createdAt: now, updatedAt: now, ...entity };
      rows.set(row.id, row);
      return { ...row };
    },
    findOne: async ({ where }) => {
      const row = [...rows.values()].find((u) => u.email === where.email);
      return row ? { ...row } : null;
    },
    findOneBy: async ({ id }) => (rows.has(id) ? sinHash(rows.get(id)) : null),
  };
}

// Levanta HTTP real con el AuthModule completo; solo la base de datos es simulada.
async function startApp(t, env = {}) {
  const repository = fakeUsersRepository();
  class FakeDataSourceModule {}
  Module({
    providers: [{
      provide: getDataSourceToken(),
      useValue: { entityMetadatas: [], options: { type: 'postgres' }, getRepository: () => repository },
    }],
    exports: [getDataSourceToken()],
  })(FakeDataSourceModule);
  Global()(FakeDataSourceModule);

  class TestAppModule {}
  Module({
    imports: [
      ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true, skipProcessEnv: true, load: [() => ({ JWT_SECRET: secret, ...env })] }),
      FakeDataSourceModule,
      AuthModule,
    ],
  })(TestAppModule);
  const app = await NestFactory.create(TestAppModule, { logger: false, abortOnError: false });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
  await app.listen(0, '127.0.0.1');
  t.after(() => app.close());
  const base = await app.getUrl();
  const request = async (method, path, data, token) => {
    const response = await fetch(base + path, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: data === undefined ? undefined : JSON.stringify(data),
    });
    const text = await response.text();
    return { status: response.status, body: text ? JSON.parse(text) : undefined };
  };
  return { request, repository };
}

const nuevo = { nombre: 'Ana Pérez', email: '  Ana@Taller.com ', password: 'clave-segura-123' };
const credenciales = { email: nuevo.email, password: nuevo.password };

test('registro: guarda hash bcrypt y nunca devuelve la contraseña', async (t) => {
  const { request, repository } = await startApp(t);
  const res = await request('POST', '/auth/register', nuevo);
  assert.equal(res.status, 201);
  assert.equal(res.body.email, 'ana@taller.com');
  assert.equal(res.body.nombre, 'Ana Pérez');
  assert.ok(res.body.id);
  assert.equal(res.body.password, undefined);
  assert.equal(res.body.passwordHash, undefined);

  const stored = repository.rows.get(res.body.id);
  assert.match(stored.passwordHash, /^\$2b\$10\$/);
  assert.notEqual(stored.passwordHash, nuevo.password);
  assert.ok(await bcrypt.compare(nuevo.password, stored.passwordHash));

  const repetido = await request('POST', '/auth/register', { ...nuevo, email: 'ANA@taller.com' });
  assert.equal(repetido.status, 409, 'el email no distingue mayúsculas');
});

test('registro: rechaza datos inválidos con 400', async (t) => {
  const { request, repository } = await startApp(t);
  for (const data of [
    {},
    { ...nuevo, email: 'no-es-email' },
    { ...nuevo, password: 'corta' },
    { ...nuevo, password: 'ñ'.repeat(40) }, // 80 bytes: bcrypt ignoraría el resto
    { ...nuevo, nombre: '   ' },
    { ...nuevo, rol: 'admin' },
  ]) {
    assert.equal((await request('POST', '/auth/register', data)).status, 400, JSON.stringify(data));
  }
  assert.equal(repository.rows.size, 0);
});

test('login: emite JWT HS256 con sub, email y expiración', async (t) => {
  const { request } = await startApp(t);
  const { body: user } = await request('POST', '/auth/register', nuevo);

  const res = await request('POST', '/auth/login', { email: 'ANA@taller.com', password: nuevo.password });
  assert.equal(res.status, 200);
  assert.equal(res.body.token_type, 'Bearer');
  const decoded = jwt.decode(res.body.access_token, { complete: true });
  assert.equal(decoded.header.alg, 'HS256');
  assert.equal(decoded.payload.sub, user.id);
  assert.equal(decoded.payload.email, 'ana@taller.com');
  assert.equal(decoded.payload.exp - decoded.payload.iat, 3600);
  assert.equal(decoded.payload.passwordHash, undefined);
  jwt.verify(res.body.access_token, { algorithms: ['HS256'] });
});

test('login: mismo 401 para contraseña incorrecta o email inexistente', async (t) => {
  const { request } = await startApp(t);
  await request('POST', '/auth/register', nuevo);
  const malaClave = await request('POST', '/auth/login', { email: nuevo.email, password: 'otra-clave-123' });
  const sinCuenta = await request('POST', '/auth/login', { email: 'nadie@taller.com', password: nuevo.password });
  assert.equal(malaClave.status, 401);
  assert.equal(sinCuenta.status, 401);
  assert.equal(malaClave.body.message, sinCuenta.body.message);
  assert.equal((await request('POST', '/auth/login', { email: 'x' })).status, 400);
});

test('JWT_EXPIRES_IN configura la duración del token', async (t) => {
  const { request } = await startApp(t, { JWT_EXPIRES_IN: '120' });
  await request('POST', '/auth/register', nuevo);
  const { body } = await request('POST', '/auth/login', credenciales);
  const { exp, iat } = jwt.decode(body.access_token);
  assert.equal(exp - iat, 120);
});

test('profile: JwtStrategy exige un token válido de un usuario existente', async (t) => {
  const { request, repository } = await startApp(t);
  const { body: user } = await request('POST', '/auth/register', nuevo);
  const { body: login } = await request('POST', '/auth/login', credenciales);

  const ok = await request('GET', '/auth/profile', undefined, login.access_token);
  assert.equal(ok.status, 200);
  assert.equal(ok.body.id, user.id);
  assert.equal(ok.body.passwordHash, undefined);

  const invalidos = [
    undefined,
    'basura',
    new JwtService({ secret: 'otro-secreto-de-al-menos-32-caracteres' }).sign({ sub: user.id }, { expiresIn: 60 }),
    jwt.sign({ sub: user.id }, { expiresIn: -1 }),
    jwt.sign({ sub: user.id }, { algorithm: 'HS384', expiresIn: 60 }),
    jwt.sign({ sub: user.id }),
    jwt.sign({ sub: 'no-es-uuid' }, { expiresIn: 60 }),
    jwt.sign({ sub: randomUUID() }, { expiresIn: 60 }),
  ];
  for (const token of invalidos) {
    assert.equal((await request('GET', '/auth/profile', undefined, token)).status, 401, String(token));
  }

  repository.rows.delete(user.id);
  assert.equal((await request('GET', '/auth/profile', undefined, login.access_token)).status, 401);
});

test('el token del login es aceptado por JwtAuthGuard del integrante 2', async (t) => {
  const { request } = await startApp(t);
  await request('POST', '/auth/register', nuevo);
  const { body } = await request('POST', '/auth/login', credenciales);
  const guard = new JwtAuthGuard(jwt, new ConfigService({ JWT_SECRET: secret }));
  const req = { headers: { authorization: `Bearer ${body.access_token}` } };
  assert.equal(await guard.canActivate({ switchToHttp: () => ({ getRequest: () => req }) }), true);
  assert.equal(req.user.email, 'ana@taller.com');
});
