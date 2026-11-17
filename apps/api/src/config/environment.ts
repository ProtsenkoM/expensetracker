export function validateEnvironment(environment: Record<string, unknown>) {
  const databaseUrl = environment.DATABASE_URL;
  const corsOrigin = environment.CORS_ORIGIN;
  const port = Number(environment.PORT ?? 3001);
  const jwtSecret = environment.JWT_SECRET;

  if (typeof databaseUrl !== 'string' || !databaseUrl.trim()) {
    throw new Error('DATABASE_URL is required');
  }

  const database = new URL(databaseUrl);
  if (!['postgresql:', 'postgres:'].includes(database.protocol)) {
    throw new Error('DATABASE_URL must be a PostgreSQL URL');
  }

  if (typeof corsOrigin !== 'string' || !corsOrigin.trim()) {
    throw new Error('CORS_ORIGIN is required');
  }

  const origin = new URL(corsOrigin);
  if (
    !['http:', 'https:'].includes(origin.protocol) ||
    origin.origin !== corsOrigin
  ) {
    throw new Error('CORS_ORIGIN must be an HTTP(S) origin without a path');
  }

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535');
  }
  if (typeof jwtSecret !== 'string' || Buffer.byteLength(jwtSecret) < 32) {
    throw new Error('JWT_SECRET must be at least 32 bytes');
  }

  return {
    ...environment,
    DATABASE_URL: databaseUrl,
    CORS_ORIGIN: corsOrigin,
    PORT: port,
    JWT_SECRET: jwtSecret,
  };
}
