/**
 * Unit tests for the shared client/server book form Zod schema.
 *
 * These cover the client-side validation rules and error message wording
 * (AC-3) plus the ISBN-format rule (AC-5). Pure logic — no DOM needed.
 */

import { bookFormSchema, isValidISBN, normalizeISBN } from '../bookFormSchema';

function baseInput(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    isbn: '9780132350884',
    title: 'Clean Code',
    author: 'Robert C. Martin',
    publisher: 'Prentice Hall',
    publishedAt: '2008-08-01',
    totalCopies: 3,
    ...overrides,
  };
}

function getFieldErrors(input: Record<string, unknown>): Record<string, string[]> {
  const parsed = bookFormSchema.safeParse(input);
  if (parsed.success) return {};
  const errors: Record<string, string[]> = {};
  for (const issue of parsed.error.issues) {
    const key = issue.path.join('.') || '_root';
    errors[key] = errors[key] ?? [];
    errors[key].push(issue.message);
  }
  return errors;
}

describe('AC-3 Validación client-side con mensajes de error descriptivos', () => {
  it('accepts a fully valid payload', () => {
    const result = bookFormSchema.safeParse(baseInput());
    expect(result.success).toBe(true);
  });

  it('reports a descriptive error when title is empty', () => {
    const errors = getFieldErrors(baseInput({ title: '' }));
    expect(errors.title).toBeDefined();
    expect(errors.title[0]).toBe('Title is required');
  });

  it('reports a descriptive error when title is just whitespace', () => {
    const errors = getFieldErrors(baseInput({ title: '   ' }));
    expect(errors.title).toBeDefined();
    expect(errors.title[0]).toBe('Title is required');
  });

  it('reports a descriptive error when author is missing', () => {
    const errors = getFieldErrors(baseInput({ author: '' }));
    expect(errors.author?.[0]).toBe('Author is required');
  });

  it('reports a descriptive error when publisher is missing', () => {
    const errors = getFieldErrors(baseInput({ publisher: '' }));
    expect(errors.publisher?.[0]).toBe('Publisher is required');
  });

  it('reports a descriptive error when totalCopies is below 1', () => {
    const errors = getFieldErrors(baseInput({ totalCopies: 0 }));
    expect(errors.totalCopies?.[0]).toBe('Total copies must be at least 1');
  });

  it('reports a descriptive error when totalCopies is not an integer', () => {
    const errors = getFieldErrors(baseInput({ totalCopies: 2.5 }));
    expect(errors.totalCopies?.[0]).toBe('Total copies must be a whole number');
  });

  it('reports a descriptive error when totalCopies is missing', () => {
    const errors = getFieldErrors(baseInput({ totalCopies: undefined }));
    expect(errors.totalCopies?.[0]).toBe('Total copies is required');
  });

  it('reports a descriptive error when publication date is empty', () => {
    const errors = getFieldErrors(baseInput({ publishedAt: '' }));
    expect(errors.publishedAt?.[0]).toBe('Publication date is required');
  });

  it('reports a descriptive error when publication date is malformed', () => {
    const errors = getFieldErrors(baseInput({ publishedAt: '08/01/2008' }));
    expect(errors.publishedAt?.[0]).toBe('Publication date must be in YYYY-MM-DD format');
  });

  it('reports a descriptive error when publication date is in the future', () => {
    const errors = getFieldErrors(baseInput({ publishedAt: '3000-01-01' }));
    expect(errors.publishedAt?.[0]).toBe('Publication date must be a real, non-future date');
  });

  it('produces one issue per offending field (so the UI can show them side by side)', () => {
    const errors = getFieldErrors({
      isbn: 'nope',
      title: '',
      author: '',
      publisher: '',
      publishedAt: '',
      totalCopies: 0,
    });
    expect(Object.keys(errors).sort()).toEqual(
      ['author', 'isbn', 'publishedAt', 'publisher', 'title', 'totalCopies'].sort(),
    );
  });
});

describe('AC-5 ISBN con formato validado', () => {
  it('exposes a normalizeISBN helper that strips hyphens, spaces, and uppercases the X check digit', () => {
    expect(normalizeISBN('978-0-13-235088-4')).toBe('9780132350884');
    expect(normalizeISBN(' 0-9752-2980-x ')).toBe('097522980X');
  });

  it('isValidISBN accepts a valid ISBN-13 (with hyphens)', () => {
    expect(isValidISBN('978-0-13-235088-4')).toBe(true);
    expect(isValidISBN('9780132350884')).toBe(true);
  });

  it('isValidISBN accepts a valid ISBN-10 with X check digit', () => {
    expect(isValidISBN('0-9752-2980-X')).toBe(true);
    expect(isValidISBN('097522980X')).toBe(true);
  });

  it('isValidISBN rejects a string whose length is neither 10 nor 13', () => {
    expect(isValidISBN('123')).toBe(false);
    expect(isValidISBN('12345678')).toBe(false);
    expect(isValidISBN('12345678901234')).toBe(false);
  });

  it('isValidISBN rejects an ISBN-13 with a bad checksum', () => {
    expect(isValidISBN('9780132350880')).toBe(false);
  });

  it('isValidISBN rejects an ISBN-10 with non-digit/non-X characters', () => {
    expect(isValidISBN('097522980Y')).toBe(false);
    expect(isValidISBN('abcdefghij')).toBe(false);
  });

  it('schema reports a descriptive error for an invalid ISBN', () => {
    const errors = getFieldErrors(baseInput({ isbn: 'totally-not-an-isbn' }));
    expect(errors.isbn).toBeDefined();
    expect(errors.isbn[0]).toMatch(/ISBN must be a valid ISBN-10 or ISBN-13/);
  });

  it('schema reports a descriptive error for ISBN with bad checksum', () => {
    const errors = getFieldErrors(baseInput({ isbn: '9780132350880' }));
    expect(errors.isbn?.[0]).toMatch(/ISBN must be a valid ISBN-10 or ISBN-13/);
  });

  it('schema reports a descriptive error when ISBN is empty', () => {
    const errors = getFieldErrors(baseInput({ isbn: '' }));
    expect(errors.isbn?.[0]).toBe('ISBN is required');
  });

  it('schema accepts a valid ISBN-13 with hyphens', () => {
    const result = bookFormSchema.safeParse(baseInput({ isbn: '978-0-13-235088-4' }));
    expect(result.success).toBe(true);
  });

  it('schema accepts a valid ISBN-10', () => {
    const result = bookFormSchema.safeParse(baseInput({ isbn: '0-13-235088-2' }));
    expect(result.success).toBe(true);
  });
});
