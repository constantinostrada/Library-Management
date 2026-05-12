import { NextRequest } from 'next/server';

import { getMemberUseCase, updateMemberUseCase } from '@/infrastructure/container';
import {
  errorResponse,
  handleError,
  ok,
} from '@/interfaces/http/helpers/apiResponse';
import { updateMemberSchema } from '@/interfaces/http/validators/memberValidators';

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

/**
 * PUT /api/members/:id
 *
 * Updates the mutable fields of a member (name, email, status).
 *
 * Body: { name?, email?, status? }
 */
export async function PUT(request: NextRequest, { params }: RouteContext): Promise<Response> {
  try {
    const body: unknown = await request.json();
    const parsed = updateMemberSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.errors.map((e) => e.message).join('; '), 422);
    }

    const member = await updateMemberUseCase.execute({ id: params.id, ...parsed.data });
    return ok(member);
  } catch (error) {
    return handleError(error);
  }
}
