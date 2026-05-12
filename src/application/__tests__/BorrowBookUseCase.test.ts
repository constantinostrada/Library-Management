import { Book } from '@/domain/entities/Book';
import { Member } from '@/domain/entities/Member';
import { Loan } from '@/domain/entities/Loan';
import { BookNotFoundError } from '@/domain/errors/BookNotFoundError';
import { MemberNotFoundError } from '@/domain/errors/MemberNotFoundError';
import { NoCopiesAvailableError } from '@/domain/errors/NoCopiesAvailableError';
import { IBookRepository } from '@/domain/repositories/IBookRepository';
import { ILoanRepository } from '@/domain/repositories/ILoanRepository';
import { IMemberRepository } from '@/domain/repositories/IMemberRepository';
import { LoanEligibilityService } from '@/domain/services/LoanEligibilityService';

import { BorrowBookUseCase } from '../use-cases/loan/BorrowBookUseCase';

// ── Test doubles ──────────────────────────────────────────────────────────────

const makeBook = (overrides: Partial<Parameters<typeof Book.create>[0]> = {}): Book =>
  Book.create({
    id: 'book-1',
    isbn: '9780132350884',
    title: 'Clean Code',
    author: 'Robert C. Martin',
    publisher: 'Prentice Hall',
    publishedAt: new Date('2008-08-01'),
    totalCopies: 3,
    activeLoanCount: 0,
    ...overrides,
  });

const makeMember = (): Member =>
  Member.create({ id: 'member-1', email: 'alice@example.com', name: 'Alice' });

function makeBookRepo(book: Book | null = makeBook()): jest.Mocked<IBookRepository> {
  return {
    findById: jest.fn().mockResolvedValue(book),
    findByIsbn: jest.fn().mockResolvedValue(null),
    findAll: jest.fn(),
    search: jest.fn(),
    create: jest.fn(),
    update: jest.fn().mockImplementation((b: Book) => Promise.resolve(b)),
    delete: jest.fn(),
  } as jest.Mocked<IBookRepository>;
}

function makeMemberRepo(member: Member | null = makeMember()): jest.Mocked<IMemberRepository> {
  return {
    findById: jest.fn().mockResolvedValue(member),
    findByEmail: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  } as jest.Mocked<IMemberRepository>;
}

function makeLoanRepo(): jest.Mocked<ILoanRepository> {
  return {
    findById: jest.fn(),
    findActiveLoansByMemberId: jest.fn().mockResolvedValue([]),
    findLoansByMemberId: jest.fn().mockResolvedValue([]),
    findLoansByBookId: jest.fn(),
    findOverdueLoans: jest.fn(),
    findAll: jest.fn(),
    // Echo the loan back so dueAt reflects what the use case actually built.
    create: jest.fn().mockImplementation((l: Loan) => Promise.resolve(l)),
    update: jest.fn(),
  } as jest.Mocked<ILoanRepository>;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('BorrowBookUseCase', () => {
  let useCase: BorrowBookUseCase;
  let bookRepo: jest.Mocked<IBookRepository>;
  let memberRepo: jest.Mocked<IMemberRepository>;
  let loanRepo: jest.Mocked<ILoanRepository>;

  beforeEach(() => {
    bookRepo = makeBookRepo();
    memberRepo = makeMemberRepo();
    loanRepo = makeLoanRepo();
    const eligibilityService = new LoanEligibilityService(5);

    useCase = new BorrowBookUseCase(bookRepo, memberRepo, loanRepo, eligibilityService);
  });

  it('creates a loan when all conditions are met', async () => {
    const result = await useCase.execute({ bookId: 'book-1', memberId: 'member-1' });

    expect(result.bookId).toBe('book-1');
    expect(result.memberId).toBe('member-1');
    expect(result.status).toBe('ACTIVE');
    expect(loanRepo.create).toHaveBeenCalledTimes(1);
    expect(bookRepo.update).toHaveBeenCalledTimes(1);
  });

  it('throws BookNotFoundError when the book does not exist', async () => {
    bookRepo = makeBookRepo(null);
    useCase = new BorrowBookUseCase(
      bookRepo,
      memberRepo,
      loanRepo,
      new LoanEligibilityService(5),
    );

    await expect(useCase.execute({ bookId: 'missing', memberId: 'member-1' })).rejects.toThrow(
      BookNotFoundError,
    );
  });

  it('throws MemberNotFoundError when the member does not exist', async () => {
    memberRepo = makeMemberRepo(null);
    useCase = new BorrowBookUseCase(
      bookRepo,
      memberRepo,
      loanRepo,
      new LoanEligibilityService(5),
    );

    await expect(useCase.execute({ bookId: 'book-1', memberId: 'missing' })).rejects.toThrow(
      MemberNotFoundError,
    );
  });

  it('throws NoCopiesAvailableError when all copies are on loan', async () => {
    bookRepo = makeBookRepo(makeBook({ totalCopies: 1, activeLoanCount: 1 }));
    useCase = new BorrowBookUseCase(
      bookRepo,
      memberRepo,
      loanRepo,
      new LoanEligibilityService(5),
    );

    await expect(useCase.execute({ bookId: 'book-1', memberId: 'member-1' })).rejects.toThrow(
      NoCopiesAvailableError,
    );
  });

  it('respects a custom loan duration', async () => {
    const result = await useCase.execute({
      bookId: 'book-1',
      memberId: 'member-1',
      loanDurationDays: 7,
    });

    // dueAt should be roughly 7 days from now (within 1-second tolerance)
    const expectedDue = new Date();
    expectedDue.setDate(expectedDue.getDate() + 7);

    const dueAt = new Date(result.dueAt);
    const diff = Math.abs(dueAt.getTime() - expectedDue.getTime());

    expect(diff).toBeLessThan(5000); // 5 seconds tolerance
  });
});
