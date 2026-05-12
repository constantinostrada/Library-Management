import { DomainError } from '@/domain/errors/DomainError';
import { Member } from '@/domain/entities/Member';
import { MemberNotFoundError } from '@/domain/errors/MemberNotFoundError';
import { IMemberRepository } from '@/domain/repositories/IMemberRepository';

import { MemberDTO, UpdateMemberDTO } from '../../dtos/MemberDTO';
import { MemberMapper } from '../../mappers/MemberMapper';

/**
 * Use Case: UpdateMemberUseCase
 *
 * Updates a member's mutable attributes (name, email, status).
 * Re-validates email uniqueness when the email actually changes.
 */
export class UpdateMemberUseCase {
  constructor(private readonly memberRepository: IMemberRepository) {}

  async execute(dto: UpdateMemberDTO): Promise<MemberDTO> {
    const existing = await this.memberRepository.findById(dto.id);
    if (!existing) {
      throw new MemberNotFoundError(dto.id);
    }

    const nextEmail = dto.email ?? existing.email.value;
    const emailChanged = nextEmail.trim().toLowerCase() !== existing.email.value;

    if (emailChanged) {
      const clash = await this.memberRepository.findByEmail(nextEmail);
      if (clash && clash.id !== existing.id) {
        throw new EmailAlreadyRegisteredError(nextEmail);
      }
    }

    const rebuilt = Member.create({
      id: existing.id,
      email: nextEmail,
      name: dto.name ?? existing.name,
      status: dto.status ?? existing.status,
      createdAt: existing.createdAt,
    });

    const saved = await this.memberRepository.update(rebuilt);
    return MemberMapper.toDTO(saved);
  }
}

class EmailAlreadyRegisteredError extends DomainError {
  readonly code = 'EMAIL_ALREADY_REGISTERED';

  constructor(email: string) {
    super(`A member with email "${email}" is already registered.`);
  }
}
