import 'reflect-metadata';
import * as bcrypt from 'bcrypt';
import { isEmail } from 'class-validator';
import dataSource from '../data-source';
import { Role } from '../common/enums/role.enum';
import { User } from '../users/users.entity';

async function seedAdmin(): Promise<void> {
  const source = await dataSource;
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || email.length > 120 || !isEmail(email) ||
      !password || password.length < 12 || Buffer.byteLength(password, 'utf8') > 72) {
    throw new Error('Configura ADMIN_EMAIL y ADMIN_PASSWORD (mínimo 12 caracteres y máximo 72 bytes).');
  }

  await source.initialize();
  try {
    const users = source.getRepository(User);
    const admin = { nombre: 'Administrador', email, role: Role.ADMIN };
    if (!(await users.existsBy({ email }))) {
      await users.createQueryBuilder().insert().values({
        ...admin,
        passwordHash: await bcrypt.hash(password, 10),
      }).orIgnore().execute();
    }
    if (!(await users.existsBy({ email, role: Role.ADMIN }))) {
      throw new Error('El email ya pertenece a una cuenta sin rol administrativo.');
    }
    console.log('Cuenta administrativa disponible.');
  } finally {
    await source.destroy();
  }
}

seedAdmin().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'No se pudo preparar la cuenta administrativa.');
  process.exitCode = 1;
});
