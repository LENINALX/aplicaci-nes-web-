# AutoBodyOps API

API REST para administrar clientes, vehículos y órdenes de reparación de talleres de enderezada y pintura. Está construida con NestJS, PostgreSQL, TypeORM y `class-validator`.

## Etapa 1: API base y módulo de órdenes

La primera etapa estableció la API del proyecto AutoBodyOps con NestJS y PostgreSQL. Su recurso principal es la orden de reparación, que permite registrar y consultar los datos de un vehículo, el cliente, el servicio solicitado, su estado, costo y fechas.

### Funcionalidad base

- `GET /` devuelve la respuesta inicial `Hello World!`.
- `GET /ordenes` lista órdenes y `GET /ordenes/:id` consulta una por identificador.
- `POST /ordenes` crea órdenes; el sistema genera su identificador y código.
- `PATCH /ordenes/:id` actualiza los campos enviados.
- `DELETE /ordenes/:id` elimina una orden.
- Los DTOs validan los datos enviados al crear o actualizar una orden.
- PostgreSQL proporciona la persistencia de los registros.

### Recursos y operaciones entregados en la etapa 1

La primera etapa también incorporó la administración inicial de clientes y vehículos, además de las órdenes. En ese alcance las operaciones de escritura aún no requerían autenticación.

| Método | Ruta de la etapa 1 | Función original |
| --- | --- | --- |
| GET | `/` | Comprueba la respuesta inicial de la API (`Hello World!`). |
| GET | `/ordenes` | Lista órdenes, inicialmente como arreglo directo. |
| GET | `/ordenes/:id` | Consulta una orden por UUID. |
| POST | `/ordenes` | Crea una orden de reparación. |
| PATCH | `/ordenes/:id` | Actualiza parcialmente una orden. |
| DELETE | `/ordenes/:id` | Elimina una orden. |
| GET | `/clientes` | Lista clientes. |
| GET | `/clientes/:id` | Consulta un cliente por UUID. |
| POST | `/clientes` | Registra un cliente. |
| PATCH | `/clientes/:id` | Actualiza parcialmente un cliente. |
| DELETE | `/clientes/:id` | Elimina un cliente cuando no tiene vehículos asociados. |
| GET | `/clientes/:id/vehiculos` | Consulta los vehículos de un cliente. |
| GET | `/vehiculos` | Lista vehículos con los datos de su cliente. |
| GET | `/vehiculos/:id` | Consulta un vehículo por UUID con los datos del cliente. |
| POST | `/vehiculos` | Registra un vehículo vinculado con `clienteId`. |
| PATCH | `/vehiculos/:id` | Actualiza un vehículo o cambia su cliente. |
| DELETE | `/vehiculos/:id` | Elimina un vehículo. |

Los identificadores son UUID versión 4. Los DTOs de órdenes validan los campos del vehículo, el cliente, el tipo de servicio, el estado, costos y fechas. Los DTOs de clientes validan nombre, teléfono y correo electrónico opcional. Los DTOs de vehículos validan placa, marca, modelo, año y `clienteId`. No se aceptan propiedades adicionales en los cuerpos de creación y actualización.

La relación inicial entre clientes y vehículos requiere que cada vehículo pertenezca a un cliente existente. La base aplica `ON DELETE RESTRICT`; si el cliente todavía tiene vehículos, la operación de eliminación responde `409 Conflict`.

#### Ejemplo de creación de orden de la etapa 1

En la etapa 1 se enviaba una solicitud `POST /ordenes` con `Content-Type: application/json` y un cuerpo como este:

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

Valores permitidos para `tipoServicio`: `ENDEREZADA`, `PINTURA` y `ENDEREZADA_Y_PINTURA`. Los estados permitidos son `RECIBIDO`, `EN_DIAGNOSTICO`, `EN_REPARACION`, `LISTO`, `ENTREGADO` y `CANCELADO`. Si no se indicaba un estado, la orden comenzaba en `RECIBIDO`.

