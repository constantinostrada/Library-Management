import type { Metadata } from 'next';

import type { MemberStatusDTO } from '@/application/dtos/MemberDTO';
import { MemberStatusToggle } from '@/components/MemberStatusToggle';
import {
  countActiveLoansByMemberUseCase,
  listMembersUseCase,
} from '@/infrastructure/container';

export const metadata: Metadata = { title: 'Members' };
export const dynamic = 'force-dynamic';

interface SearchParams {
  page?: string;
  limit?: string;
  status?: string;
}

const VALID_STATUSES: ReadonlyArray<MemberStatusDTO> = ['ACTIVE', 'SUSPENDED', 'CLOSED'];

const STATUS_BADGE: Record<MemberStatusDTO, string> = {
  ACTIVE: 'badge-green',
  SUSPENDED: 'badge-red',
  CLOSED: 'badge-gray',
};

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseStatus(value: string | undefined): MemberStatusDTO | undefined {
  if (!value) return undefined;
  const upper = value.toUpperCase();
  return VALID_STATUSES.includes(upper as MemberStatusDTO)
    ? (upper as MemberStatusDTO)
    : undefined;
}

export default async function MembersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<JSX.Element> {
  const page = parsePositiveInt(searchParams.page, 1);
  const limit = parsePositiveInt(searchParams.limit, 20);
  const statusFilter = parseStatus(searchParams.status);

  const { members, total, totalPages } = await listMembersUseCase.execute({
    page,
    limit,
    status: statusFilter,
  });

  const activeLoanCounts = await countActiveLoansByMemberUseCase.execute({
    memberIds: members.map((m) => m.id),
  });

  const hasFilters = statusFilter !== undefined;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Members</h1>
          <p className="mt-1 text-sm text-gray-500" data-testid="result-count">
            {total} registered member(s){hasFilters ? ' matching your filters' : ''}
          </p>
        </div>
        <a href="/members/new" className="btn-primary">
          + Register Member
        </a>
      </div>

      <form
        method="GET"
        action="/members"
        className="card flex flex-wrap items-end gap-3"
        data-testid="member-filters"
        role="search"
        aria-label="Filter members"
      >
        <div className="flex flex-col">
          <label htmlFor="filter-status" className="text-xs font-medium text-gray-500">
            Status
          </label>
          <select
            id="filter-status"
            name="status"
            defaultValue={statusFilter ?? ''}
            className="mt-1 rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button type="submit" className="btn-primary" data-testid="filter-submit">
            Filter
          </button>
          {hasFilters ? (
            <a href="/members" className="btn-secondary" data-testid="filter-clear">
              Clear
            </a>
          ) : null}
        </div>
      </form>

      {members.length === 0 ? (
        <div className="card text-center py-16 text-gray-400" data-testid="empty-state">
          <p className="text-lg">
            {hasFilters
              ? 'No members match the current filter.'
              : 'No members registered yet.'}
          </p>
          {hasFilters ? (
            <a
              href="/members"
              className="mt-4 inline-block text-sm text-brand-600 hover:underline"
            >
              Clear filter →
            </a>
          ) : (
            <a
              href="/members/new"
              className="mt-4 inline-block text-sm text-brand-600 hover:underline"
            >
              Register the first member →
            </a>
          )}
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <table
            className="min-w-full divide-y divide-gray-200 text-sm"
            data-testid="members-table"
          >
            <thead className="bg-gray-50">
              <tr>
                {['Name', 'Email', 'Status', 'Active Loans', 'Actions'].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {members.map((m) => {
                const badgeClass = STATUS_BADGE[m.status];
                const activeLoans = activeLoanCounts[m.id] ?? 0;
                return (
                  <tr key={m.id} className="hover:bg-gray-50" data-testid="member-row">
                    <td
                      className="px-4 py-3 font-medium text-gray-900"
                      data-testid="cell-name"
                    >
                      <a href={`/members/${m.id}`} className="hover:text-brand-600">
                        {m.name}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-gray-600" data-testid="cell-email">
                      {m.email}
                    </td>
                    <td className="px-4 py-3" data-testid="cell-status">
                      <span
                        className={badgeClass}
                        data-testid="status-badge"
                        data-status={m.status}
                      >
                        {m.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700" data-testid="cell-active-loans">
                      <span aria-label={`${activeLoans} active loan(s)`}>{activeLoans}</span>
                    </td>
                    <td className="px-4 py-3" data-testid="cell-actions">
                      <MemberStatusToggle memberId={m.id} currentStatus={m.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2" data-testid="pagination">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
            const params = new URLSearchParams();
            params.set('page', String(p));
            if (statusFilter) params.set('status', statusFilter);
            return (
              <a
                key={p}
                href={`/members?${params.toString()}`}
                className={`px-3 py-1 rounded text-sm font-medium ${
                  p === page
                    ? 'bg-brand-600 text-white'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {p}
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
