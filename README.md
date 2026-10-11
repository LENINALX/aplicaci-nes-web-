# AutoBodyOps API

API REST para administrar clientes, vehículos y órdenes de reparación de talleres de enderezada y pintura. Está construida con NestJS, PostgreSQL, TypeORM y `class-validator`.

## Requisitos y ejecución

- Node.js 20 o superior y npm.
- PostgreSQL 16 o 17, o Docker Desktop iniciado para usar la base de desarrollo.

Ejecuta los comandos desde la carpeta que contiene `package.json`:

```powershell
npm ci
Copy-Item .env.example .env
```

Si ya tienes un archivo `.env` configurado, consérvalo y no vuelvas a copiar el ejemplo. Ajusta las credenciales a tu instalación. El ejemplo utiliza la base `auto_body_ops` y el usuario `auto_body`.

### Opción 1 PostgreSQL instalado

Crea una vez el usuario y la base desde pgAdmin o psql con una cuenta administradora, sustituyendo la contraseña de ejemplo por la tuya:

```sql
CREATE USER auto_body WITH PASSWORD 'tu_clave_local';
CREATE DATABASE auto_body_ops OWNER auto_body;
```

Completa `DB_PASS` en `.env` con esa misma contraseña. Si ya usas otra base, puedes conservarla y poner su nombre y credenciales en `.env`.

En Windows con PostgreSQL 17 hay una alternativa automatizada: antes de crear `.env`, ejecuta desde esta carpeta:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\crear-base-local.ps1
```

El script solicita la contraseña de `postgres` de forma oculta, genera una contraseña propia para `auto_body`, crea `auto_body_ops`, escribe `.env` y verifica la conexión. Si ya existe `.env`, el usuario o la base, se detiene para no sobrescribirlos.

### Opción 2 PostgreSQL con Docker

Configura `.env` con `DB_HOST=localhost`, una contraseña local en `DB_PASS` y un puerto libre en `DB_PORT`. Inicia Docker Desktop y ejecuta:

```powershell
docker compose up -d --wait
```

Si tu PostgreSQL instalado ocupa 5432, usa por ejemplo `DB_PORT=5433` para Docker. El volumen conserva los datos al ejecutar `docker compose down`. Cambiar `DB_PASS` en el archivo no cambia la contraseña de una base ya inicializada: hay que actualizar también el usuario en PostgreSQL.

### Iniciar la API

```powershell
npm run start:dev
```

Por defecto escucha en `http://localhost:3000`. `GET /` responde `Hello World!`; `GET /ordenes`, `GET /clientes` y `GET /vehiculos` consultan los recursos en PostgreSQL. La API espera a conectarse antes de aceptar peticiones.

| Variable | Uso | Ejemplo |
| --- | --- | --- |
| NODE_ENV | Entorno | development |
| PORT | Puerto HTTP | 3000 |
| DB_HOST | Servidor PostgreSQL | localhost |
| DB_PORT | Puerto PostgreSQL | 5432 |
| DB_USER | Usuario de la base | auto_body |
| DB_PASS | Contraseña del usuario | Configurar localmente |
| DB_NAME | Base existente | auto_body_ops |
| DB_SYNC | Crear/actualizar tablas en desarrollo | true |

`ConfigModule` valida variables requeridas y puertos. `TypeOrmModule.forRootAsync` recibe la configuración mediante `ConfigService`; `autoLoadEntities` incorpora las entidades registradas por los módulos. La validación HTTP global conserva `whitelist`, `transform` y `forbidNonWhitelisted` activados.

`DB_SYNC` acepta solamente `true` o `false` y por defecto es `false` si se omite. Para una base local nueva usa `true` para crear las tablas desde las entidades. En producción debe ser `false` y se deben usar migraciones; la API rechaza iniciar con sincronización activada en producción. TypeORM no crea la base de datos.

`.env` contiene credenciales locales y está excluido de Git. Comparte únicamente `.env.example`.

## Comprobaciones del apartado A

Se conserva NestJS 11 y CommonJS del repositorio del equipo. La configuración del apartado A se adapta a esa base sin migrar las versiones ni reemplazar el módulo de órdenes.

```powershell
npm test
```

Compila y ejecuta las pruebas de configuración sin necesitar PostgreSQL. Para comprobar el inicio y las rutas `/` y `/ordenes`, configura primero `.env` y deja PostgreSQL activo:

```powershell
npm run test:e2e
```

Esta prueba usa un puerto HTTP temporal y solo consulta órdenes; al arrancar, TypeORM aplica la opción `DB_SYNC` del entorno. No sustituye las evidencias manuales del CRUD.

Para ejecutar la versión compilada:

```powershell
npm run build
npm run start:prod
```

## Endpoints

Los identificadores son UUID versión 4.

