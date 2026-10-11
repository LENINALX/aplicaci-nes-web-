export function validateDatabaseEnvironment(env: Record<string, unknown>) {
  const result = { ...env };
  for (const key of ['DB_HOST', 'DB_USER', 'DB_PASS', 'DB_NAME']) {
    if (typeof env[key] !== 'string' || !env[key].trim()) {
      throw new Error(
        `Falta ${key}. Configura el archivo .env según .env.example.`,
      );
    }
  }
  for (const [key, fallback] of [
    ['PORT', 3000],
    ['DB_PORT', 5432],
  ] as const) {
    const value = Number(env[key] ?? fallback);
    if (!Number.isInteger(value) || value < 1 || value > 65535) {
      throw new Error(`${key} debe ser un puerto entero entre 1 y 65535.`);
    }
    result[key] = value;
  }
  if (env.DB_SYNC !== undefined && env.DB_SYNC !== 'false') {
    throw new Error('DB_SYNC debe ser false. Usa las migraciones en todos los entornos.');
  }
  result.DB_SYNC = false;
  return result;
}

export function validateEnvironment(env: Record<string, unknown>) {
  const result = validateDatabaseEnvironment(env);
  if (typeof env.JWT_SECRET !== 'string' || env.JWT_SECRET.trim().length < 32) {
    throw new Error('JWT_SECRET debe contener al menos 32 caracteres.');
  }
  return result;
}
