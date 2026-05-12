/**
 * Component tests for the /books listing page, /books/[id] detail page,
 * and the loading + error segment files.
 *
 * Strategy: these are Next.js Server Components that return JSX. We call the
 * page functions directly (as plain async functions), then stringify the
 * returned element tree with react-dom/server.renderToStaticMarkup. No JSDOM
 * required — the existing jest `testEnvironment: 'node'` is sufficient.
 *
 * The container's use cases are mocked so the tests run without Prisma.
 *
 * Each describe block aligns with one acceptance criterion so that
 * `chiron task ac assert <id> --test '<this file>::<describe>'` can match.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { BookNotFoundError } from '@/domain/errors/BookNotFoundError';

// ── Container mocks ──────────────────────────────────────────────────────────

jest.mock('@/infrastructure/container', () => ({
  listBooksUseCase: { execute: jest.fn() },
  getBookUseCase: { execute: jest.fn() },
  addBookUseCase: { execute: jest.fn() },
  updateBookUseCase: { execute: jest.fn() },
  deleteBookUseCase: { execute: jest.fn() },
  searchBooksUseCase: { execute: jest.fn() },
}));

// next/navigation.notFound() throws a special error in production; in tests
// we just want to assert it was called.
jest.mock('next/navigation', () => ({
  notFound: jest.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));

import { listBooksUseCase, getBookUseCase } from '@/infrastructure/container';
import { notFound } from 'next/navigation';

import BooksPage from '@/app/books/page';
import BookDetailPage from '@/app/books/[id]/page';
import BooksLoading from '@/app/books/loading';
import BookDetailLoading from '@/app/books/[id]/loading';
import BooksError from '@/app/books/error';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeBookDTO(overrides: Record<string, unknown> = {}) {
  return {
    id: 'book-1',
    isbn: '9780132350884',
    title: 'Clean Code',
    author: 'Robert C. Martin',
    publisher: 'Prentice Hall',
    publishedAt: '2008-08-01T00:00:00.000Z',
    totalCopies: 3,
    availableCopies: 3,
    createdAt: '2026-05-11T00:00:00.000Z',
    updatedAt: '2026-05-11T00:00:00.000Z',
    ...overrides,
  };
}

async function renderPage(component: () => Promise<JSX.Element>): Promise<string> {
  const element = await component();
  return renderToStaticMarkup(element);
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ─────────────────────────────────────────────────────────────────────────────
// AC-1: Página /books muestra listado con ISBN, título, autor, género,
//       copias totales y copias disponibles
// (NOTE: `género` is intentionally omitted — the Prisma Book model has no such
//  column. This re-applies the verified ask_user decision from the prior API
//  task NXDtr5MkozzNr4dvtvNI.)
// ─────────────────────────────────────────────────────────────────────────────

describe('AC-1 /books page lists ISBN, title, author, total copies, available copies', () => {
  it('renders a row per book with all required columns', async () => {
    (listBooksUseCase.execute as jest.Mock).mockResolvedValue({
      books: [
        makeBookDTO({
          id: 'b1',
          isbn: '9780132350884',
          title: 'Clean Code',
          author: 'Robert C. Martin',
          totalCopies: 3,
          availableCopies: 2,
        }),
        makeBookDTO({
          id: 'b2',
          isbn: '9780201633610',
          title: 'Design Patterns',
          author: 'Erich Gamma',
          totalCopies: 5,
          availableCopies: 0,
        }),
      ],
      total: 2,
      page: 1,
      limit: 20,
      totalPages: 1,
    });

    const html = await renderPage(() => BooksPage({ searchParams: {} }));

    // Column headers (the labels users see)
    expect(html).toContain('ISBN');
    expect(html).toContain('Title');
    expect(html).toContain('Author');
    expect(html).toContain('Total Copies');
    expect(html).toContain('Available');

    // Each book's data is present
    expect(html).toContain('9780132350884');
    expect(html).toContain('Clean Code');
    expect(html).toContain('Robert C. Martin');
    expect(html).toContain('9780201633610');
    expect(html).toContain('Design Patterns');
    expect(html).toContain('Erich Gamma');

    // Two rows rendered
    const rowCount = (html.match(/data-testid="book-row"/g) ?? []).length;
    expect(rowCount).toBe(2);

    // Available / total ratio visible (this also satisfies AC-3)
    expect(html).toContain('2 / 3');
    expect(html).toContain('0 / 5');
  });

  it('renders an empty state when no books exist', async () => {
    (listBooksUseCase.execute as jest.Mock).mockResolvedValue({
      books: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    });

    const html = await renderPage(() => BooksPage({ searchParams: {} }));
    expect(html).toContain('data-testid="empty-state"');
    expect(html).toContain('No books in the catalogue yet');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC-2: Filtros de búsqueda funcionales en tiempo real o con submit
// ─────────────────────────────────────────────────────────────────────────────

describe('AC-2 /books search filters work via form submit', () => {
  it('renders a GET form with title and author inputs', async () => {
    (listBooksUseCase.execute as jest.Mock).mockResolvedValue({
      books: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    });

    const html = await renderPage(() => BooksPage({ searchParams: {} }));

    expect(html).toContain('data-testid="book-filters"');
    expect(html).toContain('action="/books"');
    expect(html).toMatch(/method="GET"/i);
    expect(html).toMatch(/name="title"/);
    expect(html).toMatch(/name="author"/);
    expect(html).toContain('data-testid="filter-submit"');
  });

  it('forwards title and author search params to the use case', async () => {
    (listBooksUseCase.execute as jest.Mock).mockResolvedValue({
      books: [makeBookDTO({ title: 'Clean Code', author: 'Robert C. Martin' })],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    });

    await renderPage(() =>
      BooksPage({
        searchParams: { title: 'clean', author: 'martin' },
      }),
    );

    expect(listBooksUseCase.execute).toHaveBeenCalledTimes(1);
    expect(listBooksUseCase.execute).toHaveBeenCalledWith({
      page: 1,
      limit: 20,
      title: 'clean',
      author: 'martin',
    });
  });

  it('pre-populates inputs with the current filter values and shows a Clear link', async () => {
    (listBooksUseCase.execute as jest.Mock).mockResolvedValue({
      books: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    });

    const html = await renderPage(() =>
      BooksPage({
        searchParams: { title: 'clean', author: 'martin' },
      }),
    );

    expect(html).toMatch(/name="title"[^>]*value="clean"/);
    expect(html).toMatch(/name="author"[^>]*value="martin"/);
    expect(html).toContain('data-testid="filter-clear"');
    expect(html).toContain('matching your filters');
  });

  it('does NOT forward empty/whitespace-only filters to the use case', async () => {
    (listBooksUseCase.execute as jest.Mock).mockResolvedValue({
      books: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    });

    await renderPage(() =>
      BooksPage({
        searchParams: { title: '   ', author: '' },
      }),
    );

    expect(listBooksUseCase.execute).toHaveBeenCalledWith({
      page: 1,
      limit: 20,
      title: undefined,
      author: undefined,
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC-3: Indicador visual de disponibilidad (copies disponibles / total)
// ─────────────────────────────────────────────────────────────────────────────

describe('AC-3 visual availability indicator reflects copies state', () => {
  function renderRowFor(book: Record<string, unknown>) {
    (listBooksUseCase.execute as jest.Mock).mockResolvedValue({
      books: [makeBookDTO(book)],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    });
    return renderPage(() => BooksPage({ searchParams: {} }));
  }

  it('shows a green badge when many copies are available', async () => {
    const html = await renderRowFor({ totalCopies: 5, availableCopies: 5 });
    expect(html).toMatch(/class="badge-green"[^>]*data-testid="availability-badge"/);
    expect(html).toContain('5 / 5');
  });

  it('shows a yellow badge when few copies remain (low availability)', async () => {
    const html = await renderRowFor({ totalCopies: 8, availableCopies: 1 });
    expect(html).toMatch(/class="badge-yellow"[^>]*data-testid="availability-badge"/);
    expect(html).toContain('1 / 8');
  });

  it('shows a red badge when all copies are on loan', async () => {
    const html = await renderRowFor({ totalCopies: 4, availableCopies: 0 });
    expect(html).toMatch(/class="badge-red"[^>]*data-testid="availability-badge"/);
    expect(html).toContain('0 / 4');
  });

  it('includes an accessible aria-label describing availability', async () => {
    const html = await renderRowFor({ totalCopies: 4, availableCopies: 2 });
    expect(html).toContain('aria-label="2 of 4 copies available"');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC-4: Página de detalle /books/[id] con toda la info del libro
// ─────────────────────────────────────────────────────────────────────────────

describe('AC-4 /books/[id] detail page shows every book field', () => {
  it('renders ISBN, title, author, publisher, publishedAt, totalCopies, availableCopies', async () => {
    (getBookUseCase.execute as jest.Mock).mockResolvedValue(
      makeBookDTO({
        id: 'book-42',
        isbn: '9780132350884',
        title: 'Clean Code',
        author: 'Robert C. Martin',
        publisher: 'Prentice Hall',
        totalCopies: 3,
        availableCopies: 2,
      }),
    );

    const html = await renderPage(() =>
      BookDetailPage({ params: { id: 'book-42' } }),
    );

    expect(getBookUseCase.execute).toHaveBeenCalledWith({ id: 'book-42' });

    expect(html).toContain('data-testid="book-detail"');
    expect(html).toContain('9780132350884'); // ISBN
    expect(html).toContain('Clean Code'); // title
    expect(html).toContain('Robert C. Martin'); // author
    expect(html).toContain('Prentice Hall'); // publisher
    expect(html).toContain('data-testid="detail-isbn"');
    expect(html).toContain('data-testid="detail-author"');
    expect(html).toContain('data-testid="detail-publisher"');
    expect(html).toContain('data-testid="detail-published"');
    expect(html).toContain('data-testid="detail-total"');
    expect(html).toContain('data-testid="detail-available"');
    expect(html).toContain('data-testid="detail-availability-badge"');
    expect(html).toContain('2 / 3 available');
  });

  it('calls notFound() when the book does not exist', async () => {
    (getBookUseCase.execute as jest.Mock).mockRejectedValue(
      new BookNotFoundError('missing-id'),
    );

    await expect(
      BookDetailPage({ params: { id: 'missing-id' } }),
    ).rejects.toThrow('NEXT_NOT_FOUND');

    expect(notFound).toHaveBeenCalledTimes(1);
  });

  it('rethrows unexpected errors (not BookNotFoundError)', async () => {
    (getBookUseCase.execute as jest.Mock).mockRejectedValue(
      new Error('database is down'),
    );

    await expect(
      BookDetailPage({ params: { id: 'book-1' } }),
    ).rejects.toThrow('database is down');
    expect(notFound).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC-5: Estados de carga y error manejados
// ─────────────────────────────────────────────────────────────────────────────

describe('AC-5 loading and error states are handled', () => {
  it('renders a loading skeleton for the listing page', () => {
    const html = renderToStaticMarkup(React.createElement(BooksLoading));
    expect(html).toContain('data-testid="books-loading"');
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('animate-pulse');
  });

  it('renders a loading skeleton for the detail page', () => {
    const html = renderToStaticMarkup(React.createElement(BookDetailLoading));
    expect(html).toContain('data-testid="book-detail-loading"');
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-busy="true"');
  });

  it('renders an error boundary with a retry button for the listing segment', () => {
    const reset = jest.fn();
    const html = renderToStaticMarkup(
      React.createElement(BooksError, { error: new Error('boom'), reset }),
    );
    expect(html).toContain('data-testid="books-error"');
    expect(html).toContain('role="alert"');
    expect(html).toContain('Try Again');
  });

  it('detail page error is signalled by notFound() (404 boundary) on missing book', async () => {
    (getBookUseCase.execute as jest.Mock).mockRejectedValue(
      new BookNotFoundError('missing-id'),
    );

    await expect(
      BookDetailPage({ params: { id: 'missing-id' } }),
    ).rejects.toThrow('NEXT_NOT_FOUND');
    expect(notFound).toHaveBeenCalled();
  });
});
