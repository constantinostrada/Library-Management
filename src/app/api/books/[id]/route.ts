import { NextRequest } from 'next/server';

import { getBookUseCase } from '@/infrastructure/container';
import { handleError, ok } from '@/interfaces/http/helpers/apiResponse';

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
