# Matriz de roles de la etapa 3

En Auto Body Ops, `user` es la cuenta operativa del taller y `admin` puede consultar los listados generales y administrar los registros de cualquier cuenta. El registro público asigna `user`. La API verifica el rol vigente en PostgreSQL en cada petición protegida, incluso si el JWT se emitió antes de un cambio de rol.

| Endpoint | Método | Acceso | Regla de propiedad |
| --- | --- | --- | --- |
| `/` | GET | Público | Sin requisito |
| `/auth/register`, `/auth/login` | POST | Público | El registro asigna `user` |
| `/auth/profile` | GET | `admin`, `user` | Devuelve el perfil del titular del token |
| `/ordenes`, `/clientes`, `/vehiculos` | GET | `admin` | Listados generales |
| `/ordenes/:id`, `/clientes/:id`, `/vehiculos/:id`, `/clientes/:id/vehiculos` | GET | Público | Consultas individuales de la etapa 2 |
| `/ordenes`, `/clientes`, `/vehiculos` | POST | `admin`, `user` | La cuenta autenticada queda como propietaria |
| `/ordenes/:id`, `/clientes/:id`, `/vehiculos/:id` | PATCH, DELETE | `admin`, `user` | Solo propietario o admin. Los registros históricos sin propietario requieren admin |

La propiedad corresponde a la cuenta de la API que creó el registro. La relación existente entre un cliente y sus vehículos sigue siendo independiente. Al borrar un cliente se mantiene la restricción por vehículos asociados.

## Administrador inicial

1. Ejecuta `npm run migration:run`.
2. Define `ADMIN_EMAIL` y `ADMIN_PASSWORD` en el entorno o en el `.env` local. Usa un correo reservado para el admin y una contraseña con al menos 12 caracteres y como máximo 72 bytes.
3. Ejecuta `npm run seed:admin` e inicia sesión con esas credenciales mediante `POST /auth/login`. Volver a ejecutar el seed conserva la cuenta y su contraseña. Si el correo pertenece a un usuario común, el seed termina con un error.

## Verificación HTTP

En Postman o Thunder Client, inicia sesión como admin y registra otras dos cuentas operativas. Para las peticiones autenticadas envía el encabezado `Authorization: Bearer <access_token>`.

| Petición | Credencial | Resultado esperado |
| --- | --- | --- |
| `GET /ordenes` | Sin token | 401 |
| `GET /ordenes` | Usuario operativo | 403 |
| `GET /ordenes` | Admin | 200 |
| `POST /ordenes` con un cuerpo válido | Usuario operativo | 201 |
| `PATCH /ordenes/:id` de la orden creada | Segundo usuario operativo | 403 |
| `PATCH /ordenes/:id` de la orden creada | Propietario o admin | 200 |
| `DELETE /ordenes/:id` de la orden creada | Propietario o admin | 204 |
