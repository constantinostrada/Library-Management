import { DomainError } from './DomainError';

/**
 * Thrown when a specific loan record cannot be found.
 */
export class LoanNotFoundError extends DomainError {
  readonly code = 'LOAN_NOT_FOUND';

  constructor(loanId: string) {
    super(`Loan not found: "${loanId}"`);
  }
}
