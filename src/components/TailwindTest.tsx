import type { JSX } from 'react';

export interface TailwindTestProps {
  label?: string;
}

export function TailwindTest({ label = 'Tailwind is working' }: TailwindTestProps): JSX.Element {
  return (
    <div
      data-testid="tailwind-test"
      className="rounded-lg border border-brand-200 bg-brand-50 p-4 text-center text-brand-800"
    >
      <p className="text-base font-semibold">{label}</p>
      <p className="mt-1 text-xs text-brand-600">Styled with Tailwind utility classes.</p>
    </div>
  );
}