#### Pruebas manuales del alcance inicial

1. Crear una orden y verificar `201 Created`.
2. Consultar el listado y una orden individual; verificar `200 OK`.
3. Actualizar el estado de una orden mediante `PATCH`; verificar `200 OK`.
4. Enviar un cuerpo vacío al endpoint de creación y comprobar `400 Bad Request`.
5. Consultar un UUID válido que no exista y comprobar `404 Not Found`.
6. Eliminar una orden y comprobar `204 No Content`; una consulta posterior debe responder `404`.
7. Crear un cliente, asociarle un vehículo y comprobar la relación mediante `GET /clientes/:id/vehiculos`.
8. Intentar eliminar el cliente con un vehículo asociado y comprobar `409 Conflict`.
9. Reiniciar la API y consultar una orden previamente guardada para comprobar la persistencia en PostgreSQL.

### Continuidad del contrato

La segunda etapa conserva las rutas de consulta individual y las operaciones CRUD de órdenes. La modificación documentada es `GET /ordenes`: para agregar paginación, ahora devuelve `{ data, meta }` en lugar de una lista directa. La tabla completa de endpoints vigente al cierre de la etapa 2 aparece más adelante.

## Etapa 2: ampliación del proyecto integrador

Esta etapa continúa el desarrollo de la API de la etapa anterior: conserva los recursos de órdenes, clientes y vehículos, y añade autenticación, autorización, modelo relacional y consultas avanzadas. El cambio de contrato documentado es que `GET /ordenes` ahora responde con `{ data, meta }` para incluir los metadatos de paginación; las rutas de consulta y escritura restantes conservan sus propósitos.

### Distribución del trabajo y funcionalidades integradas

| Integrante | Área | Trabajo integrado |
| --- | --- | --- |
| 1 | Usuarios y autenticación JWT | Módulos de usuarios y autenticación; registro e inicio de sesión; contraseñas protegidas mediante bcrypt; emisión de JWT y consulta del perfil autenticado. |
| 2 | Seguridad, configuración y migraciones | Guard JWT para rutas protegidas; variables de entorno validadas con `@nestjs/config`; migraciones versionadas de TypeORM y sincronización automática deshabilitada (`DB_SYNC=false`). |
| 3 | Entidades y CRUD relacionado | Entidades de clientes, vehículos y órdenes con DTOs validados; relación persistente Cliente–Vehículo y consulta de vehículos asociados a un cliente. |
| 4 | Consultas avanzadas y documentación | Búsqueda, filtros, ordenamiento y paginación de órdenes; DTO de parámetros con validación; actualización de esta documentación y evidencias manuales. |

### Modelo relacional implementado

Un cliente puede tener varios vehículos y cada vehículo pertenece a un cliente. La clave foránea `clienteId` está en `vehiculos`; la relación se define como `OneToMany`/`ManyToOne`. La regla de borrado es `RESTRICT`: el cliente no se puede eliminar mientras tenga vehículos asociados, y el endpoint responde `409 Conflict`. La API también cuenta con las entidades `User` y `OrdenReparacion`. Actualmente la orden conserva campos descriptivos del cliente y del vehículo; esos campos no son claves foráneas hacia las tablas `clientes` y `vehiculos`.

### Autenticación y rutas protegidas

El registro guarda una contraseña cifrada con bcrypt y no devuelve ni almacena la contraseña en texto plano. El inicio de sesión emite un JWT que se envía como `Authorization: Bearer <token>`. Las operaciones `POST`, `PATCH` y `DELETE` de órdenes, clientes y vehículos requieren autenticación; las solicitudes sin token válido reciben `401 Unauthorized`. `GET /auth/profile` también requiere un token válido.

### Evidencias realizadas para consultas avanzadas

Las pruebas manuales de `GET /ordenes` en Postman se realizaron con órdenes de prueba y mostraron:

