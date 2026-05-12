import { NextRequest } from 'next/server';

import { borrowBookUseCase, listLoansUseCase } from '@/infrastructure/container';
import {
  created,
  errorResponse,
  handleError,
  ok,
} from '@/interfaces/http/helpers/apiResponse';
import {
  borrowBookSchema,
  listLoansQuerySchema,
} from '@/interfaces/http/validators/loanValidators';

/**
 * GET /api/loans
 *
 * Returns a paginated list of loans with optional filters.
 * Each loan exposes `isOverdue` computed against the current date.
 *
 * Query params:
 *   page     - 1-based page number (default: 1)
 *   limit    - items per page (default: 20, max: 100)
 *   status   - logical filter: active | returned | overdue (case-insensitive)
 *   memberId - filter by member UUID
 */
export async function GET(request: NextRequest): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = listLoansQuerySchema.safeParse({
      page: searchParams.get('page') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      memberId: searchParams.get('memberId') ?? undefined,
    });

    if (!parsed.success) {
      return errorResponse(parsed.error.errors.map((e) => e.message).join('; '), 422);
    }

    const result = await listLoansUseCase.execute(parsed.data);
    return ok(result);
  } catch (error) {
    return handleError(error);
  }
}

/**
 * POST /api/loans
 *
 * Creates a new loan (a member borrows a book). Business rules
 * (eligibility, copy availability, borrow limit, member status) are
 * enforced by the use case and surfaced as descriptive HTTP errors via
 * the shared `handleError` mapper.
 *
 * Body: { bookId, memberId, loanDurationDays? }
 * The optional `loanDurationDays` defaults to 14 (LoanDuration.default()).
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
