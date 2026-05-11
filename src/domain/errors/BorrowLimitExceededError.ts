import { DomainError } from './DomainError';

/**
 * Thrown when a member has reached the maximum number of concurrent active loans.
 */
export class BorrowLimitExceededError extends DomainError {
  readonly code = 'BORROW_LIMIT_EXCEEDED';

  constructor(memberId: string, limit: number) {
    super(`Member "${memberId}" has reached the borrow limit of ${limit} books.`);
  }
}