1. Respuesta inicial `200 OK` con `data` y `meta`.
2. Búsqueda `q=Toyota` con filtro `estado=RECIBIDO`.
3. Paginación con `page=1` y `page=2`; las respuestas incluyeron los metadatos de la página consultada.
4. Validación de `limit=200`, rechazada con `400 Bad Request` porque el máximo permitido es 100.
5. Ordenamiento por `codigo` en sentido `ASC` y `DESC`.

En la consulta filtrada observada, `meta` indicó `totalItems: 5`; con `limit=1` el total fue de cinco páginas y con `limit=2` fue de tres páginas. Estos totales corresponden a los datos presentes en la base de pruebas al momento de ejecutar las solicitudes.

## Configuración y ejecución (común a ambas etapas)

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
npm run migration:run
npm run start:dev
```

Ejecuta las migraciones antes de iniciar la API, también después de actualizar el proyecto. Por defecto escucha en `http://localhost:3000`. `GET /` responde `Hello World!`; `GET /ordenes`, `GET /clientes` y `GET /vehiculos` consultan los recursos en PostgreSQL. La API espera a conectarse antes de aceptar peticiones.

| Variable | Uso | Ejemplo |
| --- | --- | --- |
| NODE_ENV | Entorno | development |
| PORT | Puerto HTTP | 3000 |
| DB_HOST | Servidor PostgreSQL | localhost |
| DB_PORT | Puerto PostgreSQL | 5432 |
| DB_USER | Usuario de la base | auto_body |
| DB_PASS | Contraseña del usuario | Configurar localmente |
| DB_NAME | Base existente | auto_body_ops |
| DB_SYNC | Sincronización automática de esquema (deshabilitada) | false |

`ConfigModule` valida variables requeridas y puertos. `TypeOrmModule.forRootAsync` recibe la configuración mediante `ConfigService`; `autoLoadEntities` incorpora las entidades registradas por los módulos. La validación HTTP global conserva `whitelist`, `transform` y `forbidNonWhitelisted` activados.

`DB_SYNC` debe ser `false` (también es el valor predeterminado); la aplicación rechaza `true` en todos los entornos. El esquema se administra exclusivamente mediante migraciones versionadas. `npm run migration:run` aplica las pendientes; `npm run migration:show` muestra su estado y `npm run migration:revert` revierte la última aplicada. TypeORM no crea la base de datos.

`.env` contiene credenciales locales y está excluido de Git. Comparte únicamente `.env.example`.

## Pruebas automatizadas (etapas 1 y 2)

Se conserva NestJS 11 y CommonJS del repositorio del equipo. La configuración del apartado A se adapta a esa base sin migrar las versiones ni reemplazar el módulo de órdenes.

```powershell
npm test
```

Compila y ejecuta las pruebas unitarias, incluida la validación de parámetros y la consulta paginada, sin necesitar PostgreSQL. Para comprobar el inicio y las rutas `/` y `/ordenes`, configura primero `.env`, aplica las migraciones y deja PostgreSQL activo:

```powershell
npm run test:e2e
```

Esta prueba usa un puerto HTTP temporal y solo consulta órdenes. No sustituye las evidencias manuales del CRUD.

Para ejecutar la versión compilada:

```powershell
npm run build
npm run start:prod
```

## Endpoints disponibles al cierre de la etapa 2

Los identificadores son UUID versión 4.

