import { Loan } from '../entities/Loan';

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

  /** Returns all loans (active and returned) for a given book. */
  findLoansByBookId(bookId: string): Promise<Loan[]>;

  /** Returns all loans whose due date has passed and are not yet returned. */
  findOverdueLoans(): Promise<Loan[]>;

  /**
   * Returns a paginated list of all loans.
   * @param page  1-based page number.
   * @param limit Items per page.
   */
  findAll(page: number, limit: number): Promise<{ loans: Loan[]; total: number }>;

  /** Persists a new loan record. Returns the created loan. */
  create(loan: Loan): Promise<Loan>;

  /** Updates a loan (e.g. marks it returned or overdue). Returns the updated loan. */
  update(loan: Loan): Promise<Loan>;
}
