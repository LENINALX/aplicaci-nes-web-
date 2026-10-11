# Integrante 1: usuarios y autenticación JWT

Rama de trabajo: `feature/auth-jwt`.

## Qué incluye

- Módulo `users`: entidad `User` (tabla `users`), `CreateUserDto` y `UsersService`.
- Módulo `auth`: registro, login, emisión del JWT y `JwtStrategy` (Passport).
- Contraseñas cifradas con `bcrypt` (10 rondas). La tabla guarda solo el hash (`passwordHash`), que nunca se devuelve en las respuestas.
- Migración `CreateUsers` para crear la tabla `users`.

## Endpoints

| Método | Ruta | Cuerpo | Respuestas |
| --- | --- | --- | --- |
| POST | `/auth/register` | `{ "nombre", "email", "password" }` | 201 usuario creado · 400 datos inválidos · 409 email ya registrado |
| POST | `/auth/login` | `{ "email", "password" }` | 200 `{ access_token, token_type }` · 400 datos inválidos · 401 credenciales incorrectas |
| GET | `/auth/profile` | Header `Authorization: Bearer <token>` | 200 usuario del token · 401 sin token o token inválido |

Reglas de validación:

- `email` se guarda en minúsculas y sin espacios, así que `Ana@Taller.com` y `ana@taller.com` son la misma cuenta.
- `password` debe tener al menos 8 caracteres y como máximo 72 bytes, porque bcrypt ignora lo que pase de 72 bytes.
- El login responde el mismo 401 si el email no existe o si la contraseña es incorrecta, para no revelar qué cuentas están registradas.

## Contrato con el guard del integrante 2

El token se firma con HS256 y el mismo `JWT_SECRET`. El payload lleva `sub` (id del usuario), `email` y `exp`. La duración la define `JWT_EXPIRES_IN` en segundos y por defecto es 3600. `JwtAuthGuard` acepta este token para POST, PATCH y DELETE de `/ordenes`.

## Preparar y ejecutar

1. Ejecutar `npm ci`.
2. En `.env`, completar `JWT_SECRET` (al menos 32 caracteres) y, si se quiere, `JWT_EXPIRES_IN`.
3. Ejecutar `npm run migration:run`, que crea `ordenes_reparacion` y `users`.
4. Iniciar con `npm run start:dev`.

## Verificación

`npm test` incluye `test/auth.test.cjs`. Esas pruebas levantan HTTP real con el `AuthModule` y simulan solo la base de datos. Comprueban:

- que se guarda el hash bcrypt y nunca la contraseña;
- los errores 400 y 409 del registro;
- el JWT HS256 con `sub`, `email` y `exp`;
- el mismo 401 en el login para email inexistente o contraseña incorrecta;
- que `/auth/profile` exige un token válido;
- que `JwtAuthGuard` acepta el token del login.

Evidencia manual con Postman o Thunder Client:

1. POST `/auth/register` con datos válidos: 201, sin contraseña en la respuesta.
2. Repetir el mismo registro: 409.
3. POST `/auth/login` con una contraseña incorrecta: 401.
4. POST `/auth/login` correcto: 200. Copiar `access_token`.
5. GET `/auth/profile` sin token: 401. Con `Authorization: Bearer <token>`: 200.
6. POST `/ordenes` con el token: 201. Así se comprueba la integración con el guard.
7. En pgAdmin, ver la tabla `users`: la columna `passwordHash` empieza con `$2b$10$`.

En las capturas, ocultar el token y los secretos.
