import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import type { LoanDTO, LoanStatusDTO } from '@/application/dtos/LoanDTO';
import type { MemberStatusDTO } from '@/application/dtos/MemberDTO';
import { MemberStatusToggle } from '@/components/MemberStatusToggle';
import { MemberNotFoundError } from '@/domain/errors/MemberNotFoundError';
import {
  getMemberLoansUseCase,
  getMemberUseCase,
} from '@/infrastructure/container';

interface Props {
  params: { id: string };
  searchParams: { page?: string };
}

const LOANS_PER_PAGE = 10;

const STATUS_BADGE: Record<MemberStatusDTO, string> = {
  ACTIVE: 'badge-green',
  SUSPENDED: 'badge-red',
  CLOSED: 'badge-gray',
};

const LOAN_BADGE: Record<LoanStatusDTO, string> = {
  ACTIVE: 'badge-green',
  RETURNED: 'badge-gray',
  OVERDUE: 'badge-red',
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const member = await getMemberUseCase.execute({ id: params.id });
    return { title: member.name };
  } catch {
    return { title: 'Member Not Found' };
  }
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function paginate<T>(items: T[], page: number, limit: number): T[] {
  const start = (page - 1) * limit;
  return items.slice(start, start + limit);
}

export default async function MemberDetailPage({
  params,
  searchParams,
}: Props): Promise<JSX.Element> {
  let member;
  try {
    member = await getMemberUseCase.execute({ id: params.id });
  } catch (error) {
    if (error instanceof MemberNotFoundError) notFound();
    throw error;
  }

  const history = await getMemberLoansUseCase.execute({ memberId: params.id });
  const totalLoans = history.total;
  const totalPages = Math.max(1, Math.ceil(totalLoans / LOANS_PER_PAGE));
  const loanPage = Math.min(
    Math.max(1, parsePositiveInt(searchParams.page, 1)),
    totalPages,
  );
  const pagedLoans: LoanDTO[] = paginate(history.loans, loanPage, LOANS_PER_PAGE);

  const badgeClass = STATUS_BADGE[member.status];

  return (
    <div className="space-y-6 max-w-3xl" data-testid="member-detail">
      <div>
        <a href="/members" className="text-sm text-brand-600 hover:underline">
          ← Back to members
        </a>
      </div>

      <div className="card space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900" data-testid="detail-name">
              {member.name}
            </h1>
            <p className="text-sm text-gray-500" data-testid="detail-email">
              {member.email}
            </p>
          </div>
          <span
            className={badgeClass}
            data-testid="detail-status-badge"
            data-status={member.status}
            aria-label={`Status: ${member.status}`}
          >
            {member.status}
          </span>
        </div>

        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="font-medium text-gray-500">Member ID</dt>
            <dd className="mt-1 font-mono text-xs text-gray-700" data-testid="detail-id">
              {member.id}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-gray-500">Joined</dt>
            <dd className="mt-1 text-gray-900" data-testid="detail-joined">
              {new Date(member.createdAt).toLocaleDateString()}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-gray-500">Last Updated</dt>
            <dd className="mt-1 text-gray-900" data-testid="detail-updated">
              {new Date(member.updatedAt).toLocaleDateString()}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-gray-500">Total Loan Records</dt>
            <dd className="mt-1 text-gray-900" data-testid="detail-total-loans">
              {totalLoans}
            </dd>
          </div>
        </dl>

        <div className="flex flex-wrap items-center gap-2 pt-2">
          <MemberStatusToggle memberId={member.id} currentStatus={member.status} size="md" />
          <a
            href={`/members/${member.id}/edit`}
            className="btn-secondary"
            data-testid="detail-edit-link"
          >
            Edit
          </a>
        </div>
      </div>

      <section className="card space-y-4" data-testid="loan-history">
        <div className="flex items-center justify-between">
          <h2>Loan History</h2>
          <p className="text-sm text-gray-500" data-testid="loan-history-count">
            {totalLoans} loan(s) on record
          </p>
        </div>

        {totalLoans === 0 ? (
          <p
            className="text-sm text-gray-400 italic py-8 text-center"
            data-testid="loan-history-empty"
          >
            This member has no loan history yet.
          </p>
        ) : (
          <>
            <div className="overflow-hidden">
              <table
                className="min-w-full divide-y divide-gray-200 text-sm"
                data-testid="loan-history-table"
              >
                <thead className="bg-gray-50">
                  <tr>
                    {['Book', 'Borrowed', 'Due', 'Returned', 'Status'].map((h) => (
                      <th
                        key={h}
                        className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {pagedLoans.map((loan) => (
                    <tr key={loan.id} data-testid="loan-row">
                      <td
                        className="px-3 py-2 font-mono text-xs text-gray-700"
                        data-testid="loan-cell-book"
                      >
                        <a
                          href={`/books/${loan.bookId}`}
                          className="hover:text-brand-600"
                        >
                          {loan.bookId.slice(0, 8)}…
                        </a>
                      </td>
                      <td className="px-3 py-2 text-gray-600">
                        {new Date(loan.borrowedAt).toLocaleDateString()}
                      </td>
                      <td className="px-3 py-2 text-gray-600">
                        {new Date(loan.dueAt).toLocaleDateString()}
                      </td>
                      <td className="px-3 py-2 text-gray-500">
                        {loan.returnedAt
                          ? new Date(loan.returnedAt).toLocaleDateString()
                          : '—'}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={LOAN_BADGE[loan.status]}
                          data-testid="loan-status-badge"
                        >
                          {loan.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 ? (
              <nav
                className="flex justify-center gap-2"
                data-testid="loan-history-pagination"
                aria-label="Loan history pagination"
              >
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <a
                    key={p}
                    href={`/members/${member.id}?page=${p}`}
                    className={`px-3 py-1 rounded text-sm font-medium ${
                      p === loanPage
                        ? 'bg-brand-600 text-white'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {p}
                  </a>
                ))}
              </nav>
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}
