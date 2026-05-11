import { PrismaClient } from '@prisma/client';

/**
 * Prisma Client singleton.
 *
 * In development, Next.js hot-reload would create a new PrismaClient on every
 * module reload, quickly exhausting the PostgreSQL connection pool.
 * The global singleton pattern prevents this.
 *
 * In production, a fresh instance is created once at startup.
 *
 * See: https://www.prisma.io/docs/guides/performance-and-optimization/connection-management
 */

declare global {
  // Allow augmenting the global object in TypeScript.
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });
}

export const prisma: PrismaClient =
  process.env.NODE_ENV === 'production'
    ? createPrismaClient()
    : (global.__prisma ??= createPrismaClient());
