import { Loan } from '@/domain/entities/Loan';
import { BookNotFoundError } from '@/domain/errors/BookNotFoundError';
import { MemberNotFoundError } from '@/domain/errors/MemberNotFoundError';
import { IBookRepository } from '@/domain/repositories/IBookRepository';
import { ILoanRepository } from '@/domain/repositories/ILoanRepository';
import { IMemberRepository } from '@/domain/repositories/IMemberRepository';
import { LoanEligibilityService } from '@/domain/services/LoanEligibilityService';
import { LoanDuration } from '@/domain/value-objects/LoanDuration';

import { BorrowBookDTO, LoanDTO } from '../../dtos/LoanDTO';
import { LoanMapper } from '../../mappers/LoanMapper';

/**
 * Use Case: BorrowBookUseCase
 *
 * Orchestrates the full "borrow a book" workflow:
 *   1. Resolve member and book from repositories.
 *   2. Delegate eligibility checks to the domain service.
 *   3. Create the Loan entity and persist it.
 *   4. Update the book's active loan count.
 *
 * This use case is the primary write path for the lending feature.
 */
export class BorrowBookUseCase {
  constructor(
    private readonly bookRepository: IBookRepository,
    private readonly memberRepository: IMemberRepository,
    private readonly loanRepository: ILoanRepository,
    private readonly eligibilityService: LoanEligibilityService,
  ) {}

  async execute(dto: BorrowBookDTO): Promise<LoanDTO> {
    // ── 1. Load aggregates ──────────────────────────────────────────────────
    const [member, book] = await Promise.all([
      this.memberRepository.findById(dto.memberId),
      this.bookRepository.findById(dto.bookId),
    ]);

    if (!member) throw new MemberNotFoundError(dto.memberId);
    if (!book) throw new BookNotFoundError(dto.bookId);

    // ── 2. Load current loan count for the member ───────────────────────────
    const activeLoans = await this.loanRepository.findActiveLoansByMemberId(member.id);

    // ── 3. Eligibility check (domain service enforces rules) ────────────────
    this.eligibilityService.assertCanBorrow({
      member,
      book,
      currentActiveLoanCount: activeLoans.length,
    });

    // ── 4. Compute due date ─────────────────────────────────────────────────
    const duration =
      dto.loanDurationDays !== undefined
        ? LoanDuration.create(dto.loanDurationDays)
        : LoanDuration.default();

    const borrowedAt = new Date();
    const dueAt = duration.dueDate(borrowedAt);

    // ── 5. Create the loan entity ───────────────────────────────────────────
    const loan = Loan.create({
      id: crypto.randomUUID(),
      bookId: book.id,
      memberId: member.id,
      borrowedAt,
      dueAt,
    });

    // ── 6. Update book copy count ───────────────────────────────────────────
    book.incrementActiveLoanCount();

    // ── 7. Persist both (loan creation + book update) ───────────────────────
    const [savedLoan] = await Promise.all([
      this.loanRepository.create(loan),
      this.bookRepository.update(book),
    ]);

    return LoanMapper.toDTO(savedLoan);
  }
}
