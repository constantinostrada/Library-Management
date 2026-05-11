'use client';

import { useEffect } from 'react';

/**
 * Global error boundary.
 * Must be a Client Component so it can capture errors thrown during rendering.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): JSX.Element {
  useEffect(() => {
    // Log to an error reporting service in production
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
      <p className="text-8xl font-black text-red-100">500</p>
      <h2 className="text-2xl font-bold text-gray-800">Something went wrong</h2>
      <p className="text-gray-500 max-w-sm">
        An unexpected error occurred. Please try again or contact support.
      </p>
      <button onClick={reset} className="btn-primary mt-4">
        Try Again
      </button>
    </div>
  );
}
