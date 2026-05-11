import { NextRequest } from 'next/server';

import { borrowBookUseCase, listLoansUseCase } from '@/infrastructure/container';
import {
  created,
  errorResponse,
  handleError,
  ok,
} from '@/interfaces/http/helpers/apiResponse';
import { parsePaginationQuery } from '@/interfaces/http/helpers/parseQuery';
import { borrowBookSchema } from '@/interfaces/http/validators/loanValidators';

/**
 * GET /api/loans
 *
 * Returns a paginated list of all loans.
 *
 * Query params:
 *   page  - 1-based page number (default: 1)
 *   limit - items per page (default: 20, max: 100)
 */
export async function GET(request: NextRequest): Promise<Response> {
  try {
    const { page, limit } = parsePaginationQuery(request.url);
    const result = await listLoansUseCase.execute({ page, limit });
    return ok(result);
  } catch (error) {
    return handleError(error);
  }
}

/**
 * POST /api/loans
 *
 * Creates a new loan (a member borrows a book).
 *
 * Body: { bookId, memberId, loanDurationDays? }
 */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body: unknown = await request.json();
    const parsed = borrowBookSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.errors.map((e) => e.message).join('; '), 422);
    }

    const loan = await borrowBookUseCase.execute(parsed.data);
    return created(loan);
  } catch (error) {
    return handleError(error);
  }
}
