# AutoBodyOps API

API REST para registrar y administrar órdenes de reparación de talleres de enderezada y pintura. Está construida con NestJS, PostgreSQL, TypeORM y `class-validator`.

## Requisitos y ejecución

- Node.js 20 o superior y npm.
- PostgreSQL disponible localmente.

```bash
npm install
```

Copia `.env.example` a `.env` y ajusta las credenciales a tu instalación de PostgreSQL. Crea antes la base de datos indicada por `DB_NAME` (por defecto, `autobodyops`). En PowerShell:

```powershell
Copy-Item .env.example .env
```

Inicia el servidor en modo desarrollo con `npm run start:dev`; por defecto escucha en `http://localhost:3000`. TypeORM crea/actualiza las tablas automáticamente solo fuera de producción. En producción `synchronize` queda desactivado; se deben usar migraciones.

## Endpoints

Todos los recursos están bajo `/ordenes`. Los identificadores son UUID versión 4.

| Método | Ruta | Descripción | Respuesta exitosa |
| --- | --- | --- | --- |
| GET | `/ordenes` | Lista órdenes, de la más reciente a la más antigua | `200 OK` |
| GET | `/ordenes/:id` | Consulta una orden | `200 OK` |
| POST | `/ordenes` | Crea una orden; el sistema genera `id` y `codigo` | `201 Created` |
| PATCH | `/ordenes/:id` | Actualiza solo los campos enviados | `200 OK` |
| DELETE | `/ordenes/:id` | Elimina una orden | `204 No Content` |

Errores esperados: `400 Bad Request` para datos inválidos o un UUID mal formado; `404 Not Found` si el UUID es válido pero no existe. El `PATCH` puede recibir cualquier subconjunto de los campos de creación. `id`, `codigo`, `tenantId`, `createdAt` y `updatedAt` no se aceptan en el cuerpo de creación/actualización.

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

Para demostrar persistencia, crea otra orden y conserva su `id`; detén y vuelve a iniciar la API sin borrar ni recrear la base de datos, luego ejecuta `GET /ordenes/<id>`. Debe responder `200` con la orden original. La persistencia la proporciona PostgreSQL, no la memoria del proceso NestJS.

## Evidencias

Guarda capturas reales de Thunder Client/Insomnia/Postman y del reinicio más la consulta posterior en [docs/evidencias](docs/evidencias/). Incluye como mínimo: creación (`201`), listado o consulta (`200`), validación (`400`), no encontrado (`404`), eliminación (`204`) y persistencia después del reinicio (`200`). Nombra cada captura indicando operación y resultado, por ejemplo `01-post-201.png` y `06-persistencia-reinicio-200.png`. No incluyas contraseñas ni otros secretos visibles en las capturas.

## Material para el informe Word

El documento [docs/guia-entrega.md](docs/guia-entrega.md) contiene una definición del sistema, estructura sugerida del informe, tabla para integrantes, enlace al repositorio, referencia al diagrama y lista de evidencias que puedes incorporar al Word. El diagrama de la entidad implementada está en [docs/diagrama-entidades.md](docs/diagrama-entidades.md).
