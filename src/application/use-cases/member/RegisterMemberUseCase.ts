import { DomainError } from '@/domain/errors/DomainError';
import { Member } from '@/domain/entities/Member';
import { IMemberRepository } from '@/domain/repositories/IMemberRepository';

import { CreateMemberDTO, MemberDTO } from '../../dtos/MemberDTO';
import { MemberMapper } from '../../mappers/MemberMapper';

/**
 * Use Case: RegisterMemberUseCase
 *
 * Registers a new library member.
 * Ensures email uniqueness before persisting.
 */
export class RegisterMemberUseCase {
  constructor(private readonly memberRepository: IMemberRepository) {}

  async execute(dto: CreateMemberDTO): Promise<MemberDTO> {
    // 1. Guard: email must be unique
    const existing = await this.memberRepository.findByEmail(dto.email);
    if (existing) {
      throw new EmailAlreadyRegisteredError(dto.email);
    }

    // 2. Build entity (Email value object validates format)
    const member = Member.create({
      id: crypto.randomUUID(),
      email: dto.email,
      name: dto.name,
    });

    // 3. Persist
    const saved = await this.memberRepository.create(member);

    return MemberMapper.toDTO(saved);
  }
}

class EmailAlreadyRegisteredError extends DomainError {
  readonly code = 'EMAIL_ALREADY_REGISTERED';

  constructor(email: string) {
    super(`A member with email "${email}" is already registered.`);
  }
}
