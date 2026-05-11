import { Loan } from '@/domain/entities/Loan';

import { LoanDTO } from '../dtos/LoanDTO';

/**
 * Mapper: LoanMapper
 */
export class LoanMapper {
  static toDTO(loan: Loan): LoanDTO {
    return {
      id: loan.id,
      bookId: loan.bookId,
      memberId: loan.memberId,
      borrowedAt: loan.borrowedAt.toISOString(),
      dueAt: loan.dueAt.toISOString(),
      returnedAt: loan.returnedAt ? loan.returnedAt.toISOString() : null,
      status: loan.status,
    };
  }

  static toDTOList(loans: Loan[]): LoanDTO[] {
    return loans.map(LoanMapper.toDTO);
  }
}
