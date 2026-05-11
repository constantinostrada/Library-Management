import { DomainError } from './DomainError';

/**
 * Thrown when a borrow attempt is made on a book that has no available copies.
 */
export class NoCopiesAvailableError extends DomainError {
  readonly code = 'NO_COPIES_AVAILABLE';

  constructor(bookTitle: string) {
    super(`No copies available for: "${bookTitle}"`);
  }
}
