import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import type { JSX } from 'react';

import { getBookUseCase } from '@/infrastructure/container';
import { BookNotFoundError } from '@/domain/errors/BookNotFoundError';
import { BookForm } from '@/components/BookForm';

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const book = await getBookUseCase.execute({ id: params.id });
    return { title: `Edit ${book.title}` };
  } catch {
    return { title: 'Edit Book' };
  }
}

export const dynamic = 'force-dynamic';

function toDateInputValue(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

export default async function BookEditPage({ params }: Props): Promise<JSX.Element> {
  let book;
  try {
    book = await getBookUseCase.execute({ id: params.id });
  } catch (error) {
    if (error instanceof BookNotFoundError) notFound();
    throw error;
  }

  return (
    <div className="space-y-6 max-w-2xl" data-testid="book-form-page">
      <div>
        <a href={`/books/${book.id}`} className="text-sm text-brand-600 hover:underline">
          ← Back to book
        </a>
      </div>

      <div>
        <h1>Edit Book</h1>
        <p className="mt-1 text-sm text-gray-500" data-testid="edit-page-subtitle">
          Editing <span className="font-medium text-gray-700">{book.title}</span>
        </p>
      </div>

      <BookForm
        mode="edit"
        bookId={book.id}
        defaultValues={{
          isbn: book.isbn,
          title: book.title,
          author: book.author,
          publisher: book.publisher,
          publishedAt: toDateInputValue(book.publishedAt),
          totalCopies: book.totalCopies,
        }}
      />
    </div>
  );
}
