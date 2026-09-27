# Diagrama de entidades

## Entidad implementada

La primera etapa persiste los datos de cliente y vehículo dentro de cada orden. No existen todavía tablas independientes para `Cliente`, `Vehiculo` o `Tenant`.

```mermaid
erDiagram
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

La separación en entidades de taller, cliente, vehículo e ítems de orden queda como evolución futura del modelo.
