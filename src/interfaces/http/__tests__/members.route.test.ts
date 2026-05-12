/**
 * Integration tests for /api/members and nested route handlers.
 *
 * We jest.mock `@/infrastructure/container` so the tests exercise the route
 * adapters (Zod validation, status-code translation, response shape) without
 * touching Prisma or the database.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextRequest } from 'next/server';

import { DomainError } from '@/domain/errors/DomainError';
import { MemberNotFoundError } from '@/domain/errors/MemberNotFoundError';

// ── Container mocks ──────────────────────────────────────────────────────────

jest.mock('@/infrastructure/container', () => ({
  listMembersUseCase: { execute: jest.fn() },
  registerMemberUseCase: { execute: jest.fn() },
  getMemberUseCase: { execute: jest.fn() },
  updateMemberUseCase: { execute: jest.fn() },
  getMemberLoansUseCase: { execute: jest.fn() },
}));

import {
  getMemberLoansUseCase,
  listMembersUseCase,
  registerMemberUseCase,
  updateMemberUseCase,
} from '@/infrastructure/container';

import {
  GET as GET_LIST,
  POST as POST_MEMBER,
} from '@/app/api/members/route';
import { PUT as PUT_MEMBER } from '@/app/api/members/[id]/route';
import { GET as GET_LOANS } from '@/app/api/members/[id]/loans/route';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeRequest(url: string, init?: RequestInit): NextRequest {
  return new NextRequest(new Request(url, init));
}

function makeMemberDTO(overrides: Record<string, unknown> = {}) {
  return {
    id: 'member-1',
    email: 'jane@example.com',
    name: 'Jane Doe',
    status: 'ACTIVE',
    createdAt: '2026-05-11T00:00:00.000Z',
    updatedAt: '2026-05-11T00:00:00.000Z',
    ...overrides,
  };
}

function makeLoanDTO(overrides: Record<string, unknown> = {}) {
  return {
    id: 'loan-1',
    bookId: 'book-1',
    memberId: 'member-1',
    borrowedAt: '2026-05-01T00:00:00.000Z',
    dueAt: '2026-05-15T00:00:00.000Z',
    returnedAt: null,
    status: 'ACTIVE',
    ...overrides,
  };
}

/** Build a domain-error look-alike with a specific `code` that handleError will map. */
function makeDomainErrorWithCode(code: string, message: string): Error {
  class CodedError extends DomainError {
    readonly code = code;
    constructor() {
      super(message);
    }
  }
  return new CodedError();
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ─────────────────────────────────────────────────────────────────────────────
// AC-1: GET /api/members retorna lista con filtro por status (active/suspended)
// ─────────────────────────────────────────────────────────────────────────────

describe('AC-1 GET /api/members returns paginated list with optional status filter', () => {
  it('returns the paginated list with no filter by default', async () => {
    (listMembersUseCase.execute as jest.Mock).mockResolvedValue({
      members: [makeMemberDTO(), makeMemberDTO({ id: 'member-2', email: 'jo@example.com' })],
      total: 2,
      page: 1,
      limit: 20,
      totalPages: 1,
    });

    const res = await GET_LIST(makeRequest('http://localhost/api/members'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.members).toHaveLength(2);
    expect(listMembersUseCase.execute).toHaveBeenCalledWith({});
  });

  it('forwards an ACTIVE status filter to the use case', async () => {
    (listMembersUseCase.execute as jest.Mock).mockResolvedValue({
      members: [makeMemberDTO({ status: 'ACTIVE' })],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    });

    const res = await GET_LIST(
      makeRequest('http://localhost/api/members?status=ACTIVE'),
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.members[0].status).toBe('ACTIVE');
    expect(listMembersUseCase.execute).toHaveBeenCalledWith({ status: 'ACTIVE' });
  });

  it('forwards a SUSPENDED status filter to the use case', async () => {
    (listMembersUseCase.execute as jest.Mock).mockResolvedValue({
      members: [makeMemberDTO({ id: 'member-9', status: 'SUSPENDED' })],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    });

    const res = await GET_LIST(
      makeRequest('http://localhost/api/members?status=SUSPENDED'),
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.members[0].status).toBe('SUSPENDED');
    expect(listMembersUseCase.execute).toHaveBeenCalledWith({ status: 'SUSPENDED' });
  });

  it('rejects an unknown status value with 422', async () => {
    const res = await GET_LIST(
      makeRequest('http://localhost/api/members?status=banned'),
    );
    expect(res.status).toBe(422);
    expect(listMembersUseCase.execute).not.toHaveBeenCalled();
  });

  it('coerces page/limit from query strings and forwards them', async () => {
    (listMembersUseCase.execute as jest.Mock).mockResolvedValue({
      members: [],
      total: 0,
      page: 2,
      limit: 5,
      totalPages: 0,
    });

    const res = await GET_LIST(
      makeRequest('http://localhost/api/members?page=2&limit=5'),
    );
    expect(res.status).toBe(200);
    expect(listMembersUseCase.execute).toHaveBeenCalledWith({ page: 2, limit: 5 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC-2: POST /api/members valida email único y campos requeridos
// ─────────────────────────────────────────────────────────────────────────────

describe('AC-2 POST /api/members validates required fields and unique email', () => {
  const validBody = { email: 'jane@example.com', name: 'Jane Doe' };

  it('creates a member and returns 201', async () => {
    (registerMemberUseCase.execute as jest.Mock).mockResolvedValue(makeMemberDTO());

    const res = await POST_MEMBER(
      makeRequest('http://localhost/api/members', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(validBody),
      }),
    );
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.email).toBe('jane@example.com');
    expect(registerMemberUseCase.execute).toHaveBeenCalledWith(validBody);
  });

  it('returns 409 EMAIL_ALREADY_REGISTERED when email is taken', async () => {
    (registerMemberUseCase.execute as jest.Mock).mockRejectedValue(
      makeDomainErrorWithCode(
        'EMAIL_ALREADY_REGISTERED',
        'A member with email "jane@example.com" is already registered.',
      ),
    );

    const res = await POST_MEMBER(
      makeRequest('http://localhost/api/members', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(validBody),
      }),
    );
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/already registered/i);
  });

  it('returns 422 when required fields are missing (no name)', async () => {
    const res = await POST_MEMBER(
      makeRequest('http://localhost/api/members', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'jane@example.com' }),
      }),
    );

    expect(res.status).toBe(422);
    expect(registerMemberUseCase.execute).not.toHaveBeenCalled();
  });

  it('returns 422 when required fields are missing (no email)', async () => {
    const res = await POST_MEMBER(
      makeRequest('http://localhost/api/members', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'Jane' }),
      }),
    );

    expect(res.status).toBe(422);
    expect(registerMemberUseCase.execute).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC-3: PUT /api/members/[id] permite actualizar nombre, email y status
// ─────────────────────────────────────────────────────────────────────────────

describe('AC-3 PUT /api/members/:id updates name, email and status', () => {
  it('updates the name and returns 200 with the updated member', async () => {
    (updateMemberUseCase.execute as jest.Mock).mockResolvedValue(
      makeMemberDTO({ name: 'Jane Q. Doe' }),
    );

    const res = await PUT_MEMBER(
      makeRequest('http://localhost/api/members/member-1', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'Jane Q. Doe' }),
      }),
      { params: { id: 'member-1' } },
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.name).toBe('Jane Q. Doe');
    expect(updateMemberUseCase.execute).toHaveBeenCalledWith({
      id: 'member-1',
      name: 'Jane Q. Doe',
    });
  });

  it('updates the email and returns 200 with the new email', async () => {
    (updateMemberUseCase.execute as jest.Mock).mockResolvedValue(
      makeMemberDTO({ email: 'jane.new@example.com' }),
    );

    const res = await PUT_MEMBER(
      makeRequest('http://localhost/api/members/member-1', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'jane.new@example.com' }),
      }),
      { params: { id: 'member-1' } },
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.email).toBe('jane.new@example.com');
    expect(updateMemberUseCase.execute).toHaveBeenCalledWith({
      id: 'member-1',
      email: 'jane.new@example.com',
    });
  });

  it('updates the status and returns 200 with the new status', async () => {
    (updateMemberUseCase.execute as jest.Mock).mockResolvedValue(
      makeMemberDTO({ status: 'SUSPENDED' }),
    );

    const res = await PUT_MEMBER(
      makeRequest('http://localhost/api/members/member-1', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status: 'SUSPENDED' }),
      }),
      { params: { id: 'member-1' } },
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.status).toBe('SUSPENDED');
    expect(updateMemberUseCase.execute).toHaveBeenCalledWith({
      id: 'member-1',
      status: 'SUSPENDED',
    });
  });

  it('returns 404 MEMBER_NOT_FOUND when the target does not exist', async () => {
    (updateMemberUseCase.execute as jest.Mock).mockRejectedValue(
      new MemberNotFoundError('missing'),
    );

    const res = await PUT_MEMBER(
      makeRequest('http://localhost/api/members/missing', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'whatever' }),
      }),
      { params: { id: 'missing' } },
    );

    expect(res.status).toBe(404);
  });

  it('returns 422 when no mutable fields are provided', async () => {
    const res = await PUT_MEMBER(
      makeRequest('http://localhost/api/members/member-1', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      }),
      { params: { id: 'member-1' } },
    );

    expect(res.status).toBe(422);
    expect(updateMemberUseCase.execute).not.toHaveBeenCalled();
  });

  it('returns 422 when status is not a valid enum value', async () => {
    const res = await PUT_MEMBER(
      makeRequest('http://localhost/api/members/member-1', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status: 'BANNED' }),
      }),
      { params: { id: 'member-1' } },
    );

    expect(res.status).toBe(422);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC-4: GET /api/members/[id]/loans retorna historial completo
