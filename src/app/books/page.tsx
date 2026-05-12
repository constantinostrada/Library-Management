import type { Metadata } from 'next';

import { listBooksUseCase } from '@/infrastructure/container';

export const metadata: Metadata = { title: 'Books' };

export const dynamic = 'force-dynamic';

interface SearchParams {
  page?: string;
  limit?: string;
  title?: string;
  author?: string;
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export default async function BooksPage({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<JSX.Element> {
  const page = parsePositiveInt(searchParams.page, 1);
  const limit = parsePositiveInt(searchParams.limit, 20);
  const titleFilter = searchParams.title?.trim() ?? '';
  const authorFilter = searchParams.author?.trim() ?? '';

  const { books, total, totalPages } = await listBooksUseCase.execute({
    page,
    limit,
    title: titleFilter || undefined,
    author: authorFilter || undefined,
  });

  const hasFilters = titleFilter.length > 0 || authorFilter.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Book Catalogue</h1>
          <p className="mt-1 text-sm text-gray-500" data-testid="result-count">
            {total} book(s) in the library
            {hasFilters ? ' matching your filters' : ''}
          </p>
        </div>
        <a href="/books/new" className="btn-primary">
          + Add Book
        </a>
      </div>

      <form
        method="GET"
        action="/books"
        className="card flex flex-wrap items-end gap-3"
        data-testid="book-filters"
        role="search"
        aria-label="Filter books"
      >
        <div className="flex flex-col">
          <label htmlFor="filter-title" className="text-xs font-medium text-gray-500">
            Title
          </label>
          <input
            id="filter-title"
            name="title"
            type="text"
            defaultValue={titleFilter}
            placeholder="e.g. Clean Code"
            className="mt-1 rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <div className="flex flex-col">
          <label htmlFor="filter-author" className="text-xs font-medium text-gray-500">
            Author
          </label>
          <input
            id="filter-author"
            name="author"
            type="text"
            defaultValue={authorFilter}
            placeholder="e.g. Robert C. Martin"
            className="mt-1 rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <div className="flex gap-2">
          <button type="submit" className="btn-primary" data-testid="filter-submit">
            Search
          </button>
          {hasFilters ? (
            <a href="/books" className="btn-secondary" data-testid="filter-clear">
              Clear
            </a>
          ) : null}
        </div>
      </form>

      {books.length === 0 ? (
        <div className="card text-center py-16 text-gray-400" data-testid="empty-state">
          <p className="text-lg">
            {hasFilters
              ? 'No books match the current filters.'
              : 'No books in the catalogue yet.'}
          </p>
          {hasFilters ? (
            <a
              href="/books"
              className="mt-4 inline-block text-sm text-brand-600 hover:underline"
            >
              Clear filters →
            </a>
          ) : (
            <a
              href="/books/new"
              className="mt-4 inline-block text-sm text-brand-600 hover:underline"
            >
              Add the first book →
            </a>
          )}
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="min-w-full divide-y divide-gray-200 text-sm" data-testid="books-table">
            <thead className="bg-gray-50">
              <tr>
                {['ISBN', 'Title', 'Author', 'Total Copies', 'Available', 'Published'].map((h) => (
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
              {books.map((book) => {
                const isAvailable = book.availableCopies > 0;
                const isLow = isAvailable && book.availableCopies <= Math.max(1, Math.floor(book.totalCopies * 0.25));
                const badgeClass = !isAvailable
                  ? 'badge-red'
                  : isLow
                    ? 'badge-yellow'
                    : 'badge-green';
                return (
                  <tr key={book.id} className="hover:bg-gray-50" data-testid="book-row">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500" data-testid="cell-isbn">
                      {book.isbn}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900" data-testid="cell-title">
                      <a href={`/books/${book.id}`} className="hover:text-brand-600">
                        {book.title}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-gray-600" data-testid="cell-author">
                      {book.author}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700" data-testid="cell-total">
                      {book.totalCopies}
                    </td>
                    <td className="px-4 py-3 text-center" data-testid="cell-availability">
                      <span
                        className={badgeClass}
                        data-testid="availability-badge"
                        aria-label={`${book.availableCopies} of ${book.totalCopies} copies available`}
                      >
                        {book.availableCopies} / {book.totalCopies}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(book.publishedAt).getFullYear()}
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
            if (titleFilter) params.set('title', titleFilter);
            if (authorFilter) params.set('author', authorFilter);
            return (
              <a
                key={p}
                href={`/books?${params.toString()}`}
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
