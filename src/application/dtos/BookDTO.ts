/**
 * DTOs for the Book resource.
 *
 * DTOs are plain data contracts used to communicate across layer boundaries.
 * They contain no behaviour and reference no domain types.
 */

/** Outbound — shape returned by use cases to callers. */
export interface BookDTO {
  id: string;
  isbn: string;
  title: string;
  author: string;
  publisher: string;
  publishedAt: string; // ISO 8601
  totalCopies: number;
  availableCopies: number;
  createdAt: string;
  updatedAt: string;
}

/** Inbound — data required to add a new book to the catalogue. */
export interface CreateBookDTO {
  isbn: string;
  title: string;
  author: string;
  publisher: string;
  publishedAt: string; // ISO 8601 date string
  totalCopies: number;
}

/** Inbound — data to update an existing book. All fields optional. */
export interface UpdateBookDTO {
  id: string;
  title?: string;
  author?: string;
  publisher?: string;
  totalCopies?: number;
}

/** Inbound — pagination + optional filter parameters for listing books. */
export interface ListBooksDTO {
  page?: number;
  limit?: number;
  title?: string;
  author?: string;
}

/** Filter criteria forwarded to the repository layer. */
export interface BookFilters {
  title?: string;
  author?: string;
}

/** Outbound — paginated response wrapper. */
export interface PaginatedBooksDTO {
  books: BookDTO[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
