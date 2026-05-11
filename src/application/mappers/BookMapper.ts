import { Book } from '@/domain/entities/Book';

import { BookDTO } from '../dtos/BookDTO';

/**
 * Mapper: BookMapper
 *
 * Translates between the Book domain entity and the outbound BookDTO.
 * Ensures that infrastructure and interface layers never receive raw entities.
 */
export class BookMapper {
  static toDTO(book: Book): BookDTO {
    return {
      id: book.id,
      isbn: book.isbn.value,
      title: book.title,
      author: book.author,
      publisher: book.publisher,
      publishedAt: book.publishedAt.toISOString(),
      totalCopies: book.totalCopies,
      availableCopies: book.availableCopies,
      createdAt: book.createdAt.toISOString(),
      updatedAt: book.updatedAt.toISOString(),
    };
  }

  static toDTOList(books: Book[]): BookDTO[] {
    return books.map(BookMapper.toDTO);
  }
}
