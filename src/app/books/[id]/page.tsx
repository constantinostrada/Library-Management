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

/**
 * Book detail page.
 */
export default async function BookDetailPage({ params }: Props): Promise<JSX.Element> {
  let book;
  try {
    book = await getBookUseCase.execute({ id: params.id });
  } catch (error) {
    if (error instanceof BookNotFoundError) notFound();
    throw error;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <a href="/books" className="text-sm text-brand-600 hover:underline">
          ← Back to catalogue
        </a>
      </div>

      <div className="card space-y-4">
        <div className="flex items-start justify-between">
          <h1 className="text-2xl font-bold text-gray-900">{book.title}</h1>
          <span className={book.availableCopies > 0 ? 'badge-green' : 'badge-red'}>
            {book.availableCopies > 0 ? 'Available' : 'All on loan'}
          </span>
        </div>

        <dl className="grid grid-cols-2 gap-4 text-sm">
          {[
            ['Author', book.author],
            ['Publisher', book.publisher],
            ['ISBN', book.isbn],
            ['Published', new Date(book.publishedAt).toLocaleDateString()],
            ['Total Copies', String(book.totalCopies)],
            ['Available Copies', String(book.availableCopies)],
            ['Added', new Date(book.createdAt).toLocaleDateString()],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="font-medium text-gray-500">{label}</dt>
              <dd className="mt-1 text-gray-900">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
