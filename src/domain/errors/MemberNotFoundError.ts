import { DomainError } from './DomainError';

/**
 * Thrown when a requested library member does not exist.
 */
export class MemberNotFoundError extends DomainError {
  readonly code = 'MEMBER_NOT_FOUND';

  constructor(identifier: string) {
    super(`Member not found: "${identifier}"`);
  }
}
