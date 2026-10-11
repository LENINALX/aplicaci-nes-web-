# Integrante 2: guards, migraciones y entorno

Rama de trabajo: `feature/guards-migrations`.

## Alcance e integración

`JwtAuthGuard` protege POST, PATCH y DELETE de `/ordenes`. GET permanece público. No existe PUT en el CRUD actual; si se añade, debe llevar `@UseGuards(JwtAuthGuard)`. Los nuevos controladores de dominio deben importar `SecurityModule` en su módulo y colocar ese decorador en sus operaciones de escritura.

El guard usa `@nestjs/jwt` para verificar tokens, sin necesitar implementar la estrategia Passport, registro ni login del integrante 1. Contrato de integración con Auth:

- Firma HS256 con el mismo `JWT_SECRET` del entorno.
- `sub`: identificador no vacío del usuario, como string.
- `exp`: expiración numérica; Auth debe firmar con `expiresIn`.
- Enviar `Authorization: Bearer <access_token>`.

El payload validado queda en `request.user`. Tokens ausentes, mal formados, vencidos, sin `sub`/`exp`, con otra firma o algoritmo reciben 401. Con credenciales válidas se conserva el comportamiento del CRUD: POST 201, PATCH 200 y DELETE 204. También se conservan sus errores 400 y 404.

## Preparar y ejecutar

1. Ejecutar `npm ci`.
2. Copiar `.env.example` a `.env` solo si no existe. Completar las credenciales PostgreSQL de una base existente y `JWT_SECRET`. No guardar `.env` en Git.
3. Generar un secreto local con `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` y copiarlo a `JWT_SECRET`.
4. Usar `DB_SYNC=false`, también en desarrollo. Ya no se permite sincronización automática.
5. En una base vacía, ejecutar `npm run migration:run` y después `npm run migration:show`.
6. Iniciar con `npm run start:dev`.

El script opcional de preparación de PostgreSQL para Windows también genera el secreto y usa `DB_SYNC=false`.

El CLI y Nest comparten `databaseOptions`. `src/data-source.ts` carga `.env` mediante `@nestjs/config`; las migraciones pueden ejecutarse sin JWT_SECRET, pero el servidor exige un secreto de al menos 32 caracteres. Las migraciones se aplican explícitamente, no al arrancar el servidor.

## Migraciones versionadas

La migración inicial crea únicamente la tabla de órdenes existente, con sus enums, UUID, valores por defecto, restricción única e índice. Las entidades nuevas corresponden al integrante 3. `uuid-ossp` necesita estar disponible en PostgreSQL y el usuario debe poder crear la extensión, o un administrador debe habilitarla previamente.

Comandos:

```sh
npm run migration:show
npm run migration:run
npm run migration:generate -- src/migrations/NombreDelCambio
npm run build
npm run migration:run:prod
```

La generación compara las entidades con la base configurada; requiere PostgreSQL accesible. Revisar y versionar el archivo generado. Si no hay diferencias, TypeORM informa que no hay cambios que generar.

Para probar la reversión, usar una base desechable: `npm run migration:revert` elimina la tabla y sus datos al revertir la migración inicial. Después puede aplicarse de nuevo con `npm run migration:run`.

### Base existente de Etapa 1

Si `synchronize` ya creó `ordenes_reparacion`, la migración inicial fallará por objetos existentes. No borrar esa tabla ni ejecutar la reversión sobre datos que deban conservarse. Primero respaldar y comprobar que el esquema coincide con esta migración (por ejemplo, revisar `npm run typeorm -- schema:log -d src/data-source.ts`). Solo si coincide exactamente, registrar la migración inicial como aplicada mediante `npm run migration:run -- --fake`, verificando antes que sea la única pendiente. Si hay diferencias, reconciliarlas antes de marcarla. Para la demostración se recomienda una base vacía independiente.

## Verificación y evidencias propias

`npm test` compila y ejecuta las pruebas de configuración y seguridad. Las pruebas de seguridad levantan HTTP real con el controlador y el guard, firman tokens exclusivamente de prueba y simulan el servicio de datos: no verifican persistencia ni sustituyen el login.

Para evidencia manual, una vez integrado Auth y ejecutadas las migraciones:

1. POST `/ordenes` sin Authorization: 401.
2. POST con `Authorization: Bearer invalido`: 401.
3. Obtener un token desde el login del integrante 1. Enviar el mismo POST con el cuerpo válido de órdenes y el token: 201. Guardar el id.
4. PATCH `/ordenes/<id>` con `{"estado":"LISTO"}` sin token: 401; con token: 200.
5. DELETE `/ordenes/<id>` sin token: 401; con token: 204.
6. Capturar la salida de `migration:run` y `migration:show` en una base de prueba. Repetir `migration:run`: no debe haber migraciones pendientes.

Guardar capturas reales ocultando el token y los secretos. No se incluyen capturas inventadas ni un endpoint temporal para emitir tokens.

Para GitHub, los cambios están en la rama asignada; crear commits propios y un PR hacia la rama que use el equipo. El PR debe describir estos cambios y sus pruebas, y pedir revisión a un compañero. El README general sigue a cargo del integrante 4; debe actualizar el antiguo flujo basado en `DB_SYNC=true` y añadir las instrucciones de migración y Authorization de esta nota.

Referencias técnicas: [guards en NestJS](https://docs.nestjs.com/guards) y [CLI de TypeORM](https://typeorm.io/docs/using-cli/).
