import { IBookRepository } from '@/domain/repositories/IBookRepository';
import { ILoanRepository } from '@/domain/repositories/ILoanRepository';
import { IMemberRepository } from '@/domain/repositories/IMemberRepository';
import {
  CanBorrowResult,
  LoanEligibilityService,
} from '@/domain/services/LoanEligibilityService';

export interface CanBorrowDTO {
  memberId: string;
  bookId: string;
}

export type CanBorrowDecision =
  | { allowed: true }
  | {
      allowed: false;
      reason:
        | { code: 'MEMBER_NOT_FOUND'; message: string }
        | { code: 'BOOK_NOT_FOUND'; message: string }
        | { code: 'MEMBER_SUSPENDED'; message: string }
        | { code: 'NO_COPIES_AVAILABLE'; message: string }
        | { code: 'BORROW_LIMIT_EXCEEDED'; message: string };
    };

/**
 * Use Case: CanBorrowUseCase
 *
 * Non-throwing pre-flight check that validates whether a member is eligible
 * to borrow a specific book. Returns a structured result describing the
 * decision along with the reason for denial (if any).
 *
 * Rules validated (delegated to {@link LoanEligibilityService}):
 *   1. Member account must be ACTIVE (not SUSPENDED / CLOSED).
 *   2. Book must have available copies (totalCopies > activeLoanCount).
 *   3. Member's active loan count must be below the configured borrow limit.
 *
 * This use case is intended for UI hints, validations on a borrow form,
 * or admin tooling — the BorrowBookUseCase still enforces the same rules
 * at commit time via the throwing assertCanBorrow path.
 */
export class CanBorrowUseCase {
  constructor(
    private readonly bookRepository: IBookRepository,
    private readonly memberRepository: IMemberRepository,
    private readonly loanRepository: ILoanRepository,
    private readonly eligibilityService: LoanEligibilityService,
  ) {}

  async execute(dto: CanBorrowDTO): Promise<CanBorrowDecision> {
    const [member, book] = await Promise.all([
      this.memberRepository.findById(dto.memberId),
      this.bookRepository.findById(dto.bookId),
    ]);

    if (!member) {
      return {
        allowed: false,
        reason: {
          code: 'MEMBER_NOT_FOUND',
          message: `Member "${dto.memberId}" was not found.`,
        },
      };
    }

    if (!book) {
      return {
        allowed: false,
        reason: {
          code: 'BOOK_NOT_FOUND',
          message: `Book "${dto.bookId}" was not found.`,
        },
      };
    }

    const activeLoans = await this.loanRepository.findActiveLoansByMemberId(member.id);

    const result: CanBorrowResult = this.eligibilityService.check({
      member,
      book,
      currentActiveLoanCount: activeLoans.length,
    });

    return result;
  }
}
