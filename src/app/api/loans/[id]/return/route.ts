import { NextRequest } from 'next/server';
import { z } from 'zod';

import { returnBookUseCase } from '@/infrastructure/container';
import {
  errorResponse,
  handleError,
  ok,
} from '@/interfaces/http/helpers/apiResponse';

const idParamSchema = z.string().uuid();

/**
 * PUT /api/loans/[id]/return
 *
 * Marks the loan identified by the URL path segment as returned.
 * Sets `returnedAt` to now and transitions status to RETURNED.
 *
 * Errors:
 *   404 LOAN_NOT_FOUND       - id does not match any loan
 *   409 LOAN_ALREADY_RETURNED - loan was already returned
 *   422                       - id is not a valid UUID
 */
export async function PUT(
  _request: NextRequest,
  context: { params: { id: string } },
): Promise<Response> {
  try {
    const parsed = idParamSchema.safeParse(context.params.id);
    if (!parsed.success) {
      return errorResponse('Loan id must be a valid UUID.', 422);
    }

    const loan = await returnBookUseCase.execute({ loanId: parsed.data });
    return ok(loan);
  } catch (error) {
    return handleError(error);
  }
}
