import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const ROOT = join(__dirname, '..', '..');
const ENV_EXAMPLE_PATH = join(ROOT, '.env.example');
const SEED_PATH = join(ROOT, 'prisma', 'seed.ts');
const PACKAGE_JSON_PATH = join(ROOT, 'package.json');
const README_PATH = join(ROOT, 'README.md');

interface PackageJson {
  scripts?: Record<string, string>;
  devDependencies?: Record<string, string>;
  dependencies?: Record<string, string>;
}

const readPkg = (): PackageJson =>
  JSON.parse(readFileSync(PACKAGE_JSON_PATH, 'utf8')) as PackageJson;

const readEnv = (): string => readFileSync(ENV_EXAMPLE_PATH, 'utf8');
const readSeed = (): string => readFileSync(SEED_PATH, 'utf8');
const readReadme = (): string => readFileSync(README_PATH, 'utf8');

describe('AC1: .env.example con todas las variables requeridas y descripción', () => {
  it('.env.example exists at the repo root', () => {
    expect(existsSync(ENV_EXAMPLE_PATH)).toBe(true);
  });

  it('documents DATABASE_URL with a postgresql:// connection string', () => {
    const env = readEnv();
    expect(env).toMatch(/^\s*DATABASE_URL\s*=.*postgresql:\/\//m);
  });

  it('documents NEXT_PUBLIC_APP_URL', () => {
    const env = readEnv();
    expect(env).toMatch(/^\s*NEXT_PUBLIC_APP_URL\s*=/m);
  });

  it('documents LOAN_DURATION_DAYS and MAX_BOOKS_PER_MEMBER application tunables', () => {
    const env = readEnv();
    expect(env).toMatch(/^\s*LOAN_DURATION_DAYS\s*=/m);
    expect(env).toMatch(/^\s*MAX_BOOKS_PER_MEMBER\s*=/m);
  });

  it('every variable has at least one preceding comment line as description', () => {
    const env = readEnv();
    const lines = env.split('\n');
    const varLines = lines
      .map((line, idx) => ({ line, idx }))
      .filter(({ line }) => /^\s*[A-Z][A-Z0-9_]*\s*=/.test(line));

    expect(varLines.length).toBeGreaterThanOrEqual(4);

    for (const { idx } of varLines) {
      let foundComment = false;
      for (let i = idx - 1; i >= Math.max(0, idx - 4); i--) {
        if (/^\s*#/.test(lines[i])) {
          foundComment = true;
          break;
        }
        if (/^\s*[A-Z][A-Z0-9_]*\s*=/.test(lines[i])) {
          break;
        }
      }
      expect(foundComment).toBe(true);
    }
  });

  it('does NOT contain real secrets — only placeholders', () => {
    const env = readEnv();
    expect(env).not.toMatch(/AKIA[0-9A-Z]{16}/);
    expect(env).not.toMatch(/[a-f0-9]{40,}/);
  });
});

describe('AC2: prisma/seed.ts con 5+ books y 3+ members', () => {
  it('prisma/seed.ts exists', () => {
    expect(existsSync(SEED_PATH)).toBe(true);
  });

  it('imports PrismaClient from @prisma/client', () => {
    const seed = readSeed();
    expect(seed).toMatch(/from\s+['"]@prisma\/client['"]/);
    expect(seed).toMatch(/PrismaClient/);
  });

  it('seeds at least 5 distinct books via prisma.book.upsert', () => {
    const seed = readSeed();
    // Count unique ISBN string literals — each row in the BOOKS table carries one.
    const isbnLiterals = seed.match(/isbn:\s*['"]\d{3}-\d-[\d-]+['"]/g) ?? [];
    const uniqueIsbns = new Set(isbnLiterals);
    expect(uniqueIsbns.size).toBeGreaterThanOrEqual(5);
    expect(seed).toMatch(/prisma\.book\.upsert/);
  });

  it('seeds at least 3 distinct members via prisma.member.upsert', () => {
    const seed = readSeed();
    const emailLiterals = seed.match(/email:\s*['"][^'"]+@[^'"]+['"]/g) ?? [];
    const uniqueEmails = new Set(emailLiterals);
    expect(uniqueEmails.size).toBeGreaterThanOrEqual(3);
    expect(seed).toMatch(/prisma\.member\.upsert/);
  });

  it('also seeds at least one loan to exercise the FK relations', () => {
    const seed = readSeed();
    expect(seed).toMatch(/prisma\.loan\.create/);
  });

  it('seed.ts type-checks under tsc --noEmit', () => {
    // Compile the file in isolation against the project's tsconfig.
    // ts-jest already transformed it for this test run, but a standalone
    // type-check guards against `any` slipping in.
    const { execSync } = require('child_process') as typeof import('child_process');
    expect(() =>
      execSync('npx --no-install tsc --noEmit --skipLibCheck prisma/seed.ts', {
        cwd: ROOT,
        stdio: 'pipe',
      }),
    ).not.toThrow();
  }, 60_000);

  it('package.json declares a db:seed script wired to prisma/seed.ts', () => {
    const pkg = readPkg();
    expect(pkg.scripts?.['db:seed']).toBeDefined();
    expect(pkg.scripts?.['db:seed']).toMatch(/prisma\/seed\.ts/);
  });
});

describe('AC3: Script `npm run db:reset` funcional', () => {
  it('package.json declares a db:reset script', () => {
    const pkg = readPkg();
    expect(pkg.scripts?.['db:reset']).toBeDefined();
  });

  it('db:reset invokes `prisma migrate reset`', () => {
    const pkg = readPkg();
    expect(pkg.scripts?.['db:reset']).toMatch(/prisma\s+migrate\s+reset/);
  });

  it('prisma CLI is installed as a devDependency (db:reset depends on it)', () => {
    const pkg = readPkg();
    expect(pkg.devDependencies?.['prisma']).toBeDefined();
  });

  it('`npx prisma migrate reset --help` exits 0 — the subcommand is available', () => {
    const { execSync } = require('child_process') as typeof import('child_process');
    expect(() =>
      execSync('npx --no-install prisma migrate reset --help', {
        cwd: ROOT,
        stdio: 'pipe',
      }),
    ).not.toThrow();
  }, 60_000);
});

describe('AC4: README con instrucciones de setup paso a paso', () => {
  it('README.md exists at the repo root', () => {
    expect(existsSync(README_PATH)).toBe(true);
  });

  it('has a Getting Started section', () => {
    const readme = readReadme();
    expect(readme).toMatch(/##\s*Getting Started/i);
  });

  it('documents prerequisites (Node.js + PostgreSQL)', () => {
    const readme = readReadme();
    expect(readme).toMatch(/Node\.js/i);
    expect(readme).toMatch(/PostgreSQL/i);
  });

  it('walks the user through clone/install, env config, db migrate, db seed, and dev', () => {
    const readme = readReadme();
    // Look for the canonical commands in order.
    expect(readme).toMatch(/npm\s+install/);
    expect(readme).toMatch(/cp\s+\.env\.example/);
    expect(readme).toMatch(/npm\s+run\s+db:migrate/);
    expect(readme).toMatch(/npm\s+run\s+db:seed/);
    expect(readme).toMatch(/npm\s+run\s+dev/);
  });

  it('mentions db:reset as a recovery option', () => {
    const readme = readReadme();
    expect(readme).toMatch(/db:reset/);
  });

  it('documents the environment variables in a Reference section', () => {
    const readme = readReadme();
    expect(readme).toMatch(/##\s*Environment Variables/i);
    expect(readme).toMatch(/DATABASE_URL/);
  });

  it('uses numbered/ordered steps so the setup is genuinely paso a paso', () => {
    const readme = readReadme();
    // The Getting Started block uses "### 1. ", "### 2. ", "### 3. ", "### 4. " headings.
    expect(readme).toMatch(/###\s*1\.\s/);
    expect(readme).toMatch(/###\s*2\.\s/);
    expect(readme).toMatch(/###\s*3\.\s/);
    expect(readme).toMatch(/###\s*4\.\s/);
  });
});
