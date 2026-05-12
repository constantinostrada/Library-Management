export type FormFeedbackState = 'idle' | 'submitting' | 'success' | 'error';

interface Props {
  state: FormFeedbackState;
  message?: string;
}

/**
 * Presentational feedback region for a form submission.
 * Renders nothing when idle.
 */
export function FormFeedback({ state, message }: Props): JSX.Element | null {
  if (state === 'idle') return null;

  if (state === 'error') {
    return (
      <div
        role="alert"
        data-testid="form-feedback-error"
        className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200"
      >
        {message ?? 'Something went wrong. Please try again.'}
      </div>
    );
  }

  return (
    <div
      role="status"
      data-testid={`form-feedback-${state}`}
      className="rounded-md bg-brand-50 px-4 py-3 text-sm text-brand-700 border border-brand-200"
    >
      {message ?? (state === 'submitting' ? 'Saving…' : 'Saved!')}
    </div>
  );
}
