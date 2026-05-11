import { Book } from '../entities/Book';

/**
 * Repository Interface: IBookRepository
 *
 * Defines WHAT operations the application needs to persist and retrieve books.
 * This interface lives in the domain; the implementation lives in infrastructure.
 *
 * All methods return domain entities, never raw DB rows.
 */
export interface IBookRepository {
  /** Finds a book by its surrogate ID. Returns null if not found. */
  findById(id: string): Promise<Book | null>;

  /** Finds a book by its ISBN. Returns null if not found. */
  findByIsbn(isbn: string): Promise<Book | null>;

  /**
   * Returns a paginated list of all books.
   * @param page  1-based page number.
   * @param limit Items per page.
   */
  findAll(page: number, limit: number): Promise<{ books: Book[]; total: number }>;

  /**
   * Full-text search across title and author fields.
   * @param query Search term.
   */
  search(query: string): Promise<Book[]>;

  /** Persists a new book to the store. Returns the created book. */
  create(book: Book): Promise<Book>;

  /** Updates an existing book. Returns the updated book. */
  update(book: Book): Promise<Book>;

  /** Removes a book by its ID. */
  delete(id: string): Promise<void>;
}
