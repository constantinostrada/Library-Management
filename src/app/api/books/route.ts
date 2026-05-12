import { NextRequest } from 'next/server';

import { addBookUseCase, listBooksUseCase } from '@/infrastructure/container';
import {
  created,
  errorResponse,
  handleError,
  ok,
} from '@/interfaces/http/helpers/apiResponse';
import {
  createBookSchema,
  listBooksQuerySchema,
} from '@/interfaces/http/validators/bookValidators';

/**
 * GET /api/books
 *
 * Returns a paginated list of books, with optional case-insensitive
 * substring filters for `title` and `author`.
 *
 * Query params:
 *   page   - 1-based page number (default: 1)
 *   limit  - items per page (default: 20, max: 100)
 *   title  - filter by title substring (optional)
 *   author - filter by author substring (optional)
 */
export async function GET(request: NextRequest): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = listBooksQuerySchema.safeParse({
      page: searchParams.get('page') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
      title: searchParams.get('title') ?? undefined,
      author: searchParams.get('author') ?? undefined,
    });

    if (!parsed.success) {
      return errorResponse(parsed.error.errors.map((e) => e.message).join('; '), 422);
    }

    const result = await listBooksUseCase.execute(parsed.data);
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
