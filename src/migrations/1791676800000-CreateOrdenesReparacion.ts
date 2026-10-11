import { MigrationInterface, QueryRunner } from 'typeorm';

// Esquema existente de Etapa 1; no añade entidades del integrante 3.
export class CreateOrdenesReparacion1791676800000 implements MigrationInterface {
  name = 'CreateOrdenesReparacion1791676800000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(`CREATE TYPE "public"."ordenes_reparacion_tiposervicio_enum" AS ENUM ('ENDEREZADA', 'PINTURA', 'ENDEREZADA_Y_PINTURA')`);
    await queryRunner.query(`CREATE TYPE "public"."ordenes_reparacion_estado_enum" AS ENUM ('RECIBIDO', 'EN_DIAGNOSTICO', 'EN_REPARACION', 'LISTO', 'ENTREGADO', 'CANCELADO')`);
    await queryRunner.query(`CREATE TABLE "ordenes_reparacion" (
      "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
      "codigo" character varying(20) NOT NULL,
      "tenantId" character varying(50) NOT NULL DEFAULT 'default',
      "placaVehiculo" character varying(10) NOT NULL,
      "marca" character varying(50) NOT NULL,
      "modelo" character varying(50) NOT NULL,
      "anio" integer NOT NULL,
      "nombreCliente" character varying(100) NOT NULL,
      "telefonoCliente" character varying(15) NOT NULL,
      "tipoServicio" "public"."ordenes_reparacion_tiposervicio_enum" NOT NULL,
      "descripcionDanio" text NOT NULL,
      "estado" "public"."ordenes_reparacion_estado_enum" NOT NULL DEFAULT 'RECIBIDO',
      "costoEstimado" numeric(10,2) NOT NULL DEFAULT '0',
      "fechaIngreso" date NOT NULL DEFAULT CURRENT_DATE,
      "fechaEstimadaEntrega" date,
      "notas" text,
      "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      CONSTRAINT "UQ_31c9059dfaeff7a7ae9b320a33d" UNIQUE ("codigo"),
      CONSTRAINT "PK_90064c4ed5a7aad5d3d376a3fed" PRIMARY KEY ("id")
    )`);
    await queryRunner.query(`CREATE INDEX "IDX_553039e9b789a2a5b59fd16a80" ON "ordenes_reparacion" ("tenantId")`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_553039e9b789a2a5b59fd16a80"`);
    await queryRunner.query(`DROP TABLE "ordenes_reparacion"`);
    await queryRunner.query(`DROP TYPE "public"."ordenes_reparacion_estado_enum"`);
    await queryRunner.query(`DROP TYPE "public"."ordenes_reparacion_tiposervicio_enum"`);
    // uuid-ossp puede estar siendo utilizada por otros módulos.
  }
}
