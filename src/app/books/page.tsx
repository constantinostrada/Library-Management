import type { Metadata } from 'next';

import { listBooksUseCase } from '@/infrastructure/container';

export const metadata: Metadata = { title: 'Books' };

// Force dynamic rendering so pagination is always fresh
export const dynamic = 'force-dynamic';

interface SearchParams {
  page?: string;
  limit?: string;
}

/**
 * Books catalogue page.
 *
 * Server Component — fetches data directly via the use case (no fetch needed
 * because we are already on the server). In a real app you might choose
 * to call the API route instead, but calling the use case directly here
 * keeps the same clean-architecture contract and avoids an unnecessary HTTP hop.
 */
export default async function BooksPage({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<JSX.Element> {
  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10) || 1);
  const limit = 20;

  const { books, total, totalPages } = await listBooksUseCase.execute({ page, limit });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Book Catalogue</h1>
          <p className="mt-1 text-sm text-gray-500">{total} book(s) in the library</p>
        </div>
        <a href="/books/new" className="btn-primary">
          + Add Book
        </a>
      </div>

      {books.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <p className="text-lg">No books in the catalogue yet.</p>
          <a href="/books/new" className="mt-4 inline-block text-sm text-brand-600 hover:underline">
            Add the first book →
          </a>
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Title', 'Author', 'ISBN', 'Copies', 'Available', 'Published'].map((h) => (
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
              {books.map((book) => (
                <tr key={book.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    <a href={`/books/${book.id}`} className="hover:text-brand-600">
                      {book.title}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{book.author}</td>
                  <td className="px-4 py-3 font-mono text-gray-500 text-xs">{book.isbn}</td>
                  <td className="px-4 py-3 text-center text-gray-700">{book.totalCopies}</td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={book.availableCopies > 0 ? 'badge-green' : 'badge-red'}
                    >
                      {book.availableCopies}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(book.publishedAt).getFullYear()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <a
              key={p}
              href={`/books?page=${p}`}
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
