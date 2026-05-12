import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const ROOT = join(__dirname, '..', '..');

describe('AC1: Proyecto corre con `npm run dev` sin errores', () => {
  it('package.json declares the `dev` script pointing to `next dev`', () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
      scripts?: Record<string, string>;
    };
    expect(pkg.scripts?.dev).toBe('next dev');
  });

  it('next.config is in a format Next 14 accepts (.js or .mjs, NOT .ts)', () => {
    // Next.js 14 does NOT support next.config.ts — it must be .js or .mjs.
    expect(existsSync(join(ROOT, 'next.config.ts'))).toBe(false);
    const hasJs = existsSync(join(ROOT, 'next.config.js'));
    const hasMjs = existsSync(join(ROOT, 'next.config.mjs'));
    expect(hasJs || hasMjs).toBe(true);
  });

  it('project type-checks cleanly (`tsc --noEmit` exits 0)', () => {
    // Proxy for "dev compiles without errors" — runs the project's own type-check.
    expect(() =>
      execSync('npx tsc --noEmit', { cwd: ROOT, stdio: 'pipe' }),
    ).not.toThrow();
  }, 120_000);
});

describe('AC2: TypeScript strict mode habilitado', () => {
  it('tsconfig.json sets compilerOptions.strict = true', () => {
    const raw = readFileSync(join(ROOT, 'tsconfig.json'), 'utf8');
    const cfg = JSON.parse(raw) as { compilerOptions?: { strict?: boolean } };
    expect(cfg.compilerOptions?.strict).toBe(true);
  });
});

describe('AC3: Tailwind CSS funcional con un componente de prueba', () => {
  const componentPath = join(ROOT, 'src', 'components', 'TailwindTest.tsx');

  it('TailwindTest component exists in src/components/', () => {
    expect(existsSync(componentPath)).toBe(true);
  });

  it('TailwindTest uses Tailwind utility classes', () => {
    const src = readFileSync(componentPath, 'utf8');
    // Look for evidence of Tailwind utility class usage in the JSX className.
    expect(src).toMatch(/className=/);
    expect(src).toMatch(/\b(rounded-lg|bg-brand-50|text-brand-800|p-4)\b/);
  });

  it('tailwind.config.ts scans src/components for class extraction', () => {
    const cfg = readFileSync(join(ROOT, 'tailwind.config.ts'), 'utf8');
    expect(cfg).toMatch(/src\/components/);
  });

  it('postcss.config.js wires tailwindcss + autoprefixer plugins', () => {
    const cfg = readFileSync(join(ROOT, 'postcss.config.js'), 'utf8');
    expect(cfg).toMatch(/tailwindcss/);
    expect(cfg).toMatch(/autoprefixer/);
  });

  it('globals.css includes the three Tailwind @tailwind directives', () => {
    const css = readFileSync(join(ROOT, 'src', 'app', 'globals.css'), 'utf8');
    expect(css).toMatch(/@tailwind\s+base/);
    expect(css).toMatch(/@tailwind\s+components/);
    expect(css).toMatch(/@tailwind\s+utilities/);
  });

  it('homepage mounts the TailwindTest component', () => {
    const page = readFileSync(join(ROOT, 'src', 'app', 'page.tsx'), 'utf8');
    expect(page).toMatch(/TailwindTest/);
  });
});

describe('AC4: Estructura de carpetas documentada en README', () => {
  const readme = readFileSync(join(ROOT, 'README.md'), 'utf8');

  it.each(['app', 'components', 'lib', 'domain', 'infrastructure'])(
    'README documents the %s folder',
    (folder) => {
      const pattern = new RegExp(`(?:\\bsrc\\/${folder}\\b|── ${folder}\\/)`);
      expect(readme).toMatch(pattern);
    },
  );

  it.each(['app', 'components', 'lib', 'domain', 'infrastructure'])(
    'src/%s/ directory exists on disk',
    (folder) => {
      expect(existsSync(join(ROOT, 'src', folder))).toBe(true);
    },
  );
});
