import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Library Management',
    template: '%s | Library Management',
  },
  description:
    'A modern library management system — track books, members, and loans with ease.',
};

/**
 * Root layout.
 *
 * Wraps every page in a consistent shell: navigation header + main content area.
 * This component lives in the interfaces layer — it contains NO business logic.
 */
export default function RootLayout({ children }: { children: ReactNode }): JSX.Element {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex flex-col">
          {/* ── Navigation ─────────────────────────────────────────────────── */}
          <header className="border-b border-gray-200 bg-white shadow-sm">
            <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex h-16 items-center justify-between">
                <a href="/" className="flex items-center gap-2 text-brand-700 font-bold text-xl">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-7 w-7"
                  >
                    <path d="M11.25 4.533A9.707 9.707 0 006 3a9.735 9.735 0 00-3.25.555.75.75 0 00-.5.707v14.25a.75.75 0 001 .707A8.237 8.237 0 016 18.75c1.995 0 3.823.707 5.25 1.886V4.533zM12.75 20.636A8.214 8.214 0 0118 18.75c.966 0 1.89.166 2.75.47a.75.75 0 001-.708V4.262a.75.75 0 00-.5-.707A9.735 9.735 0 0018 3a9.707 9.707 0 00-5.25 1.533v16.103z" />
                  </svg>
                  Library Management
                </a>

                <div className="flex items-center gap-6 text-sm font-medium text-gray-600">
                  <a href="/books" className="hover:text-brand-700 transition-colors">
                    Books
                  </a>
                  <a href="/members" className="hover:text-brand-700 transition-colors">
                    Members
                  </a>
                  <a href="/loans" className="hover:text-brand-700 transition-colors">
                    Loans
                  </a>
                </div>
              </div>
            </nav>
          </header>

          {/* ── Main content ────────────────────────────────────────────────── */}
          <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            {children}
          </main>

          {/* ── Footer ──────────────────────────────────────────────────────── */}
          <footer className="border-t border-gray-200 bg-white py-4 text-center text-sm text-gray-500">
            Library Management &copy; {new Date().getFullYear()} — Built with Clean Architecture
          </footer>
        </div>
      </body>
    </html>
  );
}
