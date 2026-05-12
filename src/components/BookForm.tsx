'use client';

import { useState, type JSX } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';

import { bookFormSchema, normalizeISBN, type BookFormInput } from './bookFormSchema';
import { BookFormFeedback, type BookFormFeedbackState } from './BookFormFeedback';

export interface BookFormProps {
  mode: 'create' | 'edit';
  bookId?: string;
  defaultValues?: Partial<BookFormInput>;
}

type FieldErrorProps = { id: string; message?: string };

function FieldError({ id, message }: FieldErrorProps): JSX.Element | null {
  if (!message) return null;
  return (
    <span
      id={`${id}-error`}
      role="alert"
      data-testid={`error-${id}`}
      className="mt-1 text-xs text-red-600"
    >
      {message}
    </span>
  );
}

function buildCreateBody(values: BookFormInput): Record<string, unknown> {
  return {
    isbn: normalizeISBN(values.isbn),
    title: values.title.trim(),
    author: values.author.trim(),
    publisher: values.publisher.trim(),
    publishedAt: new Date(`${values.publishedAt}T00:00:00.000Z`).toISOString(),
    totalCopies: values.totalCopies,
  };
}

function buildUpdateBody(values: BookFormInput): Record<string, unknown> {
  return {
    title: values.title.trim(),
    author: values.author.trim(),
    publisher: values.publisher.trim(),
    totalCopies: values.totalCopies,
  };
}

