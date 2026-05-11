import { z } from 'zod';

/**
 * Input validation schemas for Loan API endpoints.
 */

export const borrowBookSchema = z.object({
  bookId: z.string().uuid(),
  memberId: z.string().uuid(),
  loanDurationDays: z.number().int().min(1).max(90).optional(),
});

export const returnBookSchema = z.object({
  loanId: z.string().uuid(),
});

export type BorrowBookInput = z.infer<typeof borrowBookSchema>;
export type ReturnBookInput = z.infer<typeof returnBookSchema>;
