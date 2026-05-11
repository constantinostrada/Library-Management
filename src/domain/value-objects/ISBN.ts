import { DomainError } from '../errors/DomainError';

/**
 * Value Object: ISBN
 *
 * Represents a valid International Standard Book Number (ISBN-10 or ISBN-13).
 * Immutable — equality is determined by value, not identity.
 *
 * Validation logic:
 *  - Strips hyphens and spaces before validating.
 *  - Accepts both ISBN-10 and ISBN-13 formats.
 */

class InvalidISBNError extends DomainError {
  readonly code = 'INVALID_ISBN';

  constructor(value: string) {
    super(`"${value}" is not a valid ISBN-10 or ISBN-13.`);
  }
}

export class ISBN {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  static create(raw: string): ISBN {
    const normalised = raw.replace(/[-\s]/g, '').toUpperCase();

    if (!ISBN.isValid(normalised)) {
      throw new InvalidISBNError(raw);
    }

    return new ISBN(normalised);
  }

  get value(): string {
    return this._value;
  }

  equals(other: ISBN): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private static isValid(normalised: string): boolean {
    if (normalised.length === 10) return ISBN.validateISBN10(normalised);
    if (normalised.length === 13) return ISBN.validateISBN13(normalised);
    return false;
  }

  /**
   * ISBN-10 check digit validation (mod-11 algorithm).
   */
  private static validateISBN10(isbn: string): boolean {
    if (!/^\d{9}[\dX]$/.test(isbn)) return false;

    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += (10 - i) * parseInt(isbn[i], 10);
    }
    const lastChar = isbn[9];
    sum += lastChar === 'X' ? 10 : parseInt(lastChar, 10);

    return sum % 11 === 0;
  }

  /**
   * ISBN-13 check digit validation (mod-10 EAN algorithm).
   */
  private static validateISBN13(isbn: string): boolean {
    if (!/^\d{13}$/.test(isbn)) return false;

    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(isbn[i], 10) * (i % 2 === 0 ? 1 : 3);
    }
    const checkDigit = (10 - (sum % 10)) % 10;

    return checkDigit === parseInt(isbn[12], 10);
  }
}