| Método | Ruta | Descripción | Respuesta exitosa |
| --- | --- | --- | --- |
| POST | `/auth/register` | Registra usuario; recibe `nombre`, `email` y `password` | `201 Created` |
| POST | `/auth/login` | Inicia sesión; devuelve token JWT Bearer | `200 OK` |
| GET | `/auth/profile` | Consulta el usuario del token | `200 OK` |
| GET | `/ordenes` | Busca, filtra, ordena y pagina órdenes | `200 OK` |
| GET | `/ordenes/:id` | Consulta una orden | `200 OK` |
| POST | `/ordenes` | Crea una orden; requiere JWT; el sistema genera `id` y `codigo` | `201 Created` |
| PATCH | `/ordenes/:id` | Actualiza solo los campos enviados; requiere JWT | `200 OK` |
| DELETE | `/ordenes/:id` | Elimina una orden; requiere JWT | `204 No Content` |
| GET | `/clientes` | Lista clientes | `200 OK` |
| GET | `/clientes/:id` | Consulta un cliente | `200 OK` |
| POST | `/clientes` | Crea un cliente; requiere JWT | `201 Created` |
| PATCH | `/clientes/:id` | Actualiza solo los campos enviados; requiere JWT | `200 OK` |
| DELETE | `/clientes/:id` | Elimina un cliente sin vehículos asociados; requiere JWT | `204 No Content` |
| GET | `/clientes/:id/vehiculos` | Consulta los vehículos asociados a un cliente | `200 OK` |
| GET | `/vehiculos` | Lista vehículos con sus datos de cliente | `200 OK` |
| GET | `/vehiculos/:id` | Consulta un vehículo con sus datos de cliente | `200 OK` |
| POST | `/vehiculos` | Crea un vehículo asociado mediante `clienteId`; requiere JWT | `201 Created` |
| PATCH | `/vehiculos/:id` | Actualiza datos del vehículo o cambia su cliente; requiere JWT | `200 OK` |
| DELETE | `/vehiculos/:id` | Elimina un vehículo; requiere JWT | `204 No Content` |

Las rutas de escritura `POST`, `PATCH` y `DELETE` de órdenes, clientes y vehículos requieren el encabezado `Authorization: Bearer <token>`. Sin token responden `401 Unauthorized`. Registra primero un usuario de prueba en `/auth/register`, inicia sesión en `/auth/login` y usa el valor `access_token` como Bearer; el hash de la contraseña no se incluye en la respuesta de registro ni en el perfil.

### Búsqueda, filtros y paginación de órdenes

`GET /ordenes` admite estos query params opcionales; la API convierte los números y rechaza valores inválidos con `400 Bad Request`:

| Parámetro | Descripción | Valores |
| --- | --- | --- |
| `page` | Número de página, empezando en 1 | Entero `>= 1`; predeterminado `1` |
| `limit` | Elementos por página | Entero entre `1` y `100`; predeterminado `10` |
| `q` | Búsqueda parcial, sin distinguir mayúsculas, en código, placa, marca, modelo, cliente y descripción | Texto de hasta 100 caracteres |
| `estado` | Filtra por estado de la orden | `RECIBIDO`, `EN_DIAGNOSTICO`, `EN_REPARACION`, `LISTO`, `ENTREGADO`, `CANCELADO` |
| `tipoServicio` | Filtra por tipo de servicio | `ENDEREZADA`, `PINTURA`, `ENDEREZADA_Y_PINTURA` |
| `sortBy` | Campo de ordenamiento | `codigo`, `fechaIngreso`, `createdAt`, `costoEstimado`; predeterminado `createdAt` |
| `sortOrder` | Sentido del ordenamiento | `ASC` o `DESC`; predeterminado `DESC` |

Ejemplo: `GET /ordenes?q=toyota&estado=EN_REPARACION&page=2&limit=5&sortBy=fechaIngreso&sortOrder=ASC`.
La respuesta contiene los registros en `data` y los metadatos en `meta`:

```json
{
  "data": [],
  "meta": {
    "totalItems": 0,
    "totalPages": 0,
    "page": 2,
    "limit": 5
  }
}
```

`totalItems` cuenta los resultados que cumplen los filtros, antes de paginar; `totalPages` es el total de páginas (`0` cuando no hay resultados). Este formato reemplaza la respuesta anterior de arreglo directo para `GET /ordenes` y mantiene intactos los endpoints individuales y de escritura.

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

En Thunder Client, Insomnia o Postman, configura la URL base `http://localhost:3000`. Antes de probar escrituras, registra un usuario y realiza el login; configura el token recibido como Bearer Token en las peticiones `POST`, `PATCH` y `DELETE` de órdenes, clientes y vehículos.

