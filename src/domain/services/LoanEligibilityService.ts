import { BorrowLimitExceededError } from '../errors/BorrowLimitExceededError';
import { MemberSuspendedError } from '../errors/MemberSuspendedError';
import { NoCopiesAvailableError } from '../errors/NoCopiesAvailableError';
import { Book } from '../entities/Book';
import { Member } from '../entities/Member';

/**
 * Domain Service: LoanEligibilityService
 *
 * Encapsulates the business rules that govern whether a borrow operation
 * is permitted. This logic spans two entities (Book + Member) and therefore
 * doesn't belong inside either entity class.
 */
export class LoanEligibilityService {
  constructor(private readonly maxBooksPerMember: number = 5) {}

  /**
   * Throws a domain error if any eligibility rule is violated.
   *
   * Rules checked (in order):
   *   1. Member account must be ACTIVE.
   *   2. At least one copy of the book must be available.
   *   3. The member must not have reached the concurrent borrow limit.
   */
  assertCanBorrow(params: {
    member: Member;
    book: Book;
    currentActiveLoanCount: number;
  }): void {
    const { member, book, currentActiveLoanCount } = params;

    if (!member.canBorrow) {
      throw new MemberSuspendedError(member.id);
    }

    if (!book.isAvailable) {
      throw new NoCopiesAvailableError(book.title);
    }

    if (currentActiveLoanCount >= this.maxBooksPerMember) {
      throw new BorrowLimitExceededError(member.id, this.maxBooksPerMember);
    }
  }
}
