'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import type { MemberStatusDTO } from '@/application/dtos/MemberDTO';

interface Props {
  memberId: string;
  currentStatus: MemberStatusDTO;
  size?: 'sm' | 'md';
}

interface ApiEnvelope {
  success: boolean;
  error?: string;
}

/**
 * Button that toggles a member's status between ACTIVE and SUSPENDED via
 * PUT /api/members/[id]. CLOSED accounts can't be re-opened from the UI
 * (Member.reactivate() throws for CLOSED — see domain entity), so the
 * toggle renders nothing for them.
 */
export function MemberStatusToggle({
  memberId,
  currentStatus,
  size = 'sm',
}: Props): JSX.Element | null {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (currentStatus === 'CLOSED') return null;

  const nextStatus: MemberStatusDTO = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
  const label = currentStatus === 'ACTIVE' ? 'Suspend' : 'Activate';

  async function handleClick() {
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`/api/members/${memberId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const payload = (await response.json().catch(() => ({}))) as ApiEnvelope;
      if (!response.ok || !payload.success) {
        setError(payload.error ?? `Request failed with status ${response.status}.`);
        setSubmitting(false);
        return;
      }
      router.refresh();
      setSubmitting(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error.');
      setSubmitting(false);
    }
  }

  const baseClass =
    size === 'md'
      ? 'inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium border transition-colors disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-offset-1'
      : 'inline-flex items-center justify-center rounded px-2 py-1 text-xs font-medium border transition-colors disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-offset-1';
  const themeClass =
    currentStatus === 'ACTIVE'
      ? 'border-red-200 bg-white text-red-700 hover:bg-red-50 focus:ring-red-500'
      : 'border-green-200 bg-white text-green-700 hover:bg-green-50 focus:ring-green-500';

  return (
    <div className="inline-flex flex-col items-start gap-1" data-testid="member-status-toggle">
      <button
        type="button"
        onClick={handleClick}
        disabled={submitting}
        aria-label={`${label} member ${memberId}`}
        data-testid="member-status-toggle-button"
        data-next-status={nextStatus}
        className={`${baseClass} ${themeClass}`}
      >
        {submitting ? '…' : label}
      </button>
      {error ? (
        <span role="alert" data-testid="member-status-toggle-error" className="text-xs text-red-600">
          {error}
        </span>
      ) : null}
    </div>
  );
}