1. `POST /ordenes` con el JSON de ejemplo y un token válido. Comprueba `201` y guarda el `id` devuelto.
2. `GET /ordenes` y `GET /ordenes/<id>`. Comprueba `200`; el listado devuelve los registros en `data` y la paginación en `meta`.
3. `PATCH /ordenes/<id>` con `{"estado":"EN_REPARACION"}` y un token válido. Comprueba `200` y el nuevo estado.
4. Prueba `POST /ordenes` con `{}` y un token válido. Comprueba `400` por los campos obligatorios; sin token el guard responde primero `401`.
5. Prueba `GET /ordenes/00000000-0000-4000-8000-000000000000`. Comprueba `404` (UUID válido que no existe).
6. `DELETE /ordenes/<id>` con un token válido. Comprueba `204`; un `GET` posterior debe devolver `404`.
7. Crea varias órdenes con la misma marca y estado, y consulta `GET /ordenes?q=Toyota&estado=RECIBIDO&page=1&limit=2&sortBy=codigo&sortOrder=ASC`. Comprueba que `data` respete los filtros y que `meta` informe el total filtrado, páginas, página actual y límite.
8. Cambia `page` a `2` y verifica que `meta.page` también cambie a `2`.
9. Prueba `limit=200` y comprueba la respuesta `400 Bad Request`.
10. Compara `sortOrder=ASC` y `sortOrder=DESC` para observar el orden de los códigos en cada consulta.

### Autenticación y autorización

1. Registra un usuario de prueba con `POST /auth/register` y un JSON como `{"nombre":"Usuario Demo","email":"demo@example.com","password":"UnaClaveDePrueba_123"}`. Usa credenciales locales de prueba, no las de una persona real.
2. Inicia sesión con `POST /auth/login` y el email y contraseña de registro. Copia `access_token` de la respuesta.
3. Envía una creación de orden válida a `POST /ordenes` sin encabezado `Authorization`: debe responder `401 Unauthorized`.
4. Repite la misma petición agregando `Authorization: Bearer <access_token>`: debe responder `201 Created`. También puedes verificar `GET /auth/profile` con el token.

### Clientes y vehículos

1. `POST /clientes` con un token válido y `{"nombreCompleto":"Ana Pérez","telefono":"+593991234567","email":"ana@example.com"}`; guarda el `id`.
2. `POST /vehiculos` con un token válido y `{"placa":"ABC1234","marca":"Toyota","modelo":"Corolla","anio":2020,"clienteId":"<id-del-cliente>"}`.
3. `GET /clientes/<id-del-cliente>/vehiculos`. Comprueba que el vehículo creado aparezca en la respuesta.
4. Intenta eliminar el cliente asociado con `DELETE /clientes/<id-del-cliente>` usando un token: debe responder `409`. Elimina el vehículo y vuelve a probar; debe responder `204`.
5. Repite `POST /vehiculos` con un `clienteId` inexistente y un token; comprueba `404`. Envía un año inválido o una propiedad no permitida con token y comprueba `400`.

Para demostrar persistencia, crea otra orden y conserva su `id`; detén y vuelve a iniciar la API sin borrar ni recrear la base de datos, luego ejecuta `GET /ordenes/<id>`. Debe responder `200` con la orden original. La persistencia la proporciona PostgreSQL, no la memoria del proceso NestJS.

## Evidencias

Guarda capturas reales de Thunder Client/Insomnia/Postman y del reinicio más la consulta posterior en [docs/evidencias](docs/evidencias/). Incluye como mínimo: creación (`201`), listado o consulta (`200`), validación (`400`), no encontrado (`404`), eliminación (`204`), consulta de vehículos por cliente, rechazo al eliminar un cliente con vehículos (`409`) y persistencia después del reinicio (`200`). Nombra cada captura indicando operación y resultado, por ejemplo `01-post-201.png` y `06-persistencia-reinicio-200.png`. No incluyas contraseñas ni otros secretos visibles en las capturas.
