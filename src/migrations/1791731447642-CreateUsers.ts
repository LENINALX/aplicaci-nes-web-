import { MigrationInterface, QueryRunner } from 'typeorm';

// Tabla de usuarios del módulo Auth (integrante 1).
// uuid_generate_v4 viene de uuid-ossp, creada en la migración inicial.
export class CreateUsers1791731447642 implements MigrationInterface {
  name = 'CreateUsers1791731447642';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "users" (
      "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
      "nombre" character varying(100) NOT NULL,
      "email" character varying(120) NOT NULL,
      "passwordHash" character varying(60) NOT NULL,
      "tenantId" character varying(50) NOT NULL DEFAULT 'default',
      "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"),
      CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
    )`);
    await queryRunner.query(`CREATE INDEX "IDX_c58f7e88c286e5e3478960a998" ON "users" ("tenantId")`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_c58f7e88c286e5e3478960a998"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
