import { DomainError } from './DomainError';

/**
 * Thrown when a suspended or closed member attempts to borrow a book.
 */
export class MemberSuspendedError extends DomainError {
  readonly code = 'MEMBER_SUSPENDED';

  constructor(memberId: string) {
    super(`Member "${memberId}" is not allowed to borrow books (account suspended or closed).`);
  }
}
