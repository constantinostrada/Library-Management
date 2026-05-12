import { Loan } from '@/domain/entities/Loan';

import { LoanDTO } from '../dtos/LoanDTO';

/**
 * Mapper: LoanMapper
 *
 * `isOverdue` is derived presentation data — true when the loan has not been
 * returned and its due date precedes `now`. Computing it here keeps domain
 * entities pure: callers can choose the reference date (e.g. tests).
 */
export class LoanMapper {
  static toDTO(loan: Loan, now: Date = new Date()): LoanDTO {
    const isOverdue =
      loan.returnedAt === null && loan.dueAt.getTime() < now.getTime();

    return {
      id: loan.id,
      bookId: loan.bookId,
      memberId: loan.memberId,
      borrowedAt: loan.borrowedAt.toISOString(),
      dueAt: loan.dueAt.toISOString(),
      returnedAt: loan.returnedAt ? loan.returnedAt.toISOString() : null,
      status: loan.status,
      isOverdue,
    };
  }

  static toDTOList(loans: Loan[], now: Date = new Date()): LoanDTO[] {
    return loans.map((loan) => LoanMapper.toDTO(loan, now));
  }
}
