import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRolesAndResourceOwners1791758931258 implements MigrationInterface {
  private readonly tables = ['clientes', 'vehiculos', 'ordenes_reparacion'];

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."user_role" AS ENUM ('admin', 'user')`);
    await queryRunner.query(`ALTER TABLE "users" ADD "role" "public"."user_role" NOT NULL DEFAULT 'user'`);
    for (const table of this.tables) {
      await queryRunner.query(`ALTER TABLE "${table}" ADD "ownerId" uuid`);
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    for (const table of this.tables) {
      await queryRunner.query(`ALTER TABLE "${table}" DROP COLUMN "ownerId"`);
    }
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "role"`);
    await queryRunner.query(`DROP TYPE "public"."user_role"`);
  }
}
