import { Book } from '@/domain/entities/Book';
import { IBookRepository } from '@/domain/repositories/IBookRepository';

import { AddBookUseCase } from '../use-cases/book/AddBookUseCase';
import { CreateBookDTO } from '../dtos/BookDTO';

const makeRepo = (existing: Book | null = null): jest.Mocked<IBookRepository> => ({
  findById: jest.fn(),
  findByIsbn: jest.fn().mockResolvedValue(existing),
  findAll: jest.fn(),
  search: jest.fn(),
  create: jest.fn().mockImplementation((b: Book) => Promise.resolve(b)),
  update: jest.fn(),
  delete: jest.fn(),
});

const validDTO: CreateBookDTO = {
  isbn: '9780132350884',
  title: 'Clean Code',
  author: 'Robert C. Martin',
  publisher: 'Prentice Hall',
  publishedAt: '2008-08-01T00:00:00.000Z',
  totalCopies: 3,
};

describe('AddBookUseCase', () => {
  it('creates and returns a book DTO when ISBN is unique', async () => {
    const repo = makeRepo();
    const useCase = new AddBookUseCase(repo);

    const result = await useCase.execute(validDTO);

    expect(result.title).toBe('Clean Code');
    expect(result.isbn).toBe('9780132350884');
    expect(result.availableCopies).toBe(3);
    expect(repo.create).toHaveBeenCalledTimes(1);
  });

  it('throws when the ISBN is already in the catalogue', async () => {
    const existingBook = Book.create({
      id: 'existing',
      isbn: '9780132350884',
      title: 'Clean Code',
      author: 'Robert C. Martin',
      publisher: 'Prentice Hall',
      publishedAt: new Date(),
      totalCopies: 1,
    });
    const repo = makeRepo(existingBook);
    const useCase = new AddBookUseCase(repo);

    await expect(useCase.execute(validDTO)).rejects.toThrow(/already exists/i);
    expect(repo.create).not.toHaveBeenCalled();
  });
});
