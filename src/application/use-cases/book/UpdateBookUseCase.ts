import { Book } from '@/domain/entities/Book';
import { BookNotFoundError } from '@/domain/errors/BookNotFoundError';
import { IBookRepository } from '@/domain/repositories/IBookRepository';

import { BookDTO, UpdateBookDTO } from '../../dtos/BookDTO';
import { BookMapper } from '../../mappers/BookMapper';

/**
 * Use Case: UpdateBookUseCase
 *
 * Updates the mutable fields of a book (title, author, publisher, totalCopies).
 * ISBN and publishedAt are not changeable post-creation by design.
 * Throws BookNotFoundError if the target book does not exist.
 */
export class UpdateBookUseCase {
  constructor(private readonly bookRepository: IBookRepository) {}

  async execute(dto: UpdateBookDTO): Promise<BookDTO> {
    const existing = await this.bookRepository.findById(dto.id);
    if (!existing) {
      throw new BookNotFoundError(dto.id);
    }

    const updated = Book.create({
      id: existing.id,
      isbn: existing.isbn.value,
      title: dto.title ?? existing.title,
      author: dto.author ?? existing.author,
      publisher: dto.publisher ?? existing.publisher,
      publishedAt: existing.publishedAt,
      totalCopies: dto.totalCopies ?? existing.totalCopies,
      activeLoanCount: existing.activeLoanCount,
      createdAt: existing.createdAt,
      updatedAt: new Date(),
    });

    const saved = await this.bookRepository.update(updated);
    return BookMapper.toDTO(saved);
  }
}
