import { NextRequest } from 'next/server';

import { listBooksUseCase, addBookUseCase, searchBooksUseCase } from '@/infrastructure/container';
import {
  created,
  errorResponse,
  handleError,
  ok,
} from '@/interfaces/http/helpers/apiResponse';
import { parsePaginationQuery, parseStringQuery } from '@/interfaces/http/helpers/parseQuery';
import { createBookSchema } from '@/interfaces/http/validators/bookValidators';

/**
 * GET /api/books
 *
 * Returns a paginated list of books, or search results when ?q= is provided.
 *
 * Query params:
 *   q     - search term (title or author)
 *   page  - 1-based page number (default: 1)
 *   limit - items per page (default: 20, max: 100)
 */
export async function GET(request: NextRequest): Promise<Response> {
  try {
    const searchQuery = parseStringQuery(request.url, 'q');

    if (searchQuery) {
      const books = await searchBooksUseCase.execute({ query: searchQuery });
      return ok(books);
    }

    const { page, limit } = parsePaginationQuery(request.url);
    const result = await listBooksUseCase.execute({ page, limit });
    return ok(result);
  } catch (error) {
    return handleError(error);
  }
}

/**
 * POST /api/books
 *
 * Adds a new book to the catalogue.
 *
 * Body: { isbn, title, author, publisher, publishedAt, totalCopies }
 */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body: unknown = await request.json();
    const parsed = createBookSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.errors.map((e) => e.message).join('; '), 422);
    }

    const book = await addBookUseCase.execute(parsed.data);
    return created(book);
  } catch (error) {
    return handleError(error);
  }
}
