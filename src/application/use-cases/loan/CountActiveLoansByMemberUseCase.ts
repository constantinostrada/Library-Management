import { ILoanRepository } from '@/domain/repositories/ILoanRepository';

export interface CountActiveLoansByMemberDTO {
  memberIds: string[];
}

/**
 * Use Case: CountActiveLoansByMemberUseCase
 *
 * Returns a `{ [memberId]: activeLoanCount }` map for the supplied members.
 * "Active" means LoanStatus ∈ {ACTIVE, OVERDUE} — the same set already returned
 * by ILoanRepository.findActiveLoansByMemberId.
 *
 * Used by the /members listing page to decorate each row with the member's
 * current active-loan count.
 */
export class CountActiveLoansByMemberUseCase {
  constructor(private readonly loanRepository: ILoanRepository) {}

  async execute(dto: CountActiveLoansByMemberDTO): Promise<Record<string, number>> {
    if (dto.memberIds.length === 0) return {};

    const counts = await Promise.all(
      dto.memberIds.map(async (memberId) => {
        const loans = await this.loanRepository.findActiveLoansByMemberId(memberId);
        return [memberId, loans.length] as const;
      }),
    );

    return Object.fromEntries(counts);
  }
}
