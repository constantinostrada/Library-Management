/**
 * Component tests for the /members listing, /members/[id] detail,
 * /members/new and /members/[id]/edit pages, plus the loading + error
 * segment files and the client components MemberForm + MemberStatusToggle.
 *
 * Same strategy as the books-page tests: call each Server Component as a
 * plain async function, stringify with react-dom/server.renderToStaticMarkup,
 * assert on the HTML. Container use cases are mocked. JSDOM is NOT required;
 * the existing jest testEnvironment: 'node' is sufficient.
 *
 * Each describe block aligns with one acceptance criterion so that
 * `chiron task ac assert <id> --test '<this file>::<describe>'` matches.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { MemberNotFoundError } from '@/domain/errors/MemberNotFoundError';

// ── Container mocks ──────────────────────────────────────────────────────────

jest.mock('@/infrastructure/container', () => ({
  listMembersUseCase: { execute: jest.fn() },
  getMemberUseCase: { execute: jest.fn() },
  getMemberLoansUseCase: { execute: jest.fn() },
  registerMemberUseCase: { execute: jest.fn() },
  updateMemberUseCase: { execute: jest.fn() },
  countActiveLoansByMemberUseCase: { execute: jest.fn() },
}));

jest.mock('next/navigation', () => ({
  notFound: jest.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
  useRouter: jest.fn(() => ({ push: jest.fn(), refresh: jest.fn() })),
}));

import {
  countActiveLoansByMemberUseCase,
  getMemberLoansUseCase,
  getMemberUseCase,
  listMembersUseCase,
} from '@/infrastructure/container';
import { notFound } from 'next/navigation';

import MembersPage from '@/app/members/page';
import MemberDetailPage from '@/app/members/[id]/page';
import NewMemberPage from '@/app/members/new/page';
import EditMemberPage from '@/app/members/[id]/edit/page';
import MembersLoading from '@/app/members/loading';
import MemberDetailLoading from '@/app/members/[id]/loading';
import MembersError from '@/app/members/error';

import { MemberForm } from '@/components/MemberForm';
import { MemberStatusToggle } from '@/components/MemberStatusToggle';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeMemberDTO(overrides: Record<string, unknown> = {}) {
  return {
    id: 'member-1',
    email: 'jane@example.com',
    name: 'Jane Doe',
    status: 'ACTIVE' as const,
    createdAt: '2026-01-15T00:00:00.000Z',
    updatedAt: '2026-05-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeLoanDTO(overrides: Record<string, unknown> = {}) {
  return {
    id: 'loan-1',
    bookId: 'book-abc12345',
    memberId: 'member-1',
    borrowedAt: '2026-04-01T00:00:00.000Z',
    dueAt: '2026-04-15T00:00:00.000Z',
    returnedAt: null,
    status: 'ACTIVE' as const,
    ...overrides,
  };
}

async function renderAsync(component: () => Promise<JSX.Element>): Promise<string> {
  const element = await component();
  return renderToStaticMarkup(element);
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ─────────────────────────────────────────────────────────────────────────────
// AC-1: Página /members con tabla nombre/email/status/active-loans
// ─────────────────────────────────────────────────────────────────────────────

describe('AC-1 /members lists name, email, status and active loan count', () => {
  it('renders a row per member with all required columns', async () => {
    (listMembersUseCase.execute as jest.Mock).mockResolvedValue({
      members: [
        makeMemberDTO({ id: 'm1', name: 'Alice', email: 'alice@x.com', status: 'ACTIVE' }),
        makeMemberDTO({
          id: 'm2',
          name: 'Bob',
          email: 'bob@x.com',
          status: 'SUSPENDED',
        }),
      ],
      total: 2,
      page: 1,
      limit: 20,
      totalPages: 1,
    });
    (countActiveLoansByMemberUseCase.execute as jest.Mock).mockResolvedValue({
      m1: 2,
      m2: 0,
    });

    const html = await renderAsync(() => MembersPage({ searchParams: {} }));

    expect(html).toContain('Name');
    expect(html).toContain('Email');
    expect(html).toContain('Status');
    expect(html).toContain('Active Loans');

    expect(html).toContain('Alice');
    expect(html).toContain('alice@x.com');
    expect(html).toContain('Bob');
    expect(html).toContain('bob@x.com');

    const rowCount = (html.match(/data-testid="member-row"/g) ?? []).length;
    expect(rowCount).toBe(2);

    // Active-loan counts are visible
    expect(html).toMatch(/data-testid="cell-active-loans"[^>]*>\s*<span[^>]*aria-label="2 active loan\(s\)"[^>]*>2</);
    expect(html).toMatch(/data-testid="cell-active-loans"[^>]*>\s*<span[^>]*aria-label="0 active loan\(s\)"[^>]*>0</);
  });

  it('renders an empty state when no members exist', async () => {
    (listMembersUseCase.execute as jest.Mock).mockResolvedValue({
      members: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    });
    (countActiveLoansByMemberUseCase.execute as jest.Mock).mockResolvedValue({});

    const html = await renderAsync(() => MembersPage({ searchParams: {} }));
    expect(html).toContain('data-testid="empty-state"');
    expect(html).toContain('No members registered yet');
  });

  it('passes the parsed status filter through to listMembersUseCase', async () => {
    (listMembersUseCase.execute as jest.Mock).mockResolvedValue({
      members: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    });
    (countActiveLoansByMemberUseCase.execute as jest.Mock).mockResolvedValue({});

    await renderAsync(() =>
      MembersPage({ searchParams: { status: 'suspended', page: '2' } }),
    );

    expect(listMembersUseCase.execute).toHaveBeenCalledWith({
      page: 2,
      limit: 20,
      status: 'SUSPENDED',
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC-2: Badge verde para ACTIVE, rojo para SUSPENDED
// ─────────────────────────────────────────────────────────────────────────────

describe('AC-2 status badges use green for ACTIVE and red for SUSPENDED', () => {
  function renderRowFor(status: 'ACTIVE' | 'SUSPENDED' | 'CLOSED') {
    (listMembersUseCase.execute as jest.Mock).mockResolvedValue({
      members: [makeMemberDTO({ id: `m-${status}`, status })],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    });
    (countActiveLoansByMemberUseCase.execute as jest.Mock).mockResolvedValue({});
    return renderAsync(() => MembersPage({ searchParams: {} }));
  }

  it('ACTIVE member shows a green badge', async () => {
    const html = await renderRowFor('ACTIVE');
    expect(html).toMatch(/class="badge-green"[^>]*data-testid="status-badge"[^>]*data-status="ACTIVE"/);
  });

  it('SUSPENDED member shows a red badge', async () => {
    const html = await renderRowFor('SUSPENDED');
    expect(html).toMatch(/class="badge-red"[^>]*data-testid="status-badge"[^>]*data-status="SUSPENDED"/);
  });

  it('CLOSED member uses a neutral grey badge (not green or red)', async () => {
    const html = await renderRowFor('CLOSED');
    expect(html).toMatch(/class="badge-gray"[^>]*data-testid="status-badge"[^>]*data-status="CLOSED"/);
  });

  it('detail page also renders the green/red status badge', async () => {
    (getMemberUseCase.execute as jest.Mock).mockResolvedValue(
      makeMemberDTO({ status: 'SUSPENDED' }),
    );
    (getMemberLoansUseCase.execute as jest.Mock).mockResolvedValue({
      memberId: 'member-1',
      total: 0,
      loans: [],
    });

    const html = await renderAsync(() =>
      MemberDetailPage({
        params: { id: 'member-1' },
        searchParams: {},
      }),
    );

    expect(html).toMatch(/class="badge-red"[^>]*data-testid="detail-status-badge"/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC-3: Toggle suspender/activar visible en listado y detalle
// ─────────────────────────────────────────────────────────────────────────────

describe('AC-3 suspend/activate toggle appears on listing rows and detail page', () => {
  it('listing row includes a status toggle button for an ACTIVE member', async () => {
    (listMembersUseCase.execute as jest.Mock).mockResolvedValue({
      members: [makeMemberDTO({ id: 'm-active', status: 'ACTIVE' })],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    });
    (countActiveLoansByMemberUseCase.execute as jest.Mock).mockResolvedValue({});

    const html = await renderAsync(() => MembersPage({ searchParams: {} }));

    expect(html).toContain('data-testid="member-status-toggle"');
    expect(html).toContain('data-testid="member-status-toggle-button"');
    expect(html).toMatch(/data-next-status="SUSPENDED"/);
    expect(html).toContain('Suspend');
  });

  it('listing row toggle for a SUSPENDED member offers Activate', async () => {
    (listMembersUseCase.execute as jest.Mock).mockResolvedValue({
      members: [makeMemberDTO({ id: 'm-susp', status: 'SUSPENDED' })],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    });
    (countActiveLoansByMemberUseCase.execute as jest.Mock).mockResolvedValue({});

    const html = await renderAsync(() => MembersPage({ searchParams: {} }));
    expect(html).toMatch(/data-next-status="ACTIVE"/);
    expect(html).toContain('Activate');
  });

  it('CLOSED member does NOT render a toggle (closed accounts can\'t be reactivated)', () => {
    const html = renderToStaticMarkup(
      React.createElement(MemberStatusToggle, {
        memberId: 'm-closed',
        currentStatus: 'CLOSED',
      }),
    );
    expect(html).toBe('');
  });

  it('detail page also renders the toggle button', async () => {
    (getMemberUseCase.execute as jest.Mock).mockResolvedValue(
      makeMemberDTO({ status: 'ACTIVE' }),
    );
    (getMemberLoansUseCase.execute as jest.Mock).mockResolvedValue({
      memberId: 'member-1',
      total: 0,
      loans: [],
    });

    const html = await renderAsync(() =>
      MemberDetailPage({
        params: { id: 'member-1' },
        searchParams: {},
      }),
    );

    expect(html).toContain('data-testid="member-status-toggle"');
    expect(html).toContain('Suspend');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC-4: Formulario de registro con validación
// ─────────────────────────────────────────────────────────────────────────────

describe('AC-4 /members/new renders a registration form with validation wiring', () => {
  it('renders the registration form with required name and email inputs', async () => {
    const html = await renderAsync(async () => NewMemberPage());

    expect(html).toContain('data-testid="member-form-page"');
    expect(html).toContain('data-testid="member-form"');
    expect(html).toMatch(/name="name"/);
    expect(html).toMatch(/name="email"/);
    expect(html).toContain('data-testid="member-form-submit"');
    expect(html).toContain('Register Member');
  });

  it('form has noValidate so the browser does not short-circuit Zod validation', () => {
    const html = renderToStaticMarkup(React.createElement(MemberForm, { mode: 'create' }));
    expect(html).toMatch(/noValidate=""|novalidate=""|novalidate(?!=)|noValidate(?!=)/);
  });

  it('marks the email input as type="email" so the browser also helps with format', () => {
    const html = renderToStaticMarkup(React.createElement(MemberForm, { mode: 'create' }));
    expect(html).toMatch(/type="email"/);
  });

  it('pre-fills the form in edit mode and POSTs to the right URL', async () => {
    (getMemberUseCase.execute as jest.Mock).mockResolvedValue(
      makeMemberDTO({ id: 'm-42', email: 'foo@bar.com', name: 'Foo Bar' }),
    );

    const html = await renderAsync(() => EditMemberPage({ params: { id: 'm-42' } }));

    expect(html).toContain('data-testid="member-form-page"');
    expect(html).toContain('Edit Member');
    expect(html).toContain('Foo Bar');
    // Edit-mode submit button label
    expect(html).toContain('Save Changes');
    // Cancel link goes back to the detail page
    expect(html).toMatch(/href="\/members\/m-42"[^>]*data-testid="member-form-cancel"|data-testid="member-form-cancel"[^>]*href="\/members\/m-42"/);
  });

  it('edit page invokes notFound() for a missing member', async () => {
    (getMemberUseCase.execute as jest.Mock).mockRejectedValue(
      new MemberNotFoundError('missing-id'),
    );

    await expect(EditMemberPage({ params: { id: 'missing-id' } })).rejects.toThrow(
      'NEXT_NOT_FOUND',
    );
    expect(notFound).toHaveBeenCalledTimes(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC-5: Página de detalle con historial paginado
// ─────────────────────────────────────────────────────────────────────────────

describe('AC-5 /members/[id] detail page renders paginated loan history', () => {
  it('renders the member info, loan history table and an empty state when no loans', async () => {
    (getMemberUseCase.execute as jest.Mock).mockResolvedValue(makeMemberDTO());
    (getMemberLoansUseCase.execute as jest.Mock).mockResolvedValue({
      memberId: 'member-1',
      total: 0,
      loans: [],
    });

    const html = await renderAsync(() =>
      MemberDetailPage({ params: { id: 'member-1' }, searchParams: {} }),
    );

    expect(html).toContain('data-testid="member-detail"');
    expect(html).toContain('data-testid="detail-name"');
    expect(html).toContain('data-testid="detail-email"');
    expect(html).toContain('data-testid="loan-history"');
    expect(html).toContain('data-testid="loan-history-empty"');
    expect(html).toContain('no loan history yet');
  });

  it('renders only the requested page of the loan history (10 per page)', async () => {
    // Build 25 loans so totalPages = 3
    const loans = Array.from({ length: 25 }, (_, i) =>
      makeLoanDTO({
        id: `loan-${i + 1}`,
        bookId: `book-${String(i + 1).padStart(8, '0')}`,
        status: 'RETURNED',
        returnedAt: '2026-04-30T00:00:00.000Z',
      }),
    );

    (getMemberUseCase.execute as jest.Mock).mockResolvedValue(makeMemberDTO());
    (getMemberLoansUseCase.execute as jest.Mock).mockResolvedValue({
      memberId: 'member-1',
      total: 25,
      loans,
    });

    // Page 1 → loans 1..10
    let html = await renderAsync(() =>
      MemberDetailPage({ params: { id: 'member-1' }, searchParams: { page: '1' } }),
    );
    let rowCount = (html.match(/data-testid="loan-row"/g) ?? []).length;
    expect(rowCount).toBe(10);
    expect(html).toContain('data-testid="loan-history-pagination"');
    // First book id of page 1 is loan-1 (book-00000001)
    expect(html).toContain('book-000');
    // Last row on page 1 references loan-10 (book-00000010) — first 8 chars of bookId visible
    expect(html).toContain('book-0000000');

    // Page 3 → loans 21..25 (only 5 rows)
    html = await renderAsync(() =>
      MemberDetailPage({ params: { id: 'member-1' }, searchParams: { page: '3' } }),
    );
    rowCount = (html.match(/data-testid="loan-row"/g) ?? []).length;
    expect(rowCount).toBe(5);
  });

  it('shows a pagination nav with one link per page', async () => {
    const loans = Array.from({ length: 22 }, (_, i) =>
      makeLoanDTO({ id: `loan-${i + 1}`, bookId: `book-x${i}` }),
    );
    (getMemberUseCase.execute as jest.Mock).mockResolvedValue(makeMemberDTO());
    (getMemberLoansUseCase.execute as jest.Mock).mockResolvedValue({
      memberId: 'member-1',
      total: 22,
      loans,
    });

    const html = await renderAsync(() =>
      MemberDetailPage({ params: { id: 'member-1' }, searchParams: {} }),
    );

    expect(html).toContain('data-testid="loan-history-pagination"');
    expect(html).toMatch(/href="\/members\/member-1\?page=1"/);
    expect(html).toMatch(/href="\/members\/member-1\?page=2"/);
    expect(html).toMatch(/href="\/members\/member-1\?page=3"/);
  });

  it('invokes notFound() when the member does not exist', async () => {
    (getMemberUseCase.execute as jest.Mock).mockRejectedValue(
      new MemberNotFoundError('missing-id'),
    );

    await expect(
      MemberDetailPage({ params: { id: 'missing-id' }, searchParams: {} }),
    ).rejects.toThrow('NEXT_NOT_FOUND');

    expect(notFound).toHaveBeenCalledTimes(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Loading + error segment files (smoke)
// ─────────────────────────────────────────────────────────────────────────────

describe('loading and error segment files', () => {
  it('renders a loading skeleton for the listing page', () => {
    const html = renderToStaticMarkup(React.createElement(MembersLoading));
    expect(html).toContain('data-testid="members-loading"');
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('animate-pulse');
  });

  it('renders a loading skeleton for the detail page', () => {
    const html = renderToStaticMarkup(React.createElement(MemberDetailLoading));
    expect(html).toContain('data-testid="member-detail-loading"');
    expect(html).toContain('role="status"');
  });

  it('renders an error boundary with a Try Again button', () => {
    const reset = jest.fn();
    const html = renderToStaticMarkup(
      React.createElement(MembersError, { error: new Error('boom'), reset }),
    );
    expect(html).toContain('data-testid="members-error"');
    expect(html).toContain('role="alert"');
    expect(html).toContain('Try Again');
  });
});
