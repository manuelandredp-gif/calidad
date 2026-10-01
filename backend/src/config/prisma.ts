import { PrismaClient } from '@prisma/client';
import { env, isProduction } from './env';
import { logger } from '../common/utils/logger';

export const prisma = new PrismaClient({
  log: isProduction ? ['error'] : ['warn', 'error'],
});

const isSqlite = env.DATABASE_URL.startsWith('file:');

/**
 * Configuración de Resiliencia y Concurrencia para SQLite (evita bloqueos SQLITE_BUSY).
 * En PostgreSQL estos PRAGMA no aplican y se omiten de forma segura.
 */
export async function initDatabasePragmas() {
  if (!isSqlite) return;
  try {
    // WAL (Write-Ahead Logging) permite lecturas y escrituras simultáneas sin colisión
    await prisma.$executeRawUnsafe('PRAGMA journal_mode = WAL;');
    await prisma.$executeRawUnsafe('PRAGMA busy_timeout = 5000;');
    await prisma.$executeRawUnsafe('PRAGMA synchronous = NORMAL;');
    await prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON;');
  } catch (error) {
    logger.warn({ error }, 'No se pudieron aplicar los PRAGMA de SQLite');
  }
}

/** Cierra la conexión con la base de datos de forma ordenada (graceful shutdown). */
export async function disconnectDatabase() {
  await prisma.$disconnect();
}
