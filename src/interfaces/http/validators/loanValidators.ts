import { z } from 'zod';

/**
 * Input validation schemas for Loan API endpoints.
 */

export const borrowBookSchema = z.object({
  bookId: z.string().uuid(),
  memberId: z.string().uuid(),
  loanDurationDays: z.number().int().min(1).max(90).optional(),
});

/**
 * Logical status filter for GET /api/loans.
 *  - active   = loan is currently borrowed and not overdue
 *  - returned = loan has been returned
 *  - overdue  = loan is not returned and its due date has passed
 *
 * Accepts case-insensitive input; normalises to lowercase.
 */
export const loanStatusFilterSchema = z
  .string()
  .transform((v) => v.toLowerCase())
  .pipe(z.enum(['active', 'returned', 'overdue']));

export const listLoansQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  status: loanStatusFilterSchema.optional(),
  memberId: z.string().uuid().optional(),
});

export type BorrowBookInput = z.infer<typeof borrowBookSchema>;
export type ListLoansQuery = z.infer<typeof listLoansQuerySchema>;
export type LoanStatusFilter = z.infer<typeof loanStatusFilterSchema>;
