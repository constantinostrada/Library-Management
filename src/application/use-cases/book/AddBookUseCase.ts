import { Book } from '@/domain/entities/Book';
import { DomainError } from '@/domain/errors/DomainError';
import { IBookRepository } from '@/domain/repositories/IBookRepository';

import { BookDTO, CreateBookDTO } from '../../dtos/BookDTO';
import { BookMapper } from '../../mappers/BookMapper';

/**
 * Use Case: AddBookUseCase
 *
 * Adds a new book to the library catalogue.
 * Validates that the ISBN is not already registered before persisting.
 */
export class AddBookUseCase {
  constructor(private readonly bookRepository: IBookRepository) {}

  async execute(dto: CreateBookDTO): Promise<BookDTO> {
    // 1. Check for duplicate ISBN
    const existing = await this.bookRepository.findByIsbn(dto.isbn);
    if (existing) {
      throw new DuplicateISBNError(dto.isbn);
    }

    // 2. Build the domain entity (validation happens inside the entity)
    const book = Book.create({
      id: crypto.randomUUID(),
      isbn: dto.isbn,
      title: dto.title,
      author: dto.author,
      publisher: dto.publisher,
      publishedAt: new Date(dto.publishedAt),
      totalCopies: dto.totalCopies,
    });

    // 3. Persist
    const saved = await this.bookRepository.create(book);

    // 4. Return DTO — never return raw entities to callers
    return BookMapper.toDTO(saved);
  }
}

class DuplicateISBNError extends DomainError {
  readonly code = 'DUPLICATE_ISBN';

  constructor(isbn: string) {
    super(`A book with ISBN "${isbn}" already exists in the catalogue.`);
  }
}
