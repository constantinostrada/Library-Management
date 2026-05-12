import { BookHasActiveLoansError } from '@/domain/errors/BookHasActiveLoansError';
import { BookNotFoundError } from '@/domain/errors/BookNotFoundError';
import { IBookRepository } from '@/domain/repositories/IBookRepository';
import { ILoanRepository } from '@/domain/repositories/ILoanRepository';

export interface DeleteBookDTO {
  id: string;
}

/**
 * Use Case: DeleteBookUseCase
 *
 * Removes a book from the catalogue, but only when no active loans
 * (status ACTIVE or OVERDUE) reference it. Historical RETURNED loans
 * are not consulted here — that constraint, if needed, is enforced by
 * the database FK (onDelete: Restrict).
 */
export class DeleteBookUseCase {
  constructor(
    private readonly bookRepository: IBookRepository,
    private readonly loanRepository: ILoanRepository,
  ) {}

  async execute(dto: DeleteBookDTO): Promise<void> {
    const book = await this.bookRepository.findById(dto.id);
    if (!book) {
      throw new BookNotFoundError(dto.id);
    }

    const loans = await this.loanRepository.findLoansByBookId(dto.id);
    const activeLoans = loans.filter(
      (l) => l.status === 'ACTIVE' || l.status === 'OVERDUE',
    );

    if (activeLoans.length > 0) {
      throw new BookHasActiveLoansError(dto.id, activeLoans.length);
    }

    await this.bookRepository.delete(dto.id);
  }
}
