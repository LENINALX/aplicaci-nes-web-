import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateClientesVehiculos1791758931257 implements MigrationInterface {
    name = 'CreateClientesVehiculos1791758931257'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "clientes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "nombreCompleto" character varying(100) NOT NULL, "telefono" character varying(15) NOT NULL, "email" character varying(120), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_d76bf3571d906e4e86470482c08" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "vehiculos" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "placa" character varying(10) NOT NULL, "marca" character varying(50) NOT NULL, "modelo" character varying(50) NOT NULL, "anio" integer NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "clienteId" uuid NOT NULL, CONSTRAINT "UQ_a9455f3a37d1d922a10f51664e9" UNIQUE ("placa"), CONSTRAINT "PK_bc0b75baae377e599cd46b502e1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "ordenes_reparacion" ALTER COLUMN "fechaIngreso" SET DEFAULT ('now'::text)::date`);
        await queryRunner.query(`ALTER TABLE "vehiculos" ADD CONSTRAINT "FK_1c06553ebb5b8d903cd307816ea" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "vehiculos" DROP CONSTRAINT "FK_1c06553ebb5b8d903cd307816ea"`);
        await queryRunner.query(`ALTER TABLE "ordenes_reparacion" ALTER COLUMN "fechaIngreso" SET DEFAULT CURRENT_DATE`);
        await queryRunner.query(`DROP TABLE "vehiculos"`);
        await queryRunner.query(`DROP TABLE "clientes"`);
    }

}
