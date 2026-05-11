import { IBookRepository } from '@/domain/repositories/IBookRepository';

import { ListBooksDTO, PaginatedBooksDTO } from '../../dtos/BookDTO';
import { BookMapper } from '../../mappers/BookMapper';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

/**
 * Use Case: ListBooksUseCase
 *
 * Returns a paginated list of all books in the catalogue.
 */
export class ListBooksUseCase {
  constructor(private readonly bookRepository: IBookRepository) {}

  async execute(dto: ListBooksDTO): Promise<PaginatedBooksDTO> {
    const page = Math.max(1, dto.page ?? DEFAULT_PAGE);
    const limit = Math.min(100, Math.max(1, dto.limit ?? DEFAULT_LIMIT));

    const { books, total } = await this.bookRepository.findAll(page, limit);

    return {
      books: BookMapper.toDTOList(books),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