// ─────────────────────────────────────────────────────────────────────────────

describe('AC-4 GET /api/members/:id/loans returns the member loan history', () => {
  it('returns the full history including active and returned loans', async () => {
    const active = makeLoanDTO({ id: 'loan-1', status: 'ACTIVE', returnedAt: null });
    const returned = makeLoanDTO({
      id: 'loan-2',
      status: 'RETURNED',
      returnedAt: '2026-04-15T00:00:00.000Z',
    });
    const overdue = makeLoanDTO({ id: 'loan-3', status: 'OVERDUE', returnedAt: null });

    (getMemberLoansUseCase.execute as jest.Mock).mockResolvedValue({
      memberId: 'member-1',
      total: 3,
      loans: [active, returned, overdue],
    });

    const res = await GET_LOANS(
      makeRequest('http://localhost/api/members/member-1/loans'),
      { params: { id: 'member-1' } },
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.memberId).toBe('member-1');
    expect(body.data.total).toBe(3);
    expect(body.data.loans).toHaveLength(3);
    expect(body.data.loans.map((l: any) => l.status).sort()).toEqual([
      'ACTIVE',
      'OVERDUE',
      'RETURNED',
    ]);
    expect(getMemberLoansUseCase.execute).toHaveBeenCalledWith({ memberId: 'member-1' });
  });

  it('returns an empty history for a member with no loans', async () => {
    (getMemberLoansUseCase.execute as jest.Mock).mockResolvedValue({
      memberId: 'member-1',
      total: 0,
      loans: [],
    });

    const res = await GET_LOANS(
      makeRequest('http://localhost/api/members/member-1/loans'),
      { params: { id: 'member-1' } },
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.total).toBe(0);
    expect(body.data.loans).toEqual([]);
  });

  it('returns 404 when the member does not exist', async () => {
    (getMemberLoansUseCase.execute as jest.Mock).mockRejectedValue(
      new MemberNotFoundError('missing'),
    );

    const res = await GET_LOANS(
      makeRequest('http://localhost/api/members/missing/loans'),
      { params: { id: 'missing' } },
    );

    expect(res.status).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC-5: Email con validación de formato
// ─────────────────────────────────────────────────────────────────────────────

describe('AC-5 email format is validated on every endpoint that accepts it', () => {
  it('rejects a malformed email on POST /api/members with 422', async () => {
    const res = await POST_MEMBER(
      makeRequest('http://localhost/api/members', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'not-an-email', name: 'Jane' }),
      }),
    );
    const body = await res.json();

    expect(res.status).toBe(422);
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/email/i);
    expect(registerMemberUseCase.execute).not.toHaveBeenCalled();
  });

  it('rejects an empty email on POST /api/members with 422', async () => {
    const res = await POST_MEMBER(
      makeRequest('http://localhost/api/members', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: '', name: 'Jane' }),
      }),
    );

    expect(res.status).toBe(422);
    expect(registerMemberUseCase.execute).not.toHaveBeenCalled();
  });

  it('rejects a malformed email on PUT /api/members/:id with 422', async () => {
    const res = await PUT_MEMBER(
      makeRequest('http://localhost/api/members/member-1', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'still-not-an-email' }),
      }),
      { params: { id: 'member-1' } },
    );
    const body = await res.json();

    expect(res.status).toBe(422);
    expect(body.error).toMatch(/email/i);
    expect(updateMemberUseCase.execute).not.toHaveBeenCalled();
  });

  it('accepts a valid email format on POST /api/members', async () => {
    (registerMemberUseCase.execute as jest.Mock).mockResolvedValue(makeMemberDTO());

    const res = await POST_MEMBER(
      makeRequest('http://localhost/api/members', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'valid@example.com', name: 'Jane' }),
      }),
    );

    expect(res.status).toBe(201);
    expect(registerMemberUseCase.execute).toHaveBeenCalledWith({
      email: 'valid@example.com',
      name: 'Jane',
    });
  });
});
