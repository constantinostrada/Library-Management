export default function BooksLoading(): JSX.Element {
  return (
    <div className="space-y-6" data-testid="books-loading" role="status" aria-busy="true">
      <span className="sr-only">Loading books…</span>

      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
          <div className="mt-2 h-4 w-32 animate-pulse rounded bg-gray-100" />
        </div>
        <div className="h-10 w-28 animate-pulse rounded bg-gray-200" />
      </div>

      <div className="card flex flex-wrap items-end gap-3">
        <div className="h-10 w-48 animate-pulse rounded bg-gray-100" />
        <div className="h-10 w-48 animate-pulse rounded bg-gray-100" />
        <div className="h-10 w-24 animate-pulse rounded bg-gray-200" />
      </div>

      <div className="card overflow-hidden p-0">
        <div className="divide-y divide-gray-100">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-4">
              <div className="h-4 w-32 animate-pulse rounded bg-gray-100" />
              <div className="h-4 flex-1 animate-pulse rounded bg-gray-100" />
              <div className="h-4 w-24 animate-pulse rounded bg-gray-100" />
              <div className="h-6 w-16 animate-pulse rounded-full bg-gray-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
