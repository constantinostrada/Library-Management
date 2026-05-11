/**
 * DTOs for the Loan resource.
 */

export type LoanStatusDTO = 'ACTIVE' | 'RETURNED' | 'OVERDUE';

/** Outbound — shape returned by use cases. */
export interface LoanDTO {
  id: string;
  bookId: string;
  memberId: string;
  borrowedAt: string; // ISO 8601
  dueAt: string; // ISO 8601
  returnedAt: string | null; // ISO 8601 or null
  status: LoanStatusDTO;
}

/** Inbound — data required to create a new loan (borrow a book). */
export interface BorrowBookDTO {
  bookId: string;
  memberId: string;
  /** Optional override. Defaults to system-configured loan duration. */
  loanDurationDays?: number;
}

/** Inbound — data required to return a book. */
export interface ReturnBookDTO {
  loanId: string;
}

/** Inbound — pagination parameters. */
export interface ListLoansDTO {
  page?: number;
  limit?: number;
}

/** Outbound — paginated response. */
export interface PaginatedLoansDTO {
  loans: LoanDTO[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
