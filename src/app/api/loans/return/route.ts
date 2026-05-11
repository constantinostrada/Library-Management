import { NextRequest } from 'next/server';

import { returnBookUseCase } from '@/infrastructure/container';
import { errorResponse, handleError, ok } from '@/interfaces/http/helpers/apiResponse';
import { returnBookSchema } from '@/interfaces/http/validators/loanValidators';

/**
 * POST /api/loans/return
 *
 * Processes a book return.
 *
 * Body: { loanId }
 */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body: unknown = await request.json();
    const parsed = returnBookSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.errors.map((e) => e.message).join('; '), 422);
    }

    const loan = await returnBookUseCase.execute(parsed.data);
    return ok(loan);
  } catch (error) {
    return handleError(error);
  }
}
