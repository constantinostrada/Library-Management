export default function BookDetailLoading(): JSX.Element {
  return (
    <div className="space-y-6 max-w-2xl" data-testid="book-detail-loading" role="status" aria-busy="true">
      <span className="sr-only">Loading book…</span>

      <div className="h-4 w-32 animate-pulse rounded bg-gray-100" />

      <div className="card space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="h-8 w-2/3 animate-pulse rounded bg-gray-200" />
          <div className="h-6 w-24 animate-pulse rounded-full bg-gray-100" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i}>
              <div className="h-3 w-20 animate-pulse rounded bg-gray-100" />
              <div className="mt-2 h-4 w-32 animate-pulse rounded bg-gray-200" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
