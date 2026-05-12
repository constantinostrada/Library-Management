import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import { getBookUseCase } from '@/infrastructure/container';
import { BookNotFoundError } from '@/domain/errors/BookNotFoundError';

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const book = await getBookUseCase.execute({ id: params.id });
    return { title: book.title };
  } catch {
    return { title: 'Book Not Found' };
  }
}

export default async function BookDetailPage({ params }: Props): Promise<JSX.Element> {
  let book;
  try {
    book = await getBookUseCase.execute({ id: params.id });
  } catch (error) {
    if (error instanceof BookNotFoundError) notFound();
    throw error;
  }

  const isAvailable = book.availableCopies > 0;
  const badgeClass = isAvailable ? 'badge-green' : 'badge-red';

  return (
    <div className="space-y-6 max-w-2xl" data-testid="book-detail">
      <div>
        <a href="/books" className="text-sm text-brand-600 hover:underline">
          ← Back to catalogue
        </a>
      </div>

      <div className="card space-y-4">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900" data-testid="detail-title">
            {book.title}
          </h1>
          <span
            className={badgeClass}
            data-testid="detail-availability-badge"
            aria-label={`${book.availableCopies} of ${book.totalCopies} copies available`}
          >
            {book.availableCopies} / {book.totalCopies} available
          </span>
        </div>

        <dl className="grid grid-cols-2 gap-4 text-sm">
          {[
            ['ISBN', book.isbn, 'detail-isbn'],
            ['Author', book.author, 'detail-author'],
            ['Publisher', book.publisher, 'detail-publisher'],
            ['Published', new Date(book.publishedAt).toLocaleDateString(), 'detail-published'],
            ['Total Copies', String(book.totalCopies), 'detail-total'],
            ['Available Copies', String(book.availableCopies), 'detail-available'],
            ['Added', new Date(book.createdAt).toLocaleDateString(), 'detail-added'],
            ['Last Updated', new Date(book.updatedAt).toLocaleDateString(), 'detail-updated'],
          ].map(([label, value, testId]) => (
            <div key={label}>
              <dt className="font-medium text-gray-500">{label}</dt>
              <dd className="mt-1 text-gray-900" data-testid={testId}>
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
