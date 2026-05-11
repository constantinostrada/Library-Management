import { NextRequest } from 'next/server';

import { getMemberUseCase } from '@/infrastructure/container';
import { handleError, ok } from '@/interfaces/http/helpers/apiResponse';

type RouteContext = { params: { id: string } };

/**
 * GET /api/members/:id
 *
 * Returns a single member by surrogate ID.
 */
export async function GET(_request: NextRequest, { params }: RouteContext): Promise<Response> {
  try {
    const member = await getMemberUseCase.execute({ id: params.id });
    return ok(member);
  } catch (error) {
    return handleError(error);
  }
}
