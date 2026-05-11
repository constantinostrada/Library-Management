/**
 * Base class for all domain-level errors.
 *
 * Domain errors represent violations of business rules and invariants.
 * They carry no HTTP semantics — translation to HTTP status codes
 * happens in the interfaces layer.
 */
export abstract class DomainError extends Error {
  /** Stable machine-readable error code. */
  abstract readonly code: string;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    // Maintain proper prototype chain in transpiled ES5.
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
