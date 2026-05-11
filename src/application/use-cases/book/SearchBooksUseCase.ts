import { IBookRepository } from '@/domain/repositories/IBookRepository';

import { BookDTO } from '../../dtos/BookDTO';
import { BookMapper } from '../../mappers/BookMapper';

export interface SearchBooksDTO {
  query: string;
}

/**
 * Use Case: SearchBooksUseCase
 *
 * Full-text search over book titles and authors.
 */
export class SearchBooksUseCase {
  constructor(private readonly bookRepository: IBookRepository) {}

  async execute(dto: SearchBooksDTO): Promise<BookDTO[]> {
    if (!dto.query.trim()) return [];

    const books = await this.bookRepository.search(dto.query.trim());
    return BookMapper.toDTOList(books);
  }
}
