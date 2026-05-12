import { NextRequest } from 'next/server';

import { listMembersUseCase, registerMemberUseCase } from '@/infrastructure/container';
import {
  created,
  errorResponse,
  handleError,
  ok,
} from '@/interfaces/http/helpers/apiResponse';
import {
  createMemberSchema,
  listMembersQuerySchema,
} from '@/interfaces/http/validators/memberValidators';

/**
 * GET /api/members
 *
 * Returns a paginated list of registered members, optionally filtered by status.
 *
 * Query params:
 *   page   - 1-based page number (default: 1)
 *   limit  - items per page (default: 20, max: 100)
 *   status - ACTIVE | SUSPENDED | CLOSED (optional)
 */
export async function GET(request: NextRequest): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = listMembersQuerySchema.safeParse({
      page: searchParams.get('page') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
      status: searchParams.get('status') ?? undefined,
    });

    if (!parsed.success) {
      return errorResponse(parsed.error.errors.map((e) => e.message).join('; '), 422);
    }

    const result = await listMembersUseCase.execute(parsed.data);
    return ok(result);
  } catch (error) {
    return handleError(error);
  }
}

/**
 * POST /api/members
 *
 * Registers a new library member. Email uniqueness is enforced by the use case.
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
