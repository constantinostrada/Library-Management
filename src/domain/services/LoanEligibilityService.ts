import { BorrowLimitExceededError } from '../errors/BorrowLimitExceededError';
import { MemberSuspendedError } from '../errors/MemberSuspendedError';
import { NoCopiesAvailableError } from '../errors/NoCopiesAvailableError';
import { Book } from '../entities/Book';
import { Member } from '../entities/Member';

/**
 * Reason returned by {@link LoanEligibilityService.check} when a borrow is denied.
 * `code` is the stable machine-readable identifier (matches the corresponding
 * DomainError subclasses); `message` is the human-readable explanation.
 */
export type CanBorrowDenialReason =
  | { code: 'MEMBER_SUSPENDED'; message: string }
  | { code: 'NO_COPIES_AVAILABLE'; message: string }
  | { code: 'BORROW_LIMIT_EXCEEDED'; message: string };

export type CanBorrowResult =
  | { allowed: true }
  | { allowed: false; reason: CanBorrowDenialReason };

/**
 * Domain Service: LoanEligibilityService
 *
 * Encapsulates the business rules that govern whether a borrow operation
 * is permitted. This logic spans two entities (Book + Member) and therefore
 * doesn't belong inside either entity class.
 */
export class LoanEligibilityService {
  constructor(private readonly maxBooksPerMember: number = 3) {}

  get borrowLimit(): number {
    return this.maxBooksPerMember;
  }

  /**
   * Non-throwing variant. Returns a structured result describing whether
   * the borrow is allowed and, if not, the reason (with code + message).
   *
   * Rules checked in order:
   *   1. Member account must be ACTIVE.
   *   2. At least one copy of the book must be available.
   *   3. The member must not have reached the concurrent borrow limit.
   */
  check(params: {
    member: Member;
    book: Book;
    currentActiveLoanCount: number;
  }): CanBorrowResult {
    const { member, book, currentActiveLoanCount } = params;

    if (!member.canBorrow) {
      return {
        allowed: false,
        reason: {
          code: 'MEMBER_SUSPENDED',
          message: `Member "${member.id}" is not allowed to borrow books (account suspended or closed).`,
        },
      };
    }

    if (!book.isAvailable) {
      return {
        allowed: false,
        reason: {
          code: 'NO_COPIES_AVAILABLE',
          message: `No copies available for: "${book.title}"`,
        },
      };
    }

    if (currentActiveLoanCount >= this.maxBooksPerMember) {
      return {
        allowed: false,
        reason: {
          code: 'BORROW_LIMIT_EXCEEDED',
          message: `Member "${member.id}" has reached the borrow limit of ${this.maxBooksPerMember} books.`,
        },
      };
    }

    return { allowed: true };
  }

  /**
   * Throws a domain error if any eligibility rule is violated.
   * Used by the borrow flow where a denial must abort the operation.
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
