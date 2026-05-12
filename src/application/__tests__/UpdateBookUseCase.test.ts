import { Book } from '@/domain/entities/Book';
import { BookNotFoundError } from '@/domain/errors/BookNotFoundError';
import { IBookRepository } from '@/domain/repositories/IBookRepository';

import { UpdateBookUseCase } from '../use-cases/book/UpdateBookUseCase';

const makeExisting = (): Book =>
  Book.create({
    id: 'book-1',
    isbn: '9780132350884',
    title: 'Clean Code',
    author: 'Robert C. Martin',
    publisher: 'Prentice Hall',
    publishedAt: new Date('2008-08-01'),
    totalCopies: 3,
    activeLoanCount: 1,
  });

const makeRepo = (existing: Book | null): jest.Mocked<IBookRepository> =>
  ({
    findById: jest.fn().mockResolvedValue(existing),
    findByIsbn: jest.fn(),
    findAll: jest.fn(),
    search: jest.fn(),
    create: jest.fn(),
    update: jest.fn().mockImplementation((b: Book) => Promise.resolve(b)),
    delete: jest.fn(),
  }) as jest.Mocked<IBookRepository>;

describe('UpdateBookUseCase', () => {
  it('updates only the provided fields and preserves the rest', async () => {
    const repo = makeRepo(makeExisting());
    const useCase = new UpdateBookUseCase(repo);

    const result = await useCase.execute({
      id: 'book-1',
      title: 'Clean Code: 2nd Edition',
      totalCopies: 5,
    });

    expect(result.title).toBe('Clean Code: 2nd Edition');
    expect(result.totalCopies).toBe(5);
    expect(result.author).toBe('Robert C. Martin');
    expect(result.publisher).toBe('Prentice Hall');
    expect(result.isbn).toBe('9780132350884');
    expect(repo.update).toHaveBeenCalledTimes(1);
  });

  it('throws BookNotFoundError when the target does not exist', async () => {
    const repo = makeRepo(null);
    const useCase = new UpdateBookUseCase(repo);

    await expect(useCase.execute({ id: 'missing', title: 'X' })).rejects.toThrow(
      BookNotFoundError,
    );
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('rejects an update that would shrink totalCopies below active loans (via entity invariant)', async () => {
    // Existing has activeLoanCount=1; setting totalCopies=0 violates Book.create's invariant.
    const repo = makeRepo(makeExisting());
    const useCase = new UpdateBookUseCase(repo);

    await expect(useCase.execute({ id: 'book-1', totalCopies: 0 })).rejects.toThrow();
  });
});
