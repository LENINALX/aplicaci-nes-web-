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

AutoBodyOps es una API REST para registrar y dar seguimiento a órdenes de reparación de vehículos en talleres de enderezada y pintura. La API administra clientes y vehículos en entidades relacionadas: un cliente puede tener varios vehículos y cada vehículo pertenece a un cliente existente. También conserva los endpoints y los datos de órdenes de la etapa anterior.

La API está desarrollada con NestJS y TypeORM, y persiste los datos en PostgreSQL. Los endpoints de clientes y vehículos permiten creación, consulta, actualización parcial y eliminación con DTOs validados. `GET /clientes/:id/vehiculos` demuestra la consulta de registros relacionados. El borrado de un cliente con vehículos asociados se rechaza para preservar la integridad referencial. Completa en este informe los apartados de la etapa que aún no estén implementados, como migraciones, autenticación y rutas protegidas; no los declares como realizados sin evidencia.

## Integrantes y responsabilidades

| Integrante | Responsabilidad |
| --- | --- |
| [Nombre completo] | [Responsabilidad asignada] |
| [Nombre completo] | [Responsabilidad asignada] |

## Repositorio y modelo

- Repositorio: https://github.com/LENINALX/aplicaci-nes-web-.git
- Diagrama: insertar aquí el diagrama de `docs/diagrama-entidades.md`.
- Endpoints y respuestas: consultar la tabla del README del repositorio.
- Relación: `Cliente 1:N Vehiculo`; `vehiculos.clienteId` tiene clave foránea con borrado restringido. Insertar el diagrama actualizado desde `docs/diagrama-entidades.md`.

## Pruebas y evidencias

Inserta las capturas originales guardadas en `docs/evidencias/` y añade una frase que describa qué verifica cada una. Para esta parte, muestra creación y actualización validadas de clientes y vehículos, lectura de ambas entidades, asociación válida mediante `clienteId`, consulta `GET /clientes/:id/vehiculos`, validación de datos erróneos y el rechazo del borrado de clientes que tienen vehículos.

No declares como realizada una prueba hasta ejecutarla. Antes de entregar, completa los integrantes, añade las capturas reales y verifica que el enlace al repositorio sea accesible para el docente.