import { z } from 'zod';

/**
 * Client-side validation schema for the create / edit book forms.
 *
 * Kept self-contained (no domain imports) so the form can run in the
 * browser without pulling node-only modules into the client bundle.
 *
 * Error messages are user-facing — keep them human and descriptive.
 */

export function normalizeISBN(raw: string): string {
  return raw.replace(/[-\s]/g, '').toUpperCase();
}

function isValidISBN10(value: string): boolean {
  if (!/^\d{9}[\dX]$/.test(value)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += (10 - i) * parseInt(value[i], 10);
  }
  const last = value[9];
  sum += last === 'X' ? 10 : parseInt(last, 10);
  return sum % 11 === 0;
}

function isValidISBN13(value: string): boolean {
  if (!/^\d{13}$/.test(value)) return false;
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(value[i], 10) * (i % 2 === 0 ? 1 : 3);
  }
  const check = (10 - (sum % 10)) % 10;
  return check === parseInt(value[12], 10);
}

export function isValidISBN(raw: string): boolean {
  const normalised = normalizeISBN(raw);
  if (normalised.length === 10) return isValidISBN10(normalised);
  if (normalised.length === 13) return isValidISBN13(normalised);
  return false;
}

export const bookFormSchema = z.object({
  isbn: z
    .string({ required_error: 'ISBN is required' })
    .min(1, { message: 'ISBN is required' })
    .refine((value) => isValidISBN(value), {
      message:
        'ISBN must be a valid ISBN-10 or ISBN-13 (hyphens and spaces are allowed)',
    }),
  title: z
    .string({ required_error: 'Title is required' })
    .trim()
    .min(1, { message: 'Title is required' })
    .max(500, { message: 'Title must be 500 characters or fewer' }),
  author: z
    .string({ required_error: 'Author is required' })
    .trim()
    .min(1, { message: 'Author is required' })
    .max(500, { message: 'Author must be 500 characters or fewer' }),
  publisher: z
    .string({ required_error: 'Publisher is required' })
    .trim()
    .min(1, { message: 'Publisher is required' })
    .max(300, { message: 'Publisher must be 300 characters or fewer' }),
  publishedAt: z
    .string({ required_error: 'Publication date is required' })
    .min(1, { message: 'Publication date is required' })
    .refine((value) => /^\d{4}-\d{2}-\d{2}$/.test(value), {
      message: 'Publication date must be in YYYY-MM-DD format',
    })
    .refine(
      (value) => {
        const date = new Date(`${value}T00:00:00.000Z`);
        return !Number.isNaN(date.getTime()) && date.getTime() <= Date.now();
      },
      { message: 'Publication date must be a real, non-future date' },
    ),
  totalCopies: z
    .number({
      required_error: 'Total copies is required',
      invalid_type_error: 'Total copies must be a number',
    })
    .int({ message: 'Total copies must be a whole number' })
    .min(1, { message: 'Total copies must be at least 1' })
    .max(10000, { message: 'Total copies must be 10000 or fewer' }),
});

export type BookFormInput = z.infer<typeof bookFormSchema>;
