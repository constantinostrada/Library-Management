import type { Metadata } from 'next';

import { listLoansUseCase } from '@/infrastructure/container';

export const metadata: Metadata = { title: 'Loans' };
export const dynamic = 'force-dynamic';

interface SearchParams {
  page?: string;
}

const statusBadge: Record<string, string> = {
  ACTIVE: 'badge-green',
  RETURNED: 'badge-gray',
  OVERDUE: 'badge-red',
};

/**
 * Loans list page.
 */
export default async function LoansPage({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<JSX.Element> {
  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10) || 1);
  const limit = 20;

  const { loans, total, totalPages } = await listLoansUseCase.execute({ page, limit });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Loans</h1>
          <p className="mt-1 text-sm text-gray-500">{total} loan record(s)</p>
        </div>
        <a href="/loans/new" className="btn-primary">
          + New Loan
        </a>
      </div>

      {loans.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <p className="text-lg">No loans have been created yet.</p>
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Book ID', 'Member ID', 'Borrowed', 'Due', 'Returned', 'Status'].map((h) => (
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
              {loans.map((loan) => (
                <tr key={loan.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-700">
                    {loan.bookId.slice(0, 8)}…
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-700">
                    {loan.memberId.slice(0, 8)}…
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {new Date(loan.borrowedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {new Date(loan.dueAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {loan.returnedAt ? new Date(loan.returnedAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={statusBadge[loan.status] ?? 'badge-gray'}>
                      {loan.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <a
              key={p}
              href={`/loans?page=${p}`}
              className={`px-3 py-1 rounded text-sm font-medium ${
                p === page
                  ? 'bg-brand-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {p}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
