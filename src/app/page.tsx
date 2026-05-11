import type { Metadata } from 'next';

import { TailwindTest } from '@/components/TailwindTest';

export const metadata: Metadata = {
  title: 'Dashboard',
};

/**
 * Home / Dashboard page.
 *
 * A static landing page that describes the system and provides quick links.
 * Server Component — no client-side JS needed.
 */
export default function HomePage(): JSX.Element {
  const features = [
    {
      icon: '📚',
      title: 'Catalogue',
      description: 'Manage your book inventory, track copies, and search by title or author.',
      href: '/books',
      linkText: 'Browse books →',
    },
    {
      icon: '👥',
      title: 'Members',
      description: 'Register library members and manage their account status.',
      href: '/members',
      linkText: 'View members →',
    },
    {
      icon: '🔖',
      title: 'Loans',
      description: 'Process borrows and returns, see what is currently on loan.',
      href: '/loans',
      linkText: 'View loans →',
    },
  ];

  return (
    <div className="space-y-10">
      {/* ── Tailwind smoke test component ─────────────────────────────────── */}
      <TailwindTest />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="text-center py-12">
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
          Welcome to <span className="text-brand-600">Library Management</span>
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-500">
          A production-ready library system built with{' '}
          <strong>Next.js · TypeScript · PostgreSQL · Prisma · Tailwind CSS</strong> following
          Clean Architecture principles.
        </p>
        <div className="mt-6 flex justify-center gap-4">
          <a href="/books" className="btn-primary">
            Browse Catalogue
          </a>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="btn-secondary"
          >
            View on GitHub
          </a>
        </div>
      </section>

      {/* ── Feature cards ────────────────────────────────────────────────── */}
      <section>
        <div className="grid gap-6 sm:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="card hover:shadow-md transition-shadow">
              <div className="text-4xl mb-3">{f.icon}</div>
              <h3 className="text-gray-900">{f.title}</h3>
              <p className="mt-2 text-sm text-gray-500">{f.description}</p>
              <a
                href={f.href}
                className="mt-4 inline-block text-sm font-medium text-brand-600 hover:text-brand-800"
              >
                {f.linkText}
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* ── API reference quick-links ─────────────────────────────────────── */}
      <section className="card">
        <h2 className="text-gray-900 mb-4">REST API Endpoints</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500">
                <th className="pb-2 pr-8 font-medium">Method</th>
                <th className="pb-2 pr-8 font-medium">Path</th>
                <th className="pb-2 font-medium">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                ['GET', '/api/books', 'List books (supports ?q= search)'],
                ['POST', '/api/books', 'Add a book to the catalogue'],
                ['GET', '/api/books/:id', 'Get a book by ID'],
                ['GET', '/api/members', 'List members'],
                ['POST', '/api/members', 'Register a new member'],
                ['GET', '/api/members/:id', 'Get a member by ID'],
                ['GET', '/api/loans', 'List all loans'],
                ['POST', '/api/loans', 'Borrow a book'],
                ['POST', '/api/loans/return', 'Return a book'],
              ].map(([method, path, desc]) => (
                <tr key={path + method} className="text-gray-700">
                  <td className="py-2 pr-8">
                    <span
                      className={`badge font-mono ${
                        method === 'GET' ? 'badge-green' : 'badge-yellow'
                      }`}
                    >
                      {method}
                    </span>
                  </td>
                  <td className="py-2 pr-8 font-mono text-xs text-gray-900">{path}</td>
                  <td className="py-2 text-gray-500">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
