import { ILoanRepository } from '@/domain/repositories/ILoanRepository';

import { ListLoansDTO, PaginatedLoansDTO } from '../../dtos/LoanDTO';
import { LoanMapper } from '../../mappers/LoanMapper';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

/**
 * Use Case: ListLoansUseCase
 *
 * Returns a paginated list of loans, optionally filtered by member and/or
 * logical status (active / returned / overdue). Each loan in the response
 * carries an `isOverdue` flag computed against `now`.
 */
export class ListLoansUseCase {
  constructor(private readonly loanRepository: ILoanRepository) {}

  async execute(dto: ListLoansDTO): Promise<PaginatedLoansDTO> {
    const page = Math.max(1, dto.page ?? DEFAULT_PAGE);
    const limit = Math.min(100, Math.max(1, dto.limit ?? DEFAULT_LIMIT));
    const now = new Date();

    const { loans, total } = await this.loanRepository.findAll({
      page,
      limit,
      memberId: dto.memberId,
      status: dto.status,
      now,
    });

    return {
      loans: LoanMapper.toDTOList(loans, now),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
