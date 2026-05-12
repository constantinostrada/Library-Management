'use client';

import { useEffect } from 'react';

export default function BooksError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): JSX.Element {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      className="card text-center py-16 space-y-4"
      data-testid="books-error"
      role="alert"
    >
      <h2 className="text-xl font-bold text-gray-800">Could not load books</h2>
      <p className="text-gray-500 max-w-md mx-auto">
        Something went wrong while fetching the catalogue. Please try again.
      </p>
      <div className="flex justify-center gap-2">
        <button onClick={reset} className="btn-primary">
          Try Again
        </button>
        <a href="/" className="btn-secondary">
          Go Home
        </a>
      </div>
    </div>
  );
}
