import { ISBN } from '../value-objects/ISBN';

describe('ISBN value object', () => {
  describe('valid ISBN-10', () => {
    it('accepts a valid ISBN-10 without hyphens', () => {
      const isbn = ISBN.create('0132350882');
      expect(isbn.value).toBe('0132350882');
    });

    it('strips hyphens before validating', () => {
      const isbn = ISBN.create('0-13-235088-2');
      expect(isbn.value).toBe('0132350882');
    });
  });

  describe('valid ISBN-13', () => {
    it('accepts a valid ISBN-13', () => {
      const isbn = ISBN.create('9780132350884');
      expect(isbn.value).toBe('9780132350884');
    });

    it('strips hyphens from ISBN-13', () => {
      const isbn = ISBN.create('978-0-13-235088-4');
      expect(isbn.value).toBe('9780132350884');
    });
  });

  describe('invalid ISBNs', () => {
    it('throws for a random string', () => {
      expect(() => ISBN.create('not-an-isbn')).toThrow();
    });

    it('throws for an ISBN-10 with a wrong check digit', () => {
      expect(() => ISBN.create('0132350880')).toThrow();
    });

    it('throws for an ISBN-13 with a wrong check digit', () => {
      expect(() => ISBN.create('9780132350885')).toThrow();
    });

    it('throws for an empty string', () => {
      expect(() => ISBN.create('')).toThrow();
    });
  });

  describe('equality', () => {
    it('two ISBNs with the same value are equal', () => {
      const a = ISBN.create('9780132350884');
      const b = ISBN.create('978-0-13-235088-4');
      expect(a.equals(b)).toBe(true);
    });

    it('two ISBNs with different values are not equal', () => {
      const a = ISBN.create('9780132350884');
      const b = ISBN.create('9780201633610');
      expect(a.equals(b)).toBe(false);
    });
  });
});
