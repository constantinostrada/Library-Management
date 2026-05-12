'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { FormFeedback, type FormFeedbackState } from './FormFeedback';
import { memberFormSchema, type MemberFormInput } from './memberFormSchema';

type Mode = 'create' | 'edit';

interface Props {
  mode: Mode;
  memberId?: string;
  defaultValues?: Partial<MemberFormInput>;
}

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: string;
}

type FieldErrors = Partial<Record<keyof MemberFormInput, string>>;

export function MemberForm({ mode, memberId, defaultValues }: Props): JSX.Element {
  const router = useRouter();
  const [values, setValues] = useState<MemberFormInput>({
    email: defaultValues?.email ?? '',
    name: defaultValues?.name ?? '',
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [state, setState] = useState<FormFeedbackState>('idle');
  const [feedbackMessage, setFeedbackMessage] = useState<string | undefined>();

  const setField = <K extends keyof MemberFormInput>(key: K, value: MemberFormInput[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsed = memberFormSchema.safeParse(values);
    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof MemberFormInput | undefined;
        if (key && !next[key]) next[key] = issue.message;
      }
      setErrors(next);
      setState('idle');
      setFeedbackMessage(undefined);
      return;
    }

    setErrors({});
    setState('submitting');
    setFeedbackMessage(undefined);

    try {
      const url = mode === 'create' ? '/api/members' : `/api/members/${memberId}`;
      const method = mode === 'create' ? 'POST' : 'PUT';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });

      const payload = (await response.json().catch(() => ({}))) as ApiEnvelope<{
        id: string;
      }>;

      if (!response.ok || !payload.success) {
        setState('error');
        setFeedbackMessage(payload.error ?? `Request failed with status ${response.status}.`);
        return;
      }

      setState('success');
      setFeedbackMessage(mode === 'create' ? 'Member registered.' : 'Member updated.');
      const destinationId = mode === 'create' ? payload.data?.id : memberId;
      if (destinationId) {
        router.push(`/members/${destinationId}`);
        router.refresh();
      }
    } catch (err) {
      setState('error');
      setFeedbackMessage(err instanceof Error ? err.message : 'Network error.');
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      data-testid="member-form"
      className="card space-y-4 max-w-xl"
    >
      <div>
        <label htmlFor="member-name" className="block text-sm font-medium text-gray-700">
          Name
        </label>
        <input
          id="member-name"
          name="name"
          type="text"
          required
          maxLength={300}
          value={values.name}
          onChange={(e) => setField('name', e.target.value)}
          aria-invalid={errors.name ? 'true' : 'false'}
          aria-describedby={errors.name ? 'member-name-error' : undefined}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        {errors.name ? (
          <p
            id="member-name-error"
            role="alert"
            data-testid="error-name"
            className="mt-1 text-xs text-red-600"
          >
            {errors.name}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="member-email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          id="member-email"
          name="email"
          type="email"
          required
          maxLength={320}
          value={values.email}
          onChange={(e) => setField('email', e.target.value)}
          aria-invalid={errors.email ? 'true' : 'false'}
          aria-describedby={errors.email ? 'member-email-error' : undefined}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        {errors.email ? (
          <p
            id="member-email-error"
            role="alert"
            data-testid="error-email"
            className="mt-1 text-xs text-red-600"
          >
            {errors.email}
          </p>
        ) : null}
      </div>

      <FormFeedback state={state} message={feedbackMessage} />

      <div className="flex gap-2">
        <button
          type="submit"
          className="btn-primary"
          disabled={state === 'submitting'}
          data-testid="member-form-submit"
        >
          {state === 'submitting'
            ? 'Saving…'
            : mode === 'create'
              ? 'Register Member'
              : 'Save Changes'}
        </button>
        <a
          href={mode === 'create' ? '/members' : `/members/${memberId}`}
          className="btn-secondary"
          data-testid="member-form-cancel"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
