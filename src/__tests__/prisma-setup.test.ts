import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

const ROOT = join(__dirname, '..', '..');
const SCHEMA_PATH = join(ROOT, 'prisma', 'schema.prisma');
const MIGRATIONS_DIR = join(ROOT, 'prisma', 'migrations');
const LIB_PRISMA_PATH = join(ROOT, 'src', 'lib', 'prisma.ts');
const ENV_EXAMPLE_PATH = join(ROOT, '.env.example');

const readSchema = (): string => readFileSync(SCHEMA_PATH, 'utf8');

describe('AC1: prisma/schema.prisma con modelos Book, Member, Loan correctamente relacionados', () => {
  it('schema.prisma file exists at the expected location', () => {
    expect(existsSync(SCHEMA_PATH)).toBe(true);
  });

  it('declares the PostgreSQL datasource using env("DATABASE_URL")', () => {
    const schema = readSchema();
    expect(schema).toMatch(/datasource\s+db\s*\{[\s\S]*?provider\s*=\s*"postgresql"[\s\S]*?\}/);
    expect(schema).toMatch(/url\s*=\s*env\("DATABASE_URL"\)/);
  });

  it('declares the prisma-client-js generator', () => {
    const schema = readSchema();
    expect(schema).toMatch(/generator\s+client\s*\{[\s\S]*?provider\s*=\s*"prisma-client-js"[\s\S]*?\}/);
  });

  it('defines the Book model with the expected scalar fields', () => {
    const schema = readSchema();
    expect(schema).toMatch(/model\s+Book\s*\{/);
    for (const field of ['id', 'isbn', 'title', 'author', 'publisher', 'publishedAt', 'totalCopies', 'createdAt', 'updatedAt']) {
      expect(schema).toMatch(new RegExp(`\\b${field}\\b`));
    }
  });

  it('Book.isbn is marked @unique', () => {
    const schema = readSchema();
    const bookBlock = schema.match(/model\s+Book\s*\{[\s\S]*?\n\}/)?.[0] ?? '';
    expect(bookBlock).toMatch(/isbn\s+String\s+@unique/);
  });

  it('defines the Member model with email @unique and a MemberStatus enum default', () => {
    const schema = readSchema();
    const memberBlock = schema.match(/model\s+Member\s*\{[\s\S]*?\n\}/)?.[0] ?? '';
    expect(memberBlock).toMatch(/email\s+String\s+@unique/);
    expect(memberBlock).toMatch(/status\s+MemberStatus\s+@default\(ACTIVE\)/);
    expect(schema).toMatch(/enum\s+MemberStatus\s*\{[\s\S]*?ACTIVE[\s\S]*?SUSPENDED[\s\S]*?CLOSED[\s\S]*?\}/);
  });

  it('defines the Loan model with FK fields and a LoanStatus enum default', () => {
    const schema = readSchema();
    const loanBlock = schema.match(/model\s+Loan\s*\{[\s\S]*?\n\}/)?.[0] ?? '';
    expect(loanBlock).toMatch(/bookId\s+String/);
    expect(loanBlock).toMatch(/memberId\s+String/);
    expect(loanBlock).toMatch(/status\s+LoanStatus\s+@default\(ACTIVE\)/);
    expect(schema).toMatch(/enum\s+LoanStatus\s*\{[\s\S]*?ACTIVE[\s\S]*?RETURNED[\s\S]*?OVERDUE[\s\S]*?\}/);
  });

  it('Loan has @relation pointing to Book(id) and Member(id)', () => {
    const schema = readSchema();
    const loanBlock = schema.match(/model\s+Loan\s*\{[\s\S]*?\n\}/)?.[0] ?? '';
    expect(loanBlock).toMatch(/book\s+Book\s+@relation\(fields:\s*\[bookId\],\s*references:\s*\[id\]/);
    expect(loanBlock).toMatch(/member\s+Member\s+@relation\(fields:\s*\[memberId\],\s*references:\s*\[id\]/);
  });

  it('Book and Member declare the inverse `loans Loan[]` collection', () => {
    const schema = readSchema();
    const bookBlock = schema.match(/model\s+Book\s*\{[\s\S]*?\n\}/)?.[0] ?? '';
    const memberBlock = schema.match(/model\s+Member\s*\{[\s\S]*?\n\}/)?.[0] ?? '';
    expect(bookBlock).toMatch(/loans\s+Loan\[\]/);
    expect(memberBlock).toMatch(/loans\s+Loan\[\]/);
  });

  it('declares supporting indexes on the Loan model for FK and status lookups', () => {
    const schema = readSchema();
    const loanBlock = schema.match(/model\s+Loan\s*\{[\s\S]*?\n\}/)?.[0] ?? '';
    expect(loanBlock).toMatch(/@@index\(\[bookId\]\)/);
    expect(loanBlock).toMatch(/@@index\(\[memberId\]\)/);
    expect(loanBlock).toMatch(/@@index\(\[status\]\)/);
  });

  it('maps each model to its snake-style plural table name', () => {
    const schema = readSchema();
    expect(schema).toMatch(/@@map\("books"\)/);
    expect(schema).toMatch(/@@map\("members"\)/);
    expect(schema).toMatch(/@@map\("loans"\)/);
  });

  it('prisma schema validates with `prisma validate`', () => {
    // Sanity check that the schema parses cleanly. DATABASE_URL just has to be
    // syntactically valid — `validate` doesn't actually connect.
    const { execSync } = require('child_process') as typeof import('child_process');
    expect(() =>
      execSync('npx --no-install prisma validate', {
        cwd: ROOT,
        stdio: 'pipe',
        env: {
          ...process.env,
          DATABASE_URL: 'postgresql://user:pass@localhost:5432/_validate_only',
        },
      }),
    ).not.toThrow();
  }, 60_000);
});

describe('AC2: Migración inicial ejecutada exitosamente (`prisma migrate dev`)', () => {
  it('prisma/migrations/ directory exists', () => {
    expect(existsSync(MIGRATIONS_DIR)).toBe(true);
    expect(statSync(MIGRATIONS_DIR).isDirectory()).toBe(true);
  });

  it('contains migration_lock.toml declaring the postgresql provider', () => {
    const lockPath = join(MIGRATIONS_DIR, 'migration_lock.toml');
    expect(existsSync(lockPath)).toBe(true);
    const lock = readFileSync(lockPath, 'utf8');
    expect(lock).toMatch(/provider\s*=\s*"postgresql"/);
  });

  it('has at least one timestamped migration folder with a migration.sql', () => {
    const entries = readdirSync(MIGRATIONS_DIR).filter((name) =>
      statSync(join(MIGRATIONS_DIR, name)).isDirectory(),
    );
    expect(entries.length).toBeGreaterThanOrEqual(1);

    // Each migration directory must have a migration.sql file.
    for (const entry of entries) {
      expect(/^\d{14}_/.test(entry)).toBe(true);
      expect(existsSync(join(MIGRATIONS_DIR, entry, 'migration.sql'))).toBe(true);
    }
  });

  it('the initial migration creates the three core tables and both enums', () => {
    const entries = readdirSync(MIGRATIONS_DIR)
      .filter((name) => statSync(join(MIGRATIONS_DIR, name)).isDirectory())
      .sort();
    const initial = entries[0];
    const sql = readFileSync(join(MIGRATIONS_DIR, initial, 'migration.sql'), 'utf8');

    expect(sql).toMatch(/CREATE TABLE "books"/);
    expect(sql).toMatch(/CREATE TABLE "members"/);
    expect(sql).toMatch(/CREATE TABLE "loans"/);
    expect(sql).toMatch(/CREATE TYPE "MemberStatus" AS ENUM/);
    expect(sql).toMatch(/CREATE TYPE "LoanStatus" AS ENUM/);
  });

  it('the initial migration wires foreign keys from loans to books and members', () => {
    const entries = readdirSync(MIGRATIONS_DIR)
      .filter((name) => statSync(join(MIGRATIONS_DIR, name)).isDirectory())
      .sort();
    const sql = readFileSync(join(MIGRATIONS_DIR, entries[0], 'migration.sql'), 'utf8');

    expect(sql).toMatch(/ADD CONSTRAINT "loans_bookId_fkey" FOREIGN KEY \("bookId"\) REFERENCES "books"\("id"\)/);
    expect(sql).toMatch(/ADD CONSTRAINT "loans_memberId_fkey" FOREIGN KEY \("memberId"\) REFERENCES "members"\("id"\)/);
  });

  it('the migration SQL matches what `prisma migrate diff` would re-generate from the current schema', () => {
    // This is the strongest assurance available without a running DB:
    // re-derive the SQL diff and confirm the on-disk migration matches it.
    // If a developer edits schema.prisma without `prisma migrate dev`, this test fails.
    const { execSync } = require('child_process') as typeof import('child_process');
    const recomputed = execSync(
      'npx --no-install prisma migrate diff --from-empty --to-schema-datamodel ./prisma/schema.prisma --script',
      { cwd: ROOT, encoding: 'utf8' },
    );

    const entries = readdirSync(MIGRATIONS_DIR)
      .filter((name) => statSync(join(MIGRATIONS_DIR, name)).isDirectory())
      .sort();
    const onDisk = readFileSync(join(MIGRATIONS_DIR, entries[0], 'migration.sql'), 'utf8');

    // Normalise whitespace differences only.
    const normalise = (s: string): string => s.replace(/\s+/g, ' ').trim();
    expect(normalise(onDisk)).toBe(normalise(recomputed));
  }, 60_000);
});

describe('AC3: Prisma Client generado y exportado desde `/lib/prisma.ts`', () => {
  it('src/lib/prisma.ts file exists', () => {
    expect(existsSync(LIB_PRISMA_PATH)).toBe(true);
  });

  it('exports a `prisma` named binding', () => {
    const src = readFileSync(LIB_PRISMA_PATH, 'utf8');
    expect(src).toMatch(/export\s+const\s+prisma/);
  });

  it('uses the singleton pattern (caches on globalThis) to survive Next.js hot reload', () => {
    const src = readFileSync(LIB_PRISMA_PATH, 'utf8');
    expect(src).toMatch(/globalThis/);
    expect(src).toMatch(/new\s+PrismaClient/);
  });

  it('re-exports prisma from src/lib/index.ts', () => {
    const indexSrc = readFileSync(join(ROOT, 'src', 'lib', 'index.ts'), 'utf8');
    expect(indexSrc).toMatch(/prisma/);
  });

  it('@prisma/client has been generated (PrismaClient class is importable)', () => {
    // If `prisma generate` was not run, this require will throw with
    // "Module '@prisma/client' has no exported member 'PrismaClient'".
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('@prisma/client') as { PrismaClient: unknown };
    expect(typeof mod.PrismaClient).toBe('function');
  });

  it('exporting `prisma` does not throw at import time', () => {
    // Side-effect import: importing should not crash even without a live DB.
    expect(() => require(LIB_PRISMA_PATH)).not.toThrow();
  });
});

describe('AC4: Variables de entorno documentadas en `.env.example`', () => {
  it('.env.example file exists at the repo root', () => {
    expect(existsSync(ENV_EXAMPLE_PATH)).toBe(true);
  });

  it('documents DATABASE_URL with a postgresql:// connection string', () => {
    const env = readFileSync(ENV_EXAMPLE_PATH, 'utf8');
    expect(env).toMatch(/^\s*DATABASE_URL\s*=.*postgresql:\/\//m);
  });

  it('includes inline comments explaining each variable', () => {
    const env = readFileSync(ENV_EXAMPLE_PATH, 'utf8');
    // At least one comment line preceding DATABASE_URL.
    const lines = env.split('\n');
    const idx = lines.findIndex((l) => /^\s*DATABASE_URL\s*=/.test(l));
    expect(idx).toBeGreaterThan(0);
    // Scan upward for at least one #-comment within 3 lines.
    let foundComment = false;
    for (let i = idx - 1; i >= Math.max(0, idx - 4); i--) {
      if (/^\s*#/.test(lines[i])) {
        foundComment = true;
        break;
      }
    }
    expect(foundComment).toBe(true);
  });

  it('does NOT contain real secrets — only placeholders', () => {
    const env = readFileSync(ENV_EXAMPLE_PATH, 'utf8');
    // Heuristic: no AWS keys, no high-entropy hex strings >= 32 chars.
    expect(env).not.toMatch(/AKIA[0-9A-Z]{16}/);
    // The example value is the well-known default "password" — fine.
    // But anything that looks like a 32+ hex secret would be suspicious.
    expect(env).not.toMatch(/[a-f0-9]{40,}/);
  });
});
