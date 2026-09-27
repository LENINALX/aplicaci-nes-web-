# Guía para el informe de entrega

Usa esta estructura como borrador para el documento Word y reemplaza los campos entre corchetes con los datos del equipo.

## Portada

- Institución: [nombre de la institución]
- Asignatura: [nombre de la asignatura]
- Proyecto: AutoBodyOps API
- Integrantes: [nombres completos]
- Docente: [nombre]
- Fecha: [fecha de entrega]

## Definición del proyecto

AutoBodyOps es una API REST para registrar y dar seguimiento a órdenes de reparación de vehículos en talleres de enderezada y pintura. Cada orden almacena la información del cliente y del vehículo, el tipo de servicio, la descripción del daño, el estado del trabajo, el costo estimado y las fechas relevantes. La API está desarrollada con NestJS y TypeORM, y persiste los datos en PostgreSQL.

En esta etapa se implementan operaciones de creación, consulta, actualización parcial y eliminación de órdenes. La API valida los datos recibidos y responde con códigos HTTP acordes al resultado. La entidad contempla `tenantId` como preparación para una futura evolución multi-taller; la autenticación y el aislamiento entre talleres no forman parte de esta etapa.

## Integrantes y responsabilidades

| Integrante | Responsabilidad |
| --- | --- |
| [Nombre completo] | [Responsabilidad asignada] |
| [Nombre completo] | [Responsabilidad asignada] |

## Repositorio y modelo

- Repositorio: https://github.com/LENINALX/aplicaci-nes-web-.git
- Diagrama: insertar aquí el diagrama de `docs/diagrama-entidades.md`.
- Endpoints y respuestas: consultar la tabla del README del repositorio.

## Pruebas y evidencias

Inserta las capturas originales guardadas en `docs/evidencias/` y añade una frase que describa qué verifica cada una. Debe mostrarse la creación de una orden, consultas, actualización, respuestas de validación y no encontrado, eliminación, y la consulta exitosa del mismo registro después de reiniciar la API.

No declares como realizada una prueba hasta ejecutarla. Antes de entregar, completa los integrantes, añade las capturas reales y verifica que el enlace al repositorio sea accesible para el docente.