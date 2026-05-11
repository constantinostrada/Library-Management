import { DomainError } from './DomainError';

/**
 * Thrown when a return is attempted on a loan that has already been returned.
 */
export class LoanAlreadyReturnedError extends DomainError {
  readonly code = 'LOAN_ALREADY_RETURNED';

  constructor(loanId: string) {
    super(`Loan "${loanId}" has already been returned.`);
  }
}
