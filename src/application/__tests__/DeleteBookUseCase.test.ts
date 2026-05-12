import { Book } from '@/domain/entities/Book';
import { Loan } from '@/domain/entities/Loan';
import { BookHasActiveLoansError } from '@/domain/errors/BookHasActiveLoansError';
import { BookNotFoundError } from '@/domain/errors/BookNotFoundError';
import { IBookRepository } from '@/domain/repositories/IBookRepository';
import { ILoanRepository } from '@/domain/repositories/ILoanRepository';

import { DeleteBookUseCase } from '../use-cases/book/DeleteBookUseCase';

const makeBook = (): Book =>
  Book.create({
    id: 'book-1',
    isbn: '9780132350884',
    title: 'Clean Code',
    author: 'R. Martin',
    publisher: 'Prentice Hall',
    publishedAt: new Date('2008-08-01'),
    totalCopies: 3,
  });

function future(days = 14): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

const activeLoan = (): Loan =>
  Loan.create({
    id: 'loan-1',
    bookId: 'book-1',
    memberId: 'm-1',
    dueAt: future(),
    status: 'ACTIVE',
  });

const returnedLoan = (): Loan =>
  Loan.create({
    id: 'loan-2',
    bookId: 'book-1',
    memberId: 'm-2',
    dueAt: future(),
    status: 'RETURNED',
    returnedAt: new Date(),
  });

const makeBookRepo = (book: Book | null): jest.Mocked<IBookRepository> =>
  ({
    findById: jest.fn().mockResolvedValue(book),
    findByIsbn: jest.fn(),
    findAll: jest.fn(),
    search: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn().mockResolvedValue(undefined),
  }) as jest.Mocked<IBookRepository>;

const makeLoanRepo = (loans: Loan[]): jest.Mocked<ILoanRepository> =>
  ({
    findById: jest.fn(),
    findActiveLoansByMemberId: jest.fn(),
    findLoansByBookId: jest.fn().mockResolvedValue(loans),
    findOverdueLoans: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  }) as jest.Mocked<ILoanRepository>;

describe('DeleteBookUseCase', () => {
  it('deletes the book when no loans reference it', async () => {
    const bookRepo = makeBookRepo(makeBook());
    const loanRepo = makeLoanRepo([]);
    const useCase = new DeleteBookUseCase(bookRepo, loanRepo);

    await useCase.execute({ id: 'book-1' });

    expect(bookRepo.delete).toHaveBeenCalledWith('book-1');
  });

  it('deletes the book when only returned loans exist', async () => {
    const bookRepo = makeBookRepo(makeBook());
    const loanRepo = makeLoanRepo([returnedLoan()]);
    const useCase = new DeleteBookUseCase(bookRepo, loanRepo);

    await useCase.execute({ id: 'book-1' });

    expect(bookRepo.delete).toHaveBeenCalledWith('book-1');
  });

  it('throws BookHasActiveLoansError when ACTIVE loans exist', async () => {
    const bookRepo = makeBookRepo(makeBook());
    const loanRepo = makeLoanRepo([activeLoan()]);
    const useCase = new DeleteBookUseCase(bookRepo, loanRepo);

    await expect(useCase.execute({ id: 'book-1' })).rejects.toThrow(
      BookHasActiveLoansError,
    );
    expect(bookRepo.delete).not.toHaveBeenCalled();
  });

  it('throws BookNotFoundError when the book does not exist', async () => {
    const bookRepo = makeBookRepo(null);
    const loanRepo = makeLoanRepo([]);
    const useCase = new DeleteBookUseCase(bookRepo, loanRepo);

    await expect(useCase.execute({ id: 'missing' })).rejects.toThrow(BookNotFoundError);
    expect(bookRepo.delete).not.toHaveBeenCalled();
  });
});
