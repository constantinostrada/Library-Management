import { NextRequest } from 'next/server';

import { getMemberLoansUseCase } from '@/infrastructure/container';
import { handleError, ok } from '@/interfaces/http/helpers/apiResponse';

type RouteContext = { params: { id: string } };

/**
 * GET /api/members/:id/loans
 *
 * Returns the full loan history (active + returned + overdue) for a member,
 * newest first. Responds with 404 MEMBER_NOT_FOUND if the member doesn't exist.
 */
export async function GET(_request: NextRequest, { params }: RouteContext): Promise<Response> {
  try {
    const history = await getMemberLoansUseCase.execute({ memberId: params.id });
    return ok(history);
  } catch (error) {
    return handleError(error);
  }
}
