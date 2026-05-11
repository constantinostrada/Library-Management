/**
 * Loan status lifecycle:
 *  ACTIVE   → book is currently on loan.
 *  RETURNED → book has been returned on time.
 *  OVERDUE  → due date has passed without return.
 */
export type LoanStatus = 'ACTIVE' | 'RETURNED' | 'OVERDUE';

/**
 * Entity: Loan
 *
 * Represents the act of a member borrowing a specific book.
 * Business rules:
 *  - A loan cannot be returned if it has already been returned.
 *  - Overdue status is computed from the current date vs dueAt.
 */
export class Loan {
  private constructor(
    private readonly _id: string,
    private readonly _bookId: string,
    private readonly _memberId: string,
    private readonly _borrowedAt: Date,
    private readonly _dueAt: Date,
    private _returnedAt: Date | null,
    private _status: LoanStatus,
  ) {}

  // ── Factory ────────────────────────────────────────────────────────────────

  static create(params: {
    id: string;
    bookId: string;
    memberId: string;
    borrowedAt?: Date;
    dueAt: Date;
    returnedAt?: Date | null;
    status?: LoanStatus;
  }): Loan {
    const borrowedAt = params.borrowedAt ?? new Date();

    if (params.dueAt <= borrowedAt) {
      throw new Error('Due date must be after the borrow date.');
    }

    return new Loan(
      params.id,
      params.bookId,
      params.memberId,
      borrowedAt,
      params.dueAt,
      params.returnedAt ?? null,
      params.status ?? 'ACTIVE',
    );
  }

  // ── Domain behaviour ───────────────────────────────────────────────────────

  /** Marks the loan as returned. Idempotency guard is caller-enforced (see use case). */
  return(returnedAt: Date = new Date()): void {
    this._returnedAt = returnedAt;
    this._status = 'RETURNED';
  }

  /**
   * Checks whether the loan is overdue as of `now` and updates status if needed.
   * This is called by the domain service responsible for overdue detection.
   */
  syncOverdueStatus(now: Date = new Date()): void {
    if (this._status === 'ACTIVE' && now > this._dueAt) {
      this._status = 'OVERDUE';
    }
  }

  get isReturned(): boolean {
    return this._status === 'RETURNED';
  }

  get isOverdue(): boolean {
    return this._status === 'OVERDUE';
  }

  // ── Accessors ──────────────────────────────────────────────────────────────

  get id(): string {
    return this._id;
  }

  get bookId(): string {
    return this._bookId;
  }

  get memberId(): string {
    return this._memberId;
  }

  get borrowedAt(): Date {
    return this._borrowedAt;
  }

  get dueAt(): Date {
    return this._dueAt;
  }

  get returnedAt(): Date | null {
    return this._returnedAt;
  }

  get status(): LoanStatus {
    return this._status;
  }
}
