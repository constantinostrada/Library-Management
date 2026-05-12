import { PrismaClient } from '@prisma/client';

/**
 * Singleton Prisma Client for the Next.js runtime.
 *
 * Why the globalThis trick:
 *   In development, Next.js fast-refresh re-evaluates server modules on every
 *   file change. A naive `export const prisma = new PrismaClient()` would
 *   create a fresh client on each reload, eventually exhausting the Postgres
 *   connection pool. Caching the instance on `globalThis` survives module
 *   reloads while still being garbage-collected on a real process restart.
 *
 * In production, NODE_ENV !== 'development' so no global is set and a single
 * client lives for the lifetime of the lambda/process.
 *
 * Import as:
 *   import { prisma } from '@/lib/prisma';
 * or
 *   import { prisma } from '@/lib';
 */

declare global {
  // eslint-disable-next-line no-var
  var __libraryPrisma: PrismaClient | undefined;
}

export const prisma: PrismaClient =
  globalThis.__libraryPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.__libraryPrisma = prisma;
}

export default prisma;
