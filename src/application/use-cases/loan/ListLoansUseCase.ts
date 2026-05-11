import { ILoanRepository } from '@/domain/repositories/ILoanRepository';

import { ListLoansDTO, PaginatedLoansDTO } from '../../dtos/LoanDTO';
import { LoanMapper } from '../../mappers/LoanMapper';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

/**
 * Use Case: ListLoansUseCase
 *
 * Returns a paginated list of all loans in the system.
 */
export class ListLoansUseCase {
  constructor(private readonly loanRepository: ILoanRepository) {}

  async execute(dto: ListLoansDTO): Promise<PaginatedLoansDTO> {
    const page = Math.max(1, dto.page ?? DEFAULT_PAGE);
    const limit = Math.min(100, Math.max(1, dto.limit ?? DEFAULT_LIMIT));

    const { loans, total } = await this.loanRepository.findAll(page, limit);

    return {
      loans: LoanMapper.toDTOList(loans),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
