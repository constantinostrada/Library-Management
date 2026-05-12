/**
 * Integration tests for /api/loans and /api/loans/[id]/return route handlers.
 *
 * We jest.mock `@/infrastructure/container` so the tests exercise the route
 * adapters (Zod validation, status-code translation, response shape) without
 * touching Prisma or the database.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextRequest } from 'next/server';

import { BookNotFoundError } from '@/domain/errors/BookNotFoundError';
import { BorrowLimitExceededError } from '@/domain/errors/BorrowLimitExceededError';
import { LoanAlreadyReturnedError } from '@/domain/errors/LoanAlreadyReturnedError';
import { LoanNotFoundError } from '@/domain/errors/LoanNotFoundError';
import { MemberNotFoundError } from '@/domain/errors/MemberNotFoundError';
import { MemberSuspendedError } from '@/domain/errors/MemberSuspendedError';
import { NoCopiesAvailableError } from '@/domain/errors/NoCopiesAvailableError';

// ── Container mocks ──────────────────────────────────────────────────────────

jest.mock('@/infrastructure/container', () => ({
  borrowBookUseCase: { execute: jest.fn() },
  returnBookUseCase: { execute: jest.fn() },
  listLoansUseCase: { execute: jest.fn() },
}));

import {
  borrowBookUseCase,
  listLoansUseCase,
  returnBookUseCase,
} from '@/infrastructure/container';

import { GET as GET_LIST, POST as POST_LOAN } from '@/app/api/loans/route';
import { PUT as PUT_RETURN } from '@/app/api/loans/[id]/return/route';

// ── Helpers ──────────────────────────────────────────────────────────────────

const BOOK_ID = '11111111-1111-1111-1111-111111111111';
const MEMBER_ID = '22222222-2222-2222-2222-222222222222';
const LOAN_ID = '33333333-3333-3333-3333-333333333333';

function makeRequest(url: string, init?: RequestInit): NextRequest {
  return new NextRequest(new Request(url, init));
}

function makeLoanDTO(overrides: Record<string, unknown> = {}) {
  return {
    id: LOAN_ID,
    bookId: BOOK_ID,
    memberId: MEMBER_ID,
    borrowedAt: '2026-05-01T00:00:00.000Z',
    dueAt: '2026-05-15T00:00:00.000Z',
    returnedAt: null,
    status: 'ACTIVE',
    isOverdue: false,
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ─────────────────────────────────────────────────────────────────────────────
// AC-1: POST /api/loans valida reglas de negocio antes de crear y
//       retorna error descriptivo si falla
// ─────────────────────────────────────────────────────────────────────────────

describe('AC-1 POST /api/loans validates business rules and returns descriptive errors', () => {
  const validBody = { bookId: BOOK_ID, memberId: MEMBER_ID };

  it('creates a loan and returns 201 when all rules pass', async () => {
    (borrowBookUseCase.execute as jest.Mock).mockResolvedValue(makeLoanDTO());

    const res = await POST_LOAN(
      makeRequest('http://localhost/api/loans', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(validBody),
      }),
    );
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe(LOAN_ID);
    expect(borrowBookUseCase.execute).toHaveBeenCalledWith(validBody);
  });

  it('returns 403 with a descriptive message when the member is suspended', async () => {
    (borrowBookUseCase.execute as jest.Mock).mockRejectedValue(
      new MemberSuspendedError(MEMBER_ID),
    );

    const res = await POST_LOAN(
      makeRequest('http://localhost/api/loans', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(validBody),
      }),
    );
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/suspend/i);
  });

  it('returns 409 NO_COPIES_AVAILABLE with a descriptive message', async () => {
    (borrowBookUseCase.execute as jest.Mock).mockRejectedValue(
      new NoCopiesAvailableError(BOOK_ID),
    );

    const res = await POST_LOAN(
      makeRequest('http://localhost/api/loans', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(validBody),
      }),
    );
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.error).toMatch(/copies/i);
  });

  it('returns 409 BORROW_LIMIT_EXCEEDED with a descriptive message', async () => {
    (borrowBookUseCase.execute as jest.Mock).mockRejectedValue(
      new BorrowLimitExceededError(MEMBER_ID, 3),
    );

    const res = await POST_LOAN(
      makeRequest('http://localhost/api/loans', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(validBody),
      }),
    );
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.error).toMatch(/limit/i);
  });

  it('returns 404 when the member does not exist', async () => {
    (borrowBookUseCase.execute as jest.Mock).mockRejectedValue(
      new MemberNotFoundError(MEMBER_ID),
    );

    const res = await POST_LOAN(
      makeRequest('http://localhost/api/loans', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(validBody),
      }),
    );

    expect(res.status).toBe(404);
  });

  it('returns 404 when the book does not exist', async () => {
    (borrowBookUseCase.execute as jest.Mock).mockRejectedValue(
      new BookNotFoundError(BOOK_ID),
    );

    const res = await POST_LOAN(
      makeRequest('http://localhost/api/loans', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(validBody),
      }),
    );

    expect(res.status).toBe(404);
  });

  it('returns 422 when bookId is not a valid UUID', async () => {
    const res = await POST_LOAN(
      makeRequest('http://localhost/api/loans', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ bookId: 'not-a-uuid', memberId: MEMBER_ID }),
      }),
    );

    expect(res.status).toBe(422);
    expect(borrowBookUseCase.execute).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC-2: POST /api/loans registra dueDate (fecha actual + período configurable,
//       default 14 días)
// ─────────────────────────────────────────────────────────────────────────────

describe('AC-2 POST /api/loans persists a dueDate (default 14 days, configurable)', () => {
  it('uses the default 14-day duration when loanDurationDays is omitted', async () => {
    const borrowedAt = new Date('2026-05-01T00:00:00.000Z');
    const expectedDue = new Date('2026-05-15T00:00:00.000Z'); // +14 days
    (borrowBookUseCase.execute as jest.Mock).mockResolvedValue(
      makeLoanDTO({
        borrowedAt: borrowedAt.toISOString(),
        dueAt: expectedDue.toISOString(),
      }),
    );

    const res = await POST_LOAN(
      makeRequest('http://localhost/api/loans', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ bookId: BOOK_ID, memberId: MEMBER_ID }),
      }),
    );
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.data.dueAt).toBe('2026-05-15T00:00:00.000Z');
    // Verify the use case is invoked WITHOUT a loanDurationDays override
    expect(borrowBookUseCase.execute).toHaveBeenCalledWith({
      bookId: BOOK_ID,
      memberId: MEMBER_ID,
    });
    // 14-day delta between borrowedAt and dueAt
    const diffMs =
      new Date(body.data.dueAt).getTime() - new Date(body.data.borrowedAt).getTime();
    expect(diffMs).toBe(14 * 24 * 60 * 60 * 1000);
  });

  it('forwards a custom loanDurationDays override to the use case', async () => {
    const dueAt = new Date('2026-05-08T00:00:00.000Z'); // +7 days
    (borrowBookUseCase.execute as jest.Mock).mockResolvedValue(
      makeLoanDTO({ dueAt: dueAt.toISOString() }),
    );

    const res = await POST_LOAN(
      makeRequest('http://localhost/api/loans', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          bookId: BOOK_ID,
          memberId: MEMBER_ID,
          loanDurationDays: 7,
        }),
      }),
    );
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.data.dueAt).toBe('2026-05-08T00:00:00.000Z');
    expect(borrowBookUseCase.execute).toHaveBeenCalledWith({
      bookId: BOOK_ID,
      memberId: MEMBER_ID,
      loanDurationDays: 7,
    });
  });

  it('rejects a loanDurationDays outside the allowed range with 422', async () => {
    const res = await POST_LOAN(
      makeRequest('http://localhost/api/loans', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          bookId: BOOK_ID,
          memberId: MEMBER_ID,
          loanDurationDays: 0,
        }),
      }),
    );

    expect(res.status).toBe(422);
    expect(borrowBookUseCase.execute).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC-3: PUT /api/loans/[id]/return actualiza returnedAt y marca el loan
//       como returned
// ─────────────────────────────────────────────────────────────────────────────

describe('AC-3 PUT /api/loans/:id/return marks the loan as returned', () => {
  it('returns 200 with the loan whose returnedAt and status are now set', async () => {
    const returnedAt = '2026-05-10T12:34:56.000Z';
    (returnBookUseCase.execute as jest.Mock).mockResolvedValue(
      makeLoanDTO({ returnedAt, status: 'RETURNED', isOverdue: false }),
    );

    const res = await PUT_RETURN(
      makeRequest(`http://localhost/api/loans/${LOAN_ID}/return`, {
        method: 'PUT',
      }),
      { params: { id: LOAN_ID } },
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('RETURNED');
    expect(body.data.returnedAt).toBe(returnedAt);
    expect(returnBookUseCase.execute).toHaveBeenCalledWith({ loanId: LOAN_ID });
  });

  it('returns 404 LOAN_NOT_FOUND when the loan id does not exist', async () => {
    (returnBookUseCase.execute as jest.Mock).mockRejectedValue(
      new LoanNotFoundError(LOAN_ID),
    );

    const res = await PUT_RETURN(
      makeRequest(`http://localhost/api/loans/${LOAN_ID}/return`, {
        method: 'PUT',
      }),
      { params: { id: LOAN_ID } },
    );

    expect(res.status).toBe(404);
  });

  it('returns 409 LOAN_ALREADY_RETURNED when the loan was already returned', async () => {
    (returnBookUseCase.execute as jest.Mock).mockRejectedValue(
      new LoanAlreadyReturnedError(LOAN_ID),
    );

    const res = await PUT_RETURN(
      makeRequest(`http://localhost/api/loans/${LOAN_ID}/return`, {
        method: 'PUT',
      }),
      { params: { id: LOAN_ID } },
    );
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.error).toMatch(/already.*returned/i);
  });

  it('returns 422 when the id segment is not a valid UUID', async () => {
    const res = await PUT_RETURN(
      makeRequest('http://localhost/api/loans/not-a-uuid/return', {
        method: 'PUT',
      }),
      { params: { id: 'not-a-uuid' } },
    );

    expect(res.status).toBe(422);
    expect(returnBookUseCase.execute).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC-4: GET /api/loans soporta filtros por status (active/returned/overdue)
//       y memberId
// ─────────────────────────────────────────────────────────────────────────────

describe('AC-4 GET /api/loans supports status and memberId filters', () => {
  beforeEach(() => {
    (listLoansUseCase.execute as jest.Mock).mockResolvedValue({
      loans: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    });
  });

  it('forwards status=active to the use case', async () => {
    const res = await GET_LIST(makeRequest('http://localhost/api/loans?status=active'));
    expect(res.status).toBe(200);
    expect(listLoansUseCase.execute).toHaveBeenCalledWith({ status: 'active' });
  });

  it('forwards status=returned to the use case', async () => {
    const res = await GET_LIST(makeRequest('http://localhost/api/loans?status=returned'));
    expect(res.status).toBe(200);
    expect(listLoansUseCase.execute).toHaveBeenCalledWith({ status: 'returned' });
  });

  it('forwards status=overdue to the use case', async () => {
    const res = await GET_LIST(makeRequest('http://localhost/api/loans?status=overdue'));
    expect(res.status).toBe(200);
    expect(listLoansUseCase.execute).toHaveBeenCalledWith({ status: 'overdue' });
  });

  it('accepts status case-insensitively (ACTIVE → active)', async () => {
    const res = await GET_LIST(makeRequest('http://localhost/api/loans?status=ACTIVE'));
    expect(res.status).toBe(200);
    expect(listLoansUseCase.execute).toHaveBeenCalledWith({ status: 'active' });
  });

  it('rejects an unknown status with 422', async () => {
    const res = await GET_LIST(
      makeRequest('http://localhost/api/loans?status=archived'),
    );
    expect(res.status).toBe(422);
    expect(listLoansUseCase.execute).not.toHaveBeenCalled();
  });

  it('forwards memberId to the use case', async () => {
    const res = await GET_LIST(
      makeRequest(`http://localhost/api/loans?memberId=${MEMBER_ID}`),
    );
    expect(res.status).toBe(200);
    expect(listLoansUseCase.execute).toHaveBeenCalledWith({ memberId: MEMBER_ID });
  });

  it('forwards both memberId and status combined', async () => {
    const res = await GET_LIST(
      makeRequest(
        `http://localhost/api/loans?memberId=${MEMBER_ID}&status=overdue`,
      ),
    );
    expect(res.status).toBe(200);
    expect(listLoansUseCase.execute).toHaveBeenCalledWith({
      memberId: MEMBER_ID,
      status: 'overdue',
    });
  });

  it('rejects a non-UUID memberId with 422', async () => {
    const res = await GET_LIST(
      makeRequest('http://localhost/api/loans?memberId=not-a-uuid'),
    );
    expect(res.status).toBe(422);
    expect(listLoansUseCase.execute).not.toHaveBeenCalled();
  });

  it('returns a paginated list with no filters by default', async () => {
    const res = await GET_LIST(makeRequest('http://localhost/api/loans'));
    expect(res.status).toBe(200);
    expect(listLoansUseCase.execute).toHaveBeenCalledWith({});
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC-5: GET /api/loans calcula y expone si un loan está overdue
//       (dueDate < today y no devuelto)
// ─────────────────────────────────────────────────────────────────────────────

describe('AC-5 GET /api/loans exposes an isOverdue flag for each loan', () => {
  it('returns isOverdue=true for a not-returned loan past its dueAt', async () => {
    (listLoansUseCase.execute as jest.Mock).mockResolvedValue({
      loans: [
        makeLoanDTO({
          id: 'loan-overdue',
          dueAt: '2026-04-01T00:00:00.000Z', // past today
          returnedAt: null,
          status: 'ACTIVE',
          isOverdue: true,
        }),
      ],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    });

    const res = await GET_LIST(makeRequest('http://localhost/api/loans'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.loans).toHaveLength(1);
    expect(body.data.loans[0].isOverdue).toBe(true);
  });

  it('returns isOverdue=false for a returned loan even if dueAt is in the past', async () => {
    (listLoansUseCase.execute as jest.Mock).mockResolvedValue({
      loans: [
        makeLoanDTO({
          id: 'loan-returned-late',
          dueAt: '2026-04-01T00:00:00.000Z',
          returnedAt: '2026-04-15T00:00:00.000Z',
          status: 'RETURNED',
          isOverdue: false,
        }),
      ],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    });

    const res = await GET_LIST(makeRequest('http://localhost/api/loans'));
    const body = await res.json();

    expect(body.data.loans[0].isOverdue).toBe(false);
  });

  it('returns isOverdue=false for an active loan whose dueAt is still in the future', async () => {
    (listLoansUseCase.execute as jest.Mock).mockResolvedValue({
      loans: [
        makeLoanDTO({
          id: 'loan-future-due',
          dueAt: '2099-01-01T00:00:00.000Z',
          returnedAt: null,
          status: 'ACTIVE',
          isOverdue: false,
        }),
      ],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    });

    const res = await GET_LIST(makeRequest('http://localhost/api/loans'));
    const body = await res.json();

    expect(body.data.loans[0].isOverdue).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Unit-level coverage of the LoanMapper, exercising the *real* mapper to
// guarantee the isOverdue computation matches AC-5 regardless of how callers
// construct the use case in production.
// ─────────────────────────────────────────────────────────────────────────────

describe('LoanMapper computes isOverdue from dueAt vs now', () => {
  it('flags isOverdue=true when returnedAt is null and dueAt < now', () => {
    // Defer the import so the previous jest.mock of @/infrastructure/container
    // is not relied upon here (the mapper has no DI deps).
    /* eslint-disable @typescript-eslint/no-var-requires */
    const { LoanMapper } = require('@/application/mappers/LoanMapper');
    const { Loan } = require('@/domain/entities/Loan');

    const loan = Loan.create({
      id: LOAN_ID,
      bookId: BOOK_ID,
      memberId: MEMBER_ID,
      borrowedAt: new Date('2026-04-01T00:00:00.000Z'),
      dueAt: new Date('2026-04-15T00:00:00.000Z'),
      returnedAt: null,
      status: 'ACTIVE',
    });

    const dto = LoanMapper.toDTO(loan, new Date('2026-05-12T00:00:00.000Z'));
    expect(dto.isOverdue).toBe(true);
  });

  it('flags isOverdue=false when the loan is already returned', () => {
    /* eslint-disable @typescript-eslint/no-var-requires */
    const { LoanMapper } = require('@/application/mappers/LoanMapper');
    const { Loan } = require('@/domain/entities/Loan');

    const loan = Loan.create({
      id: LOAN_ID,
      bookId: BOOK_ID,
      memberId: MEMBER_ID,
      borrowedAt: new Date('2026-04-01T00:00:00.000Z'),
      dueAt: new Date('2026-04-15T00:00:00.000Z'),
      returnedAt: new Date('2026-04-10T00:00:00.000Z'),
      status: 'RETURNED',
    });

    const dto = LoanMapper.toDTO(loan, new Date('2026-05-12T00:00:00.000Z'));
    expect(dto.isOverdue).toBe(false);
  });
});
