import { DomainError } from '../errors/DomainError';

/**
 * Value Object: LoanDuration
 *
 * Represents the number of days a book may be borrowed.
 * Enforces that the duration is a positive integer within an allowed range.
 */

const MIN_DAYS = 1;
const MAX_DAYS = 90;

class InvalidLoanDurationError extends DomainError {
  readonly code = 'INVALID_LOAN_DURATION';

  constructor(days: number) {
    super(
      `Loan duration of ${days} day(s) is invalid. Must be between ${MIN_DAYS} and ${MAX_DAYS}.`,
    );
  }
}

export class LoanDuration {
  private readonly _days: number;

  private constructor(days: number) {
    this._days = days;
  }

  static create(days: number): LoanDuration {
    if (!Number.isInteger(days) || days < MIN_DAYS || days > MAX_DAYS) {
      throw new InvalidLoanDurationError(days);
    }
    return new LoanDuration(days);
  }

  /** Default loan duration used when no explicit duration is specified. */
  static default(): LoanDuration {
    return new LoanDuration(14);
  }

  get days(): number {
    return this._days;
  }

  /** Returns the due date given a borrow date. */
  dueDate(borrowedAt: Date): Date {
    const due = new Date(borrowedAt);
    due.setDate(due.getDate() + this._days);
    return due;
  }

  equals(other: LoanDuration): boolean {
    return this._days === other._days;
  }

  toString(): string {
    return `${this._days} day(s)`;
  }
}
