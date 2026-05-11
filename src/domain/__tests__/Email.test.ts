import { Email } from '../value-objects/Email';

describe('Email value object', () => {
  it('accepts a valid email and lower-cases it', () => {
    const email = Email.create('Alice@Example.COM');
    expect(email.value).toBe('alice@example.com');
  });

  it('trims whitespace', () => {
    const email = Email.create('  bob@example.com  ');
    expect(email.value).toBe('bob@example.com');
  });

  it('throws for a missing @ symbol', () => {
    expect(() => Email.create('notanemail')).toThrow();
  });

  it('throws for an empty string', () => {
    expect(() => Email.create('')).toThrow();
  });

  it('two emails with the same normalised value are equal', () => {
    const a = Email.create('Alice@Example.COM');
    const b = Email.create('alice@example.com');
    expect(a.equals(b)).toBe(true);
  });
});
