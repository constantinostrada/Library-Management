import { DomainError } from './DomainError';

/**
 * Thrown when a requested book does not exist in the library catalogue.
 */
export class BookNotFoundError extends DomainError {
  readonly code = 'BOOK_NOT_FOUND';

  constructor(identifier: string) {
    super(`Book not found: "${identifier}"`);
  }
}
