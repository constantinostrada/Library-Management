import { NextRequest } from 'next/server';

import {
  deleteBookUseCase,
  getBookUseCase,
  updateBookUseCase,
} from '@/infrastructure/container';
import {
  errorResponse,
  handleError,
  noContent,
  ok,
} from '@/interfaces/http/helpers/apiResponse';
import { updateBookSchema } from '@/interfaces/http/validators/bookValidators';

type RouteContext = { params: { id: string } };

/**
 * GET /api/books/:id
 *
 * Returns a single book by surrogate ID.
 */
export async function GET(_request: NextRequest, { params }: RouteContext): Promise<Response> {
  try {
    const book = await getBookUseCase.execute({ id: params.id });
    return ok(book);
  } catch (error) {
    return handleError(error);
  }
}

/**
 * PUT /api/books/:id
 *
 * Updates the mutable fields of a book (title, author, publisher, totalCopies).
 * ISBN and publishedAt are immutable post-creation by design.
 *
 * Body: { title?, author?, publisher?, totalCopies? }
 */
export async function PUT(request: NextRequest, { params }: RouteContext): Promise<Response> {
  try {
    const body: unknown = await request.json();
    const parsed = updateBookSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.errors.map((e) => e.message).join('; '), 422);
    }

    const book = await updateBookUseCase.execute({ id: params.id, ...parsed.data });
    return ok(book);
  } catch (error) {
    return handleError(error);
  }
}

/**
 * DELETE /api/books/:id
 *
 * Removes a book from the catalogue.
 * Fails with 409 BOOK_HAS_ACTIVE_LOANS if any active loan still references it.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: RouteContext,
): Promise<Response> {
  try {
    await deleteBookUseCase.execute({ id: params.id });
    return noContent();
  } catch (error) {
    return handleError(error);
  }
}
