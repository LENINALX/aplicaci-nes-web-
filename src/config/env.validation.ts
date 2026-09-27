export function validateEnvironment(env: Record<string, unknown>) {
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
  const sync = env.DB_SYNC ?? 'false';
  if (sync !== 'true' && sync !== 'false') {
    throw new Error('DB_SYNC debe ser true o false.');
  }
  if (env.NODE_ENV === 'production' && sync === 'true') {
    throw new Error('DB_SYNC debe ser false en producción.');
  }
  result.DB_SYNC = sync === 'true';
  return result;
}
