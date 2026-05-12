import { Loan } from '../entities/Loan';

/**
 * Logical loan status filter used by ILoanRepository.findAll.
 *
 *  - active   = currently borrowed AND not overdue (dueAt >= now)
 *  - returned = already returned
 *  - overdue  = not returned AND dueAt < now (whether status is ACTIVE or OVERDUE)
 */
export type LoanStatusFilter = 'active' | 'returned' | 'overdue';

export interface ListLoansCriteria {
  page: number;
  limit: number;
  memberId?: string;
  status?: LoanStatusFilter;
  /** Reference date for overdue computation. Defaults to the implementation's now. */
  now?: Date;
}

/**
 * Repository Interface: ILoanRepository
 *
 * Defines the persistence contract for loan records.
 */
export interface ILoanRepository {
  /** Finds a loan by its surrogate ID. Returns null if not found. */
  findById(id: string): Promise<Loan | null>;

  /** Returns all active (non-returned) loans for a given member. */
  findActiveLoansByMemberId(memberId: string): Promise<Loan[]>;

  /** Returns the full loan history (active + returned + overdue) for a given member, newest first. */
  findLoansByMemberId(memberId: string): Promise<Loan[]>;

  /** Returns all loans (active and returned) for a given book. */
  findLoansByBookId(bookId: string): Promise<Loan[]>;

  /** Returns all loans whose due date has passed and are not yet returned. */
  findOverdueLoans(): Promise<Loan[]>;

  /**
   * Returns a paginated list of loans, optionally filtered by member and/or logical status.
   * Pagination is 1-based.
   */
  findAll(criteria: ListLoansCriteria): Promise<{ loans: Loan[]; total: number }>;

  /** Persists a new loan record. Returns the created loan. */
  create(loan: Loan): Promise<Loan>;

  /** Updates a loan (e.g. marks it returned or overdue). Returns the updated loan. */
  update(loan: Loan): Promise<Loan>;
}
