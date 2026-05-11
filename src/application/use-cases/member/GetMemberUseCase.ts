import { MemberNotFoundError } from '@/domain/errors/MemberNotFoundError';
import { IMemberRepository } from '@/domain/repositories/IMemberRepository';

import { MemberDTO } from '../../dtos/MemberDTO';
import { MemberMapper } from '../../mappers/MemberMapper';

export interface GetMemberDTO {
  id: string;
}

/**
 * Use Case: GetMemberUseCase
 *
 * Retrieves a single member by their surrogate ID.
 */
export class GetMemberUseCase {
  constructor(private readonly memberRepository: IMemberRepository) {}

  async execute(dto: GetMemberDTO): Promise<MemberDTO> {
    const member = await this.memberRepository.findById(dto.id);

    if (!member) {
      throw new MemberNotFoundError(dto.id);
    }

    return MemberMapper.toDTO(member);
  }
}
