import type { Metadata } from 'next';
import type { JSX } from 'react';

import { BookForm } from '@/components/BookForm';

export const metadata: Metadata = { title: 'Add Book' };

export const dynamic = 'force-dynamic';

export default function NewBookPage(): JSX.Element {
  return (
    <div className="space-y-6 max-w-2xl" data-testid="book-form-page">
      <div>
        <a href="/books" className="text-sm text-brand-600 hover:underline">
          ← Back to catalogue
        </a>
      </div>

      <div>
        <h1>Add Book</h1>
        <p className="mt-1 text-sm text-gray-500">
          Add a new title to the library catalogue.
        </p>
      </div>

      <BookForm mode="create" />
    </div>
  );
}