| Método | Ruta | Descripción | Respuesta exitosa |
| --- | --- | --- | --- |
| GET | `/ordenes` | Lista órdenes, de la más reciente a la más antigua | `200 OK` |
| GET | `/ordenes/:id` | Consulta una orden | `200 OK` |
| POST | `/ordenes` | Crea una orden; el sistema genera `id` y `codigo` | `201 Created` |
| PATCH | `/ordenes/:id` | Actualiza solo los campos enviados | `200 OK` |
| DELETE | `/ordenes/:id` | Elimina una orden | `204 No Content` |
| GET | `/clientes` | Lista clientes | `200 OK` |
| GET | `/clientes/:id` | Consulta un cliente | `200 OK` |
| POST | `/clientes` | Crea un cliente | `201 Created` |
| PATCH | `/clientes/:id` | Actualiza solo los campos enviados | `200 OK` |
| DELETE | `/clientes/:id` | Elimina un cliente sin vehículos asociados | `204 No Content` |
| GET | `/clientes/:id/vehiculos` | Consulta los vehículos asociados a un cliente | `200 OK` |
| GET | `/vehiculos` | Lista vehículos con sus datos de cliente | `200 OK` |
| GET | `/vehiculos/:id` | Consulta un vehículo con sus datos de cliente | `200 OK` |
| POST | `/vehiculos` | Crea un vehículo asociado mediante `clienteId` | `201 Created` |
| PATCH | `/vehiculos/:id` | Actualiza datos del vehículo o cambia su cliente | `200 OK` |
| DELETE | `/vehiculos/:id` | Elimina un vehículo | `204 No Content` |

Errores esperados: `400 Bad Request` para datos inválidos o un UUID mal formado; `404 Not Found` si el UUID es válido pero no existe. El `PATCH` puede recibir cualquier subconjunto de los campos de creación. `id`, `codigo`, `tenantId`, `createdAt` y `updatedAt` no se aceptan en el cuerpo de creación/actualización.

Los DTOs de clientes validan nombre, teléfono y correo electrónico opcional. Los DTOs de vehículos validan placa (5 a 10 letras mayúsculas, números o guiones), marca, modelo, año y `clienteId` UUID versión 4. No se aceptan propiedades adicionales. Cada vehículo requiere un cliente existente; la base de datos aplica `ON DELETE RESTRICT`, y la API responde `409 Conflict` si se intenta eliminar un cliente que todavía tiene vehículos.

### Ejemplo de creación

Envía `POST http://localhost:3000/ordenes` con `Content-Type: application/json`:

```json
{
	"placaVehiculo": "ABC123",
	"marca": "Toyota",
	"modelo": "Corolla",
	"anio": 2020,
	"nombreCliente": "Ana Pérez",
	"telefonoCliente": "+593991234567",
	"tipoServicio": "PINTURA",
	"descripcionDanio": "Rayón en la puerta derecha",
	"costoEstimado": 250.5
}
```

Valores aceptados para `tipoServicio`: `ENDEREZADA`, `PINTURA`, `ENDEREZADA_Y_PINTURA`. Para `estado`: `RECIBIDO`, `EN_DIAGNOSTICO`, `EN_REPARACION`, `LISTO`, `ENTREGADO`, `CANCELADO`. Si no se indica el estado, comienza en `RECIBIDO`.

## Pruebas manuales

En Thunder Client, Insomnia o Postman, configura la URL base `http://localhost:3000` y realiza estos pasos:

1. `POST /ordenes` con el JSON de ejemplo. Comprueba `201` y guarda el `id` devuelto.
2. `GET /ordenes` y `GET /ordenes/<id>`. Comprueba `200` y que el registro aparezca.
3. `PATCH /ordenes/<id>` con `{"estado":"EN_REPARACION"}`. Comprueba `200` y el nuevo estado.
4. Prueba `POST /ordenes` con `{}`. Comprueba `400` por los campos obligatorios.
5. Prueba `GET /ordenes/00000000-0000-4000-8000-000000000000`. Comprueba `404` (UUID válido que no existe).
6. `DELETE /ordenes/<id>`. Comprueba `204`; un `GET` posterior debe devolver `404`.

### Clientes y vehículos

1. `POST /clientes` con `{"nombreCompleto":"Ana Pérez","telefono":"+593991234567","email":"ana@example.com"}` y guarda el `id`.
2. `POST /vehiculos` con `{"placa":"ABC1234","marca":"Toyota","modelo":"Corolla","anio":2020,"clienteId":"<id-del-cliente>"}`.
3. `GET /clientes/<id-del-cliente>/vehiculos`. Comprueba que el vehículo creado aparezca en la respuesta.
4. Intenta eliminar el cliente asociado con `DELETE /clientes/<id-del-cliente>`: debe responder `409`. Elimina el vehículo y vuelve a probar; debe responder `204`.
5. Repite `POST /vehiculos` con un `clienteId` inexistente y comprueba `404`; envía un año inválido o una propiedad no permitida y comprueba `400`.

Para demostrar persistencia, crea otra orden y conserva su `id`; detén y vuelve a iniciar la API sin borrar ni recrear la base de datos, luego ejecuta `GET /ordenes/<id>`. Debe responder `200` con la orden original. La persistencia la proporciona PostgreSQL, no la memoria del proceso NestJS.

## Evidencias

Guarda capturas reales de Thunder Client/Insomnia/Postman y del reinicio más la consulta posterior en [docs/evidencias](docs/evidencias/). Incluye como mínimo: creación (`201`), listado o consulta (`200`), validación (`400`), no encontrado (`404`), eliminación (`204`), consulta de vehículos por cliente, rechazo al eliminar un cliente con vehículos (`409`) y persistencia después del reinicio (`200`). Nombra cada captura indicando operación y resultado, por ejemplo `01-post-201.png` y `06-persistencia-reinicio-200.png`. No incluyas contraseñas ni otros secretos visibles en las capturas.

## Material para el informe Word

El documento [docs/guia-entrega.md](docs/guia-entrega.md) contiene una definición del sistema, estructura sugerida del informe, tabla para integrantes, enlace al repositorio, referencia al diagrama y lista de evidencias que puedes incorporar al Word. El diagrama de la entidad implementada está en [docs/diagrama-entidades.md](docs/diagrama-entidades.md).
