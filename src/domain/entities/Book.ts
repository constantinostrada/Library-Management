import { ISBN } from '../value-objects/ISBN';

/**
 * Entity: Book
 *
 * Represents a book in the library catalogue.
 * A book entity tracks how many physical copies exist and how many
 * are currently on loan.
 *
 * Invariant: `activeLoanCount` must never exceed `totalCopies`.
 */
export class Book {
  private constructor(
    private readonly _id: string,
    private readonly _isbn: ISBN,
    private readonly _title: string,
    private readonly _author: string,
    private readonly _publisher: string,
    private readonly _publishedAt: Date,
    private readonly _totalCopies: number,
    private _activeLoanCount: number,
    private readonly _createdAt: Date,
    private readonly _updatedAt: Date,
  ) {}

  // ── Factory ────────────────────────────────────────────────────────────────

  static create(params: {
    id: string;
    isbn: string;
    title: string;
    author: string;
    publisher: string;
    publishedAt: Date;
    totalCopies: number;
    activeLoanCount?: number;
    createdAt?: Date;
    updatedAt?: Date;
  }): Book {
    if (!params.title.trim()) throw new Error('Book title must not be empty.');
    if (!params.author.trim()) throw new Error('Book author must not be empty.');
    if (!Number.isInteger(params.totalCopies) || params.totalCopies < 1) {
      throw new Error('Total copies must be a positive integer.');
    }
    const activeLoanCount = params.activeLoanCount ?? 0;
    if (activeLoanCount > params.totalCopies) {
      throw new Error('Active loan count cannot exceed total copies.');
    }

    const now = new Date();
    return new Book(
      params.id,
      ISBN.create(params.isbn),
      params.title.trim(),
      params.author.trim(),
      params.publisher.trim(),
      params.publishedAt,
      params.totalCopies,
      activeLoanCount,
      params.createdAt ?? now,
      params.updatedAt ?? now,
    );
  }

  // ── Domain behaviour ───────────────────────────────────────────────────────

  /** Returns true when at least one physical copy is not currently on loan. */
  get isAvailable(): boolean {
    return this._activeLoanCount < this._totalCopies;
  }

  get availableCopies(): number {
    return this._totalCopies - this._activeLoanCount;
  }

  /**
   * Records that one copy has been taken out on loan.
   * Caller must verify `isAvailable` before calling.
   */
  incrementActiveLoanCount(): void {
    if (!this.isAvailable) {
      throw new Error(`No copies available for book "${this._title}".`);
    }
    this._activeLoanCount += 1;
  }

  /**
   * Records that one copy has been returned.
   */
  decrementActiveLoanCount(): void {
    if (this._activeLoanCount === 0) {
      throw new Error(`Active loan count for book "${this._title}" is already zero.`);
    }
    this._activeLoanCount -= 1;
  }

  // ── Accessors ──────────────────────────────────────────────────────────────

  get id(): string {
    return this._id;
  }

  get isbn(): ISBN {
    return this._isbn;
  }

  get title(): string {
    return this._title;
  }

  get author(): string {
    return this._author;
  }

  get publisher(): string {
    return this._publisher;
  }

  get publishedAt(): Date {
    return this._publishedAt;
  }

  get totalCopies(): number {
    return this._totalCopies;
  }

  get activeLoanCount(): number {
    return this._activeLoanCount;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }
}
