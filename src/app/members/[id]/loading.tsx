export default function MemberDetailLoading(): JSX.Element {
  return (
    <div
      className="space-y-6 max-w-3xl"
      data-testid="member-detail-loading"
      role="status"
      aria-busy="true"
    >
      <span className="sr-only">Loading member…</span>

      <div className="h-4 w-32 animate-pulse rounded bg-gray-100" />

      <div className="card space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-64 animate-pulse rounded bg-gray-100" />
          </div>
          <div className="h-6 w-20 animate-pulse rounded-full bg-gray-100" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-24 animate-pulse rounded bg-gray-100" />
              <div className="h-4 w-40 animate-pulse rounded bg-gray-100" />
            </div>
          ))}
        </div>
        <div className="flex gap-2 pt-2">
          <div className="h-9 w-24 animate-pulse rounded bg-gray-100" />
          <div className="h-9 w-16 animate-pulse rounded bg-gray-100" />
        </div>
      </div>

      <div className="card space-y-3">
        <div className="h-6 w-32 animate-pulse rounded bg-gray-200" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-8 w-full animate-pulse rounded bg-gray-100" />
        ))}
      </div>
    </div>
  );
}
