import type { Metadata } from 'next';

import { listMembersUseCase } from '@/infrastructure/container';

export const metadata: Metadata = { title: 'Members' };
export const dynamic = 'force-dynamic';

interface SearchParams {
  page?: string;
}

const statusBadge: Record<string, string> = {
  ACTIVE: 'badge-green',
  SUSPENDED: 'badge-yellow',
  CLOSED: 'badge-gray',
};

/**
 * Members list page.
 */
export default async function MembersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<JSX.Element> {
  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10) || 1);
  const limit = 20;

  const { members, total, totalPages } = await listMembersUseCase.execute({ page, limit });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Members</h1>
          <p className="mt-1 text-sm text-gray-500">{total} registered member(s)</p>
        </div>
        <a href="/members/new" className="btn-primary">
          + Register Member
        </a>
      </div>

      {members.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <p className="text-lg">No members registered yet.</p>
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Name', 'Email', 'Status', 'Joined'].map((h) => (
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
              {members.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    <a href={`/members/${m.id}`} className="hover:text-brand-600">
                      {m.name}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{m.email}</td>
                  <td className="px-4 py-3">
                    <span className={statusBadge[m.status] ?? 'badge-gray'}>{m.status}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(m.createdAt).toLocaleDateString()}
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
              href={`/members?page=${p}`}
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
