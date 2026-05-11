import { Email } from '../value-objects/Email';

/**
 * Membership status.
 * ACTIVE    → may borrow books.
 * SUSPENDED → borrow privileges revoked (e.g. overdue fines).
 * CLOSED    → account permanently deactivated.
 */
export type MemberStatus = 'ACTIVE' | 'SUSPENDED' | 'CLOSED';

/**
 * Entity: Member
 *
 * Represents a registered library member.
 * Business rules:
 *  - Only ACTIVE members may borrow books.
 *  - A member's email must be unique (enforced at repository level).
 */
export class Member {
  private constructor(
    private readonly _id: string,
    private readonly _email: Email,
    private _name: string,
    private _status: MemberStatus,
    private readonly _createdAt: Date,
    private readonly _updatedAt: Date,
  ) {}

  // ── Factory ────────────────────────────────────────────────────────────────

  static create(params: {
    id: string;
    email: string;
    name: string;
    status?: MemberStatus;
    createdAt?: Date;
    updatedAt?: Date;
  }): Member {
    if (!params.name.trim()) throw new Error('Member name must not be empty.');

    const now = new Date();
    return new Member(
      params.id,
      Email.create(params.email),
      params.name.trim(),
      params.status ?? 'ACTIVE',
      params.createdAt ?? now,
      params.updatedAt ?? now,
    );
  }

  // ── Domain behaviour ───────────────────────────────────────────────────────

  /** Returns true only when this member is allowed to borrow books. */
  get canBorrow(): boolean {
    return this._status === 'ACTIVE';
  }

  suspend(): void {
    this._status = 'SUSPENDED';
  }

  reactivate(): void {
    if (this._status === 'CLOSED') {
      throw new Error(`Cannot reactivate a closed account for member "${this._id}".`);
    }
    this._status = 'ACTIVE';
  }

  close(): void {
    this._status = 'CLOSED';
  }

  updateName(name: string): void {
    if (!name.trim()) throw new Error('Member name must not be empty.');
    this._name = name.trim();
  }

  // ── Accessors ──────────────────────────────────────────────────────────────

  get id(): string {
    return this._id;
  }

  get email(): Email {
    return this._email;
  }

  get name(): string {
    return this._name;
  }

  get status(): MemberStatus {
    return this._status;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }
}
