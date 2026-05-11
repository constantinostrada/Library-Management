import { NextRequest } from 'next/server';

import { listMembersUseCase, registerMemberUseCase } from '@/infrastructure/container';
import {
  created,
  errorResponse,
  handleError,
  ok,
} from '@/interfaces/http/helpers/apiResponse';
import { parsePaginationQuery } from '@/interfaces/http/helpers/parseQuery';
import { createMemberSchema } from '@/interfaces/http/validators/memberValidators';

/**
 * GET /api/members
 *
 * Returns a paginated list of all registered members.
 *
 * Query params:
 *   page  - 1-based page number (default: 1)
 *   limit - items per page (default: 20, max: 100)
 */
export async function GET(request: NextRequest): Promise<Response> {
  try {
    const { page, limit } = parsePaginationQuery(request.url);
    const result = await listMembersUseCase.execute({ page, limit });
    return ok(result);
  } catch (error) {
    return handleError(error);
  }
}

/**
 * POST /api/members
 *
 * Registers a new library member.
 *
 * Body: { email, name }
 */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body: unknown = await request.json();
    const parsed = createMemberSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.errors.map((e) => e.message).join('; '), 422);
    }

    const member = await registerMemberUseCase.execute(parsed.data);
    return created(member);
  } catch (error) {
    return handleError(error);
  }
}
