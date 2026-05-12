import { DomainError } from './DomainError';

/**
 * Thrown when a book deletion is attempted while one or more
 * loans for that book are still active (ACTIVE or OVERDUE).
 */
export class BookHasActiveLoansError extends DomainError {
  readonly code = 'BOOK_HAS_ACTIVE_LOANS';

  constructor(bookId: string, activeLoanCount: number) {
    super(
      `Cannot delete book "${bookId}": ${activeLoanCount} active loan(s) still reference it.`,
    );
  }
}
