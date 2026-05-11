import { DomainError } from '../errors/DomainError';

/**
 * Value Object: Email
 *
 * Represents a validated email address.
 * Immutable — equality is by lower-cased value.
 */

class InvalidEmailError extends DomainError {
  readonly code = 'INVALID_EMAIL';

  constructor(value: string) {
    super(`"${value}" is not a valid email address.`);
  }
}

export class Email {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  static create(raw: string): Email {
    const normalised = raw.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalised)) {
      throw new InvalidEmailError(raw);
    }

    return new Email(normalised);
  }

  get value(): string {
    return this._value;
  }

  equals(other: Email): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
