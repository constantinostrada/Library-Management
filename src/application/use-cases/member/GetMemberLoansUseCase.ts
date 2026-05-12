import { MemberNotFoundError } from '@/domain/errors/MemberNotFoundError';
import { ILoanRepository } from '@/domain/repositories/ILoanRepository';
import { IMemberRepository } from '@/domain/repositories/IMemberRepository';

import { LoanDTO } from '../../dtos/LoanDTO';
import { LoanMapper } from '../../mappers/LoanMapper';

export interface GetMemberLoansDTO {
  memberId: string;
}

export interface MemberLoanHistoryDTO {
  memberId: string;
  total: number;
  loans: LoanDTO[];
}

/**
 * Use Case: GetMemberLoansUseCase
 *
 * Returns the full loan history (active, returned, overdue) for a member.
 * The member must exist, otherwise throws MemberNotFoundError.
 */
export class GetMemberLoansUseCase {
  constructor(
    private readonly memberRepository: IMemberRepository,
    private readonly loanRepository: ILoanRepository,
  ) {}

  async execute(dto: GetMemberLoansDTO): Promise<MemberLoanHistoryDTO> {
    const member = await this.memberRepository.findById(dto.memberId);
    if (!member) {
      throw new MemberNotFoundError(dto.memberId);
    }

    const loans = await this.loanRepository.findLoansByMemberId(dto.memberId);
    const dtos = LoanMapper.toDTOList(loans);

    return {
      memberId: member.id,
      total: dtos.length,
      loans: dtos,
    };
  }
}
