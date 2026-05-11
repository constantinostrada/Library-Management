import { BookNotFoundError } from '@/domain/errors/BookNotFoundError';
import { IBookRepository } from '@/domain/repositories/IBookRepository';

import { BookDTO } from '../../dtos/BookDTO';
import { BookMapper } from '../../mappers/BookMapper';

export interface GetBookDTO {
  id: string;
}

/**
 * Use Case: GetBookUseCase
 *
 * Retrieves a single book by its surrogate ID.
 * Throws BookNotFoundError if no book matches.
 */
export class GetBookUseCase {
  constructor(private readonly bookRepository: IBookRepository) {}

  async execute(dto: GetBookDTO): Promise<BookDTO> {
    const book = await this.bookRepository.findById(dto.id);

    if (!book) {
      throw new BookNotFoundError(dto.id);
    }

    return BookMapper.toDTO(book);
  }
}
