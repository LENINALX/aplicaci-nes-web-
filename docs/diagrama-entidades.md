# Diagrama de entidades

## Entidades implementadas

La API conserva el contrato de órdenes de la primera etapa. Para el CRUD relacional se agregan `Cliente` y `Vehiculo`: un cliente puede tener varios vehículos y cada vehículo pertenece obligatoriamente a un cliente. La clave foránea `vehiculos.clienteId` usa `ON DELETE RESTRICT`; primero se deben eliminar los vehículos asociados para poder eliminar a su cliente.

```mermaid
erDiagram
	CLIENTE ||--o{ VEHICULO : posee
	CLIENTE {
		uuid id PK
		varchar nombreCompleto
		varchar telefono
		varchar email
		timestamptz createdAt
		timestamptz updatedAt
	}
	VEHICULO {
		uuid id PK
		varchar placa UK
		varchar marca
		varchar modelo
		int anio
		uuid clienteId FK
		timestamptz createdAt
		timestamptz updatedAt
	}
	ORDEN_REPARACION {
		uuid id PK
		varchar codigo UK
		varchar tenantId
		varchar placaVehiculo
		varchar marca
		varchar modelo
		int anio
		varchar nombreCliente
		varchar telefonoCliente
		enum tipoServicio
		text descripcionDanio
		enum estado
		numeric costoEstimado
		date fechaIngreso
		date fechaEstimadaEntrega
		text notas
		timestamptz createdAt
		timestamptz updatedAt
	}
```

Los campos de cliente y vehículo de `ORDEN_REPARACION` se conservan para no romper el contrato de la etapa anterior. Los nuevos endpoints de clientes y vehículos usan las tablas relacionadas descritas arriba.
