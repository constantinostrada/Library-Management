import { z } from 'zod';

/**
 * Input validation schemas for Book API endpoints.
 *
 * Validation of shape/format lives here in the interfaces layer.
 * Business rule validation (ISBN uniqueness, available copies, etc.)
 * lives in domain/application.
 */

export const createBookSchema = z.object({
  isbn: z.string().min(10).max(17),
  title: z.string().min(1).max(500),
  author: z.string().min(1).max(500),
  publisher: z.string().min(1).max(300),
  publishedAt: z.string().datetime({ message: 'publishedAt must be an ISO 8601 datetime string.' }),
  totalCopies: z.number().int().min(1).max(10000),
});

export const updateBookSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  author: z.string().min(1).max(500).optional(),
  publisher: z.string().min(1).max(300).optional(),
  totalCopies: z.number().int().min(1).max(10000).optional(),
});

export type CreateBookInput = z.infer<typeof createBookSchema>;
export type UpdateBookInput = z.infer<typeof updateBookSchema>;