export function BookForm({ mode, bookId, defaultValues }: BookFormProps): JSX.Element {
  const router = useRouter();
  const [feedback, setFeedback] = useState<{
    state: BookFormFeedbackState;
    message?: string;
  }>({ state: 'idle' });

  const initialValues = {
    isbn: defaultValues?.isbn ?? '',
    title: defaultValues?.title ?? '',
    author: defaultValues?.author ?? '',
    publisher: defaultValues?.publisher ?? '',
    publishedAt: defaultValues?.publishedAt ?? '',
    totalCopies: defaultValues?.totalCopies ?? 1,
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BookFormInput>({
    resolver: zodResolver(bookFormSchema),
    defaultValues: initialValues,
  });

  const onSubmit = async (values: BookFormInput): Promise<void> => {
    setFeedback({ state: 'submitting' });

    try {
      const url = mode === 'create' ? '/api/books' : `/api/books/${bookId}`;
      const method = mode === 'create' ? 'POST' : 'PUT';
      const body = mode === 'create' ? buildCreateBody(values) : buildUpdateBody(values);

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const payload = (await response
        .json()
        .catch(() => null)) as { success?: boolean; data?: { id?: string }; error?: string } | null;

      if (!response.ok || !payload?.success) {
        const message = payload?.error ?? `Request failed with status ${response.status}.`;
        setFeedback({ state: 'error', message });
        return;
      }

      const successMessage =
        mode === 'create' ? 'Book created successfully.' : 'Book updated successfully.';
      setFeedback({ state: 'success', message: successMessage });

      const destinationId = mode === 'create' ? payload.data?.id : bookId;
      if (destinationId) {
        router.push(`/books/${destinationId}`);
        router.refresh();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Network error.';
      setFeedback({ state: 'error', message });
    }
  };

  const isEdit = mode === 'edit';

  return (
    <form
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      className="card space-y-4"
      data-testid={`book-form-${mode}`}
      aria-label={isEdit ? 'Edit book' : 'Create book'}
    >
      <BookFormFeedback state={feedback.state} message={feedback.message} />

      <div className="flex flex-col">
        <label htmlFor="isbn" className="text-xs font-medium text-gray-500">
          ISBN
        </label>
        <input
          id="isbn"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder="e.g. 978-0-13-235088-4"
          readOnly={isEdit}
          aria-readonly={isEdit ? 'true' : undefined}
          aria-invalid={errors.isbn ? 'true' : undefined}
          aria-describedby={errors.isbn ? 'isbn-error' : undefined}
          defaultValue={initialValues.isbn}
          {...register('isbn')}
          className={`mt-1 rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 ${
            isEdit
              ? 'border-gray-200 bg-gray-50 text-gray-500'
              : 'border-gray-300 focus:border-brand-500 focus:ring-brand-500'
          }`}
        />
        {isEdit ? (
          <span className="mt-1 text-xs text-gray-400">
            ISBN is immutable once a book has been created.
          </span>
        ) : null}
        <FieldError id="isbn" message={errors.isbn?.message} />
      </div>

      <div className="flex flex-col">
        <label htmlFor="title" className="text-xs font-medium text-gray-500">
          Title
        </label>
        <input
          id="title"
          type="text"
          autoComplete="off"
          aria-invalid={errors.title ? 'true' : undefined}
          aria-describedby={errors.title ? 'title-error' : undefined}
          defaultValue={initialValues.title}
          {...register('title')}
          className="mt-1 rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        <FieldError id="title" message={errors.title?.message} />
      </div>

      <div className="flex flex-col">
        <label htmlFor="author" className="text-xs font-medium text-gray-500">
          Author
        </label>
        <input
          id="author"
          type="text"
          autoComplete="off"
          aria-invalid={errors.author ? 'true' : undefined}
          aria-describedby={errors.author ? 'author-error' : undefined}
          defaultValue={initialValues.author}
          {...register('author')}
          className="mt-1 rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        <FieldError id="author" message={errors.author?.message} />
      </div>

      <div className="flex flex-col">
        <label htmlFor="publisher" className="text-xs font-medium text-gray-500">
          Publisher
        </label>
        <input
          id="publisher"
          type="text"
          autoComplete="off"
          aria-invalid={errors.publisher ? 'true' : undefined}
          aria-describedby={errors.publisher ? 'publisher-error' : undefined}
          defaultValue={initialValues.publisher}
          {...register('publisher')}
          className="mt-1 rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        <FieldError id="publisher" message={errors.publisher?.message} />
      </div>

      <div className="flex flex-col">
        <label htmlFor="publishedAt" className="text-xs font-medium text-gray-500">
          Publication date
        </label>
        <input
          id="publishedAt"
          type="date"
          readOnly={isEdit}
          aria-readonly={isEdit ? 'true' : undefined}
          aria-invalid={errors.publishedAt ? 'true' : undefined}
          aria-describedby={errors.publishedAt ? 'publishedAt-error' : undefined}
          defaultValue={initialValues.publishedAt}
          {...register('publishedAt')}
          className={`mt-1 rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 ${
            isEdit
              ? 'border-gray-200 bg-gray-50 text-gray-500'
              : 'border-gray-300 focus:border-brand-500 focus:ring-brand-500'
          }`}
        />
        {isEdit ? (
          <span className="mt-1 text-xs text-gray-400">
            Publication date is immutable once a book has been created.
          </span>
        ) : null}
        <FieldError id="publishedAt" message={errors.publishedAt?.message} />
      </div>

      <div className="flex flex-col">
        <label htmlFor="totalCopies" className="text-xs font-medium text-gray-500">
          Total copies
        </label>
        <input
          id="totalCopies"
          type="number"
          min={1}
          max={10000}
          step={1}
          aria-invalid={errors.totalCopies ? 'true' : undefined}
          aria-describedby={errors.totalCopies ? 'totalCopies-error' : undefined}
          defaultValue={initialValues.totalCopies}
          {...register('totalCopies', { valueAsNumber: true })}
          className="mt-1 rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        <FieldError id="totalCopies" message={errors.totalCopies?.message} />
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          data-testid="book-form-submit"
          className="btn-primary disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create book'}
        </button>
        <a
          href={isEdit && bookId ? `/books/${bookId}` : '/books'}
          data-testid="book-form-cancel"
          className="text-sm text-gray-500 hover:text-gray-700 hover:underline"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}

export default BookForm;
