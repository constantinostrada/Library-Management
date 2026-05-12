import type { JSX } from 'react';

export type BookFormFeedbackState = 'idle' | 'submitting' | 'success' | 'error';

interface Props {
  state: BookFormFeedbackState;
  message?: string;
}

export function BookFormFeedback({ state, message }: Props): JSX.Element | null {
  if (state === 'idle') return null;

  if (state === 'submitting') {
    return (
      <div
        role="status"
        aria-live="polite"
        data-testid="form-feedback-submitting"
        className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700"
      >
        Saving…
      </div>
    );
  }

  if (state === 'success') {
    return (
      <div
        role="status"
        aria-live="polite"
        data-testid="form-feedback-success"
        className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
      >
        {message ?? 'Book saved successfully.'}
      </div>
    );
  }

  return (
    <div
      role="alert"
      aria-live="assertive"
      data-testid="form-feedback-error"
      className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
    >
      {message ?? 'Something went wrong while saving. Please try again.'}
    </div>
  );
}

export default BookFormFeedback;
