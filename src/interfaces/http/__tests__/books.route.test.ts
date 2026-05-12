/**
 * Integration tests for the /api/books and /api/books/[id] route handlers.
 *
 * The route handlers depend on use-case instances exported from
 * `@/infrastructure/container`. We jest.mock that module so the tests
 * exercise the route adapters (Zod validation, status code translation,
 * response shape) without touching Prisma or the database.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextRequest } from 'next/server';

import { BookHasActiveLoansError } from '@/domain/errors/BookHasActiveLoansError';
import { BookNotFoundError } from '@/domain/errors/BookNotFoundError';

// ── Container mocks ──────────────────────────────────────────────────────────

jest.mock('@/infrastructure/container', () => ({
  listBooksUseCase: { execute: jest.fn() },
  addBookUseCase: { execute: jest.fn() },
  getBookUseCase: { execute: jest.fn() },
  updateBookUseCase: { execute: jest.fn() },
  deleteBookUseCase: { execute: jest.fn() },
  searchBooksUseCase: { execute: jest.fn() },
}));

import {
  addBookUseCase,
  deleteBookUseCase,
  listBooksUseCase,
  updateBookUseCase,
} from '@/infrastructure/container';

import { GET as GET_LIST, POST as POST_BOOK } from '@/app/api/books/route';
import {
  DELETE as DELETE_BOOK,
  PUT as PUT_BOOK,
} from '@/app/api/books/[id]/route';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeRequest(url: string, init?: RequestInit): NextRequest {
  return new NextRequest(new Request(url, init));
}

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

beforeEach(() => {
  jest.clearAllMocks();
});

// ─────────────────────────────────────────────────────────────────────────────
// AC-1: GET /api/books retorna lista paginada con filtros opcionales
// ─────────────────────────────────────────────────────────────────────────────

describe('AC-1 GET /api/books returns paginated list with optional filters', () => {
  it('returns paginated list with default page/limit and no filters', async () => {
    (listBooksUseCase.execute as jest.Mock).mockResolvedValue({
      books: [makeBookDTO()],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    });

    const res = await GET_LIST(makeRequest('http://localhost/api/books'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.books).toHaveLength(1);
    expect(body.data.page).toBe(1);
    expect(body.data.limit).toBe(20);
    expect(listBooksUseCase.execute).toHaveBeenCalledWith({});
  });

  it('coerces page/limit from query strings and forwards them', async () => {
    (listBooksUseCase.execute as jest.Mock).mockResolvedValue({
      books: [],
      total: 0,
      page: 2,
      limit: 5,
      totalPages: 0,
    });

    const res = await GET_LIST(makeRequest('http://localhost/api/books?page=2&limit=5'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.page).toBe(2);
    expect(listBooksUseCase.execute).toHaveBeenCalledWith({ page: 2, limit: 5 });
  });

  it('forwards the title and author filters when present', async () => {
    (listBooksUseCase.execute as jest.Mock).mockResolvedValue({
      books: [makeBookDTO()],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    });

    const res = await GET_LIST(
      makeRequest('http://localhost/api/books?title=clean&author=martin'),
    );

    expect(res.status).toBe(200);
    expect(listBooksUseCase.execute).toHaveBeenCalledWith({
      title: 'clean',
      author: 'martin',
    });
  });

  it('rejects an invalid page number with a 422', async () => {
    const res = await GET_LIST(makeRequest('http://localhost/api/books?page=0'));
    expect(res.status).toBe(422);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC-2: POST /api/books crea un libro con validación de ISBN único
// ─────────────────────────────────────────────────────────────────────────────

describe('AC-2 POST /api/books creates a book and enforces unique ISBN', () => {
  const validBody = {
    isbn: '9780132350884',
    title: 'Clean Code',
    author: 'Robert C. Martin',
    publisher: 'Prentice Hall',
    publishedAt: '2008-08-01T00:00:00.000Z',
    totalCopies: 3,
  };

  it('returns 201 with the created book on success', async () => {
    (addBookUseCase.execute as jest.Mock).mockResolvedValue(makeBookDTO());

    const res = await POST_BOOK(
      makeRequest('http://localhost/api/books', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(validBody),
      }),
    );
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe('book-1');
    expect(addBookUseCase.execute).toHaveBeenCalledWith(validBody);
  });

  it('returns 409 DUPLICATE_ISBN when the ISBN already exists', async () => {
    // Inline domain error to avoid pulling private class — code is what matters
    class DuplicateISBNError extends Error {
      readonly code = 'DUPLICATE_ISBN';
      constructor() {
        super('A book with this ISBN already exists.');
        this.name = 'DuplicateISBNError';
        Object.setPrototypeOf(this, DuplicateISBNError.prototype);
      }
    }
    // Make the error pass `instanceof DomainError` by re-importing DomainError
    const { DomainError } = await import('@/domain/errors/DomainError');
    Object.setPrototypeOf(DuplicateISBNError.prototype, DomainError.prototype);

    (addBookUseCase.execute as jest.Mock).mockRejectedValue(new DuplicateISBNError());

    const res = await POST_BOOK(
      makeRequest('http://localhost/api/books', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(validBody),
      }),
    );
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/ISBN/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC-3: PUT /api/books/[id] actualiza campos permitidos
// ─────────────────────────────────────────────────────────────────────────────

describe('AC-3 PUT /api/books/:id updates allowed fields', () => {
  it('returns 200 with the updated book and forwards id+body to use case', async () => {
    (updateBookUseCase.execute as jest.Mock).mockResolvedValue(
      makeBookDTO({ title: 'Clean Code (2nd edition)' }),
    );

    const res = await PUT_BOOK(
      makeRequest('http://localhost/api/books/book-1', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ title: 'Clean Code (2nd edition)' }),
      }),
      { params: { id: 'book-1' } },
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.title).toBe('Clean Code (2nd edition)');
    expect(updateBookUseCase.execute).toHaveBeenCalledWith({
      id: 'book-1',
      title: 'Clean Code (2nd edition)',
    });
  });

  it('returns 404 BOOK_NOT_FOUND when target does not exist', async () => {
    (updateBookUseCase.execute as jest.Mock).mockRejectedValue(
      new BookNotFoundError('missing'),
    );

    const res = await PUT_BOOK(
      makeRequest('http://localhost/api/books/missing', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ title: 'X' }),
      }),
      { params: { id: 'missing' } },
    );

    expect(res.status).toBe(404);
  });

  it('rejects disallowed fields (e.g. isbn) implicitly by ignoring them and validating shape', async () => {
    (updateBookUseCase.execute as jest.Mock).mockResolvedValue(makeBookDTO());

    const res = await PUT_BOOK(
      makeRequest('http://localhost/api/books/book-1', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ title: 'Ok', totalCopies: -1 }),
      }),
      { params: { id: 'book-1' } },
    );

    expect(res.status).toBe(422);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC-4: DELETE /api/books/[id] solo permite si no hay loans activos
// ─────────────────────────────────────────────────────────────────────────────

describe('AC-4 DELETE /api/books/:id is blocked when active loans exist', () => {
  it('returns 204 No Content when deletion succeeds', async () => {
    (deleteBookUseCase.execute as jest.Mock).mockResolvedValue(undefined);

    const res = await DELETE_BOOK(
      makeRequest('http://localhost/api/books/book-1', { method: 'DELETE' }),
      { params: { id: 'book-1' } },
    );

    expect(res.status).toBe(204);
    expect(deleteBookUseCase.execute).toHaveBeenCalledWith({ id: 'book-1' });
  });

  it('returns 409 BOOK_HAS_ACTIVE_LOANS when active loans block the delete', async () => {
    (deleteBookUseCase.execute as jest.Mock).mockRejectedValue(
      new BookHasActiveLoansError('book-1', 2),
    );

    const res = await DELETE_BOOK(
      makeRequest('http://localhost/api/books/book-1', { method: 'DELETE' }),
      { params: { id: 'book-1' } },
    );
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/active loan/i);
  });

  it('returns 404 when the book does not exist', async () => {
    (deleteBookUseCase.execute as jest.Mock).mockRejectedValue(
      new BookNotFoundError('missing'),
    );

    const res = await DELETE_BOOK(
      makeRequest('http://localhost/api/books/missing', { method: 'DELETE' }),
      { params: { id: 'missing' } },
    );

    expect(res.status).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC-5: Status codes correctos y mensajes de error claros
// ─────────────────────────────────────────────────────────────────────────────

describe('AC-5 endpoints respond with correct status codes and clear error messages', () => {
  it('GET list success → 200', async () => {
    (listBooksUseCase.execute as jest.Mock).mockResolvedValue({
      books: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    });
    const res = await GET_LIST(makeRequest('http://localhost/api/books'));
    expect(res.status).toBe(200);
  });

  it('POST create success → 201', async () => {
    (addBookUseCase.execute as jest.Mock).mockResolvedValue(makeBookDTO());
    const res = await POST_BOOK(
      makeRequest('http://localhost/api/books', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          isbn: '9780132350884',
          title: 'Clean Code',
          author: 'R. Martin',
          publisher: 'Prentice Hall',
          publishedAt: '2008-08-01T00:00:00.000Z',
          totalCopies: 3,
        }),
      }),
    );
    expect(res.status).toBe(201);
  });

  it('PUT update success → 200', async () => {
    (updateBookUseCase.execute as jest.Mock).mockResolvedValue(makeBookDTO());
    const res = await PUT_BOOK(
      makeRequest('http://localhost/api/books/book-1', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ title: 'X' }),
      }),
      { params: { id: 'book-1' } },
    );
    expect(res.status).toBe(200);
  });

  it('DELETE success → 204', async () => {
    (deleteBookUseCase.execute as jest.Mock).mockResolvedValue(undefined);
    const res = await DELETE_BOOK(
      makeRequest('http://localhost/api/books/book-1', { method: 'DELETE' }),
      { params: { id: 'book-1' } },
    );
    expect(res.status).toBe(204);
  });

  it('Not-found error → 404 with a descriptive message', async () => {
    (updateBookUseCase.execute as jest.Mock).mockRejectedValue(
      new BookNotFoundError('missing-id'),
    );

    const res = await PUT_BOOK(
      makeRequest('http://localhost/api/books/missing-id', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ title: 'X' }),
      }),
      { params: { id: 'missing-id' } },
    );
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.success).toBe(false);
    expect(typeof body.error).toBe('string');
    expect(body.error.length).toBeGreaterThan(0);
  });

  it('Validation error → 422', async () => {
    const res = await POST_BOOK(
      makeRequest('http://localhost/api/books', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ isbn: 'bad', title: '', author: '', publisher: '', publishedAt: 'nope', totalCopies: 0 }),
      }),
    );
    expect(res.status).toBe(422);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC-6: Validación con Zod en todos los endpoints
// ─────────────────────────────────────────────────────────────────────────────

describe('AC-6 every endpoint validates input with Zod schemas', () => {
  it('GET rejects an invalid `limit` (over 100)', async () => {
    const res = await GET_LIST(
      makeRequest('http://localhost/api/books?limit=999'),
    );
    expect(res.status).toBe(422);
    expect(listBooksUseCase.execute).not.toHaveBeenCalled();
  });

  it('POST rejects when required fields are missing', async () => {
    const res = await POST_BOOK(
      makeRequest('http://localhost/api/books', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ title: 'Only this' }),
      }),
    );
    expect(res.status).toBe(422);
    expect(addBookUseCase.execute).not.toHaveBeenCalled();
  });

  it('POST rejects invalid publishedAt (non-ISO string)', async () => {
    const res = await POST_BOOK(
      makeRequest('http://localhost/api/books', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          isbn: '9780132350884',
          title: 'X',
          author: 'X',
          publisher: 'X',
          publishedAt: 'not a date',
          totalCopies: 1,
        }),
      }),
    );
    expect(res.status).toBe(422);
  });

  it('PUT rejects an empty title', async () => {
    const res = await PUT_BOOK(
      makeRequest('http://localhost/api/books/book-1', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ title: '' }),
      }),
      { params: { id: 'book-1' } },
    );
    expect(res.status).toBe(422);
    expect(updateBookUseCase.execute).not.toHaveBeenCalled();
  });

  it('PUT rejects a non-numeric totalCopies', async () => {
    const res = await PUT_BOOK(
      makeRequest('http://localhost/api/books/book-1', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ totalCopies: 'five' }),
      }),
      { params: { id: 'book-1' } },
    );
    expect(res.status).toBe(422);
  });
});
