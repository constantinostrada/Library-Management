import type { Metadata } from 'next';

import { MemberForm } from '@/components/MemberForm';

export const metadata: Metadata = { title: 'Register Member' };

export default function NewMemberPage(): JSX.Element {
  return (
    <div className="space-y-6 max-w-xl" data-testid="member-form-page">
      <div>
        <a href="/members" className="text-sm text-brand-600 hover:underline">
          ← Back to members
        </a>
      </div>
      <div>
        <h1>Register New Member</h1>
        <p className="mt-1 text-sm text-gray-500">
          Create a new library member account.
        </p>
      </div>
      <MemberForm mode="create" />
    </div>
  );
}
