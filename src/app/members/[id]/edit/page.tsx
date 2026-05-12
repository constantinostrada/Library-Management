import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import { MemberNotFoundError } from '@/domain/errors/MemberNotFoundError';
import { MemberForm } from '@/components/MemberForm';
import { getMemberUseCase } from '@/infrastructure/container';

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const member = await getMemberUseCase.execute({ id: params.id });
    return { title: `Edit ${member.name}` };
  } catch {
    return { title: 'Member Not Found' };
  }
}

export default async function EditMemberPage({ params }: Props): Promise<JSX.Element> {
  let member;
  try {
    member = await getMemberUseCase.execute({ id: params.id });
  } catch (error) {
    if (error instanceof MemberNotFoundError) notFound();
    throw error;
  }

  return (
    <div className="space-y-6 max-w-xl" data-testid="member-form-page">
      <div>
        <a href={`/members/${member.id}`} className="text-sm text-brand-600 hover:underline">
          ← Back to member
        </a>
      </div>
      <div>
        <h1>Edit Member</h1>
        <p
          className="mt-1 text-sm text-gray-500"
          data-testid="edit-page-subtitle"
        >
          Editing <strong>{member.name}</strong>.
        </p>
      </div>
      <MemberForm
        mode="edit"
        memberId={member.id}
        defaultValues={{ email: member.email, name: member.name }}
      />
    </div>
  );
}
