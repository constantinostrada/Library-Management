import { BookNotFoundError } from '@/domain/errors/BookNotFoundError';
import { LoanAlreadyReturnedError } from '@/domain/errors/LoanAlreadyReturnedError';
import { LoanNotFoundError } from '@/domain/errors/LoanNotFoundError';
import { IBookRepository } from '@/domain/repositories/IBookRepository';
import { ILoanRepository } from '@/domain/repositories/ILoanRepository';

import { LoanDTO, ReturnBookDTO } from '../../dtos/LoanDTO';
import { LoanMapper } from '../../mappers/LoanMapper';

/**
 * Use Case: ReturnBookUseCase
 *
 * Processes a book return:
 *   1. Validate the loan exists and is not already returned.
 *   2. Mark the loan as returned.
 *   3. Decrement the book's active loan count.
 */
export class ReturnBookUseCase {
  constructor(
    private readonly loanRepository: ILoanRepository,
    private readonly bookRepository: IBookRepository,
  ) {}

  async execute(dto: ReturnBookDTO): Promise<LoanDTO> {
    // ── 1. Load the loan ────────────────────────────────────────────────────
    const loan = await this.loanRepository.findById(dto.loanId);

    if (!loan) throw new LoanNotFoundError(dto.loanId);

    // ── 2. Guard: cannot return a loan that is already returned ─────────────
    if (loan.isReturned) {
      throw new LoanAlreadyReturnedError(loan.id);
    }

    // ── 3. Load the book ────────────────────────────────────────────────────
    const book = await this.bookRepository.findById(loan.bookId);

    if (!book) throw new BookNotFoundError(loan.bookId);

    // ── 4. Apply domain behaviour ───────────────────────────────────────────
    loan.return();
    book.decrementActiveLoanCount();

    // ── 5. Persist both changes ─────────────────────────────────────────────
    const [updatedLoan] = await Promise.all([
      this.loanRepository.update(loan),
      this.bookRepository.update(book),
    ]);

    return LoanMapper.toDTO(updatedLoan);
  }
}
