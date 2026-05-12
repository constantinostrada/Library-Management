import { Book } from '@/domain/entities/Book';
import { Loan } from '@/domain/entities/Loan';
import { Member } from '@/domain/entities/Member';
import { IBookRepository } from '@/domain/repositories/IBookRepository';
import { ILoanRepository } from '@/domain/repositories/ILoanRepository';
import { IMemberRepository } from '@/domain/repositories/IMemberRepository';
import { LoanEligibilityService } from '@/domain/services/LoanEligibilityService';

import { CanBorrowUseCase } from '../use-cases/loan/CanBorrowUseCase';

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

const makeMember = (status: 'ACTIVE' | 'SUSPENDED' | 'CLOSED' = 'ACTIVE'): Member =>
  Member.create({ id: 'member-1', email: 'alice@example.com', name: 'Alice', status });

const makeLoan = (id: string): Loan => {
  const due = new Date();
  due.setDate(due.getDate() + 14);
  return Loan.create({ id, bookId: 'book-1', memberId: 'member-1', dueAt: due });
};

function makeBookRepo(book: Book | null = makeBook()): jest.Mocked<IBookRepository> {
  return {
    findById: jest.fn().mockResolvedValue(book),
    findByIsbn: jest.fn(),
    findAll: jest.fn(),
    search: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
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

function makeLoanRepo(activeLoans: Loan[] = []): jest.Mocked<ILoanRepository> {
  return {
    findById: jest.fn(),
    findActiveLoansByMemberId: jest.fn().mockResolvedValue(activeLoans),
    findLoansByMemberId: jest.fn().mockResolvedValue([]),
    findLoansByBookId: jest.fn(),
    findOverdueLoans: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  } as jest.Mocked<ILoanRepository>;
}

describe('CanBorrowUseCase', () => {
  describe('canBorrow(memberId, bookId) — validates 3 rules and returns result with reason', () => {
    it('returns { allowed: true } when member is ACTIVE, copies are available, and under limit', async () => {
      const useCase = new CanBorrowUseCase(
        makeBookRepo(),
        makeMemberRepo(),
        makeLoanRepo([]),
        new LoanEligibilityService(3),
      );

      const result = await useCase.execute({ memberId: 'member-1', bookId: 'book-1' });
      expect(result).toEqual({ allowed: true });
    });

    it('returns MEMBER_NOT_FOUND when the member does not exist', async () => {
      const useCase = new CanBorrowUseCase(
        makeBookRepo(),
        makeMemberRepo(null),
        makeLoanRepo([]),
        new LoanEligibilityService(3),
      );

      const result = await useCase.execute({ memberId: 'missing', bookId: 'book-1' });
      expect(result.allowed).toBe(false);
      if (!result.allowed) {
        expect(result.reason.code).toBe('MEMBER_NOT_FOUND');
        expect(result.reason.message).toContain('missing');
      }
    });

    it('returns BOOK_NOT_FOUND when the book does not exist', async () => {
      const useCase = new CanBorrowUseCase(
        makeBookRepo(null),
        makeMemberRepo(),
        makeLoanRepo([]),
        new LoanEligibilityService(3),
      );

      const result = await useCase.execute({ memberId: 'member-1', bookId: 'missing' });
      expect(result.allowed).toBe(false);
      if (!result.allowed) {
        expect(result.reason.code).toBe('BOOK_NOT_FOUND');
        expect(result.reason.message).toContain('missing');
      }
    });
  });

  describe('member suspended rule', () => {
    it('denies SUSPENDED member with code MEMBER_SUSPENDED + descriptive message', async () => {
      const useCase = new CanBorrowUseCase(
        makeBookRepo(),
        makeMemberRepo(makeMember('SUSPENDED')),
        makeLoanRepo([]),
        new LoanEligibilityService(3),
      );

      const result = await useCase.execute({ memberId: 'member-1', bookId: 'book-1' });
      expect(result.allowed).toBe(false);
      if (!result.allowed) {
        expect(result.reason.code).toBe('MEMBER_SUSPENDED');
        expect(result.reason.message).toMatch(/member-1/);
        expect(result.reason.message).toMatch(/suspended|closed/i);
      }
    });

    it('denies CLOSED member with code MEMBER_SUSPENDED', async () => {
      const useCase = new CanBorrowUseCase(
        makeBookRepo(),
        makeMemberRepo(makeMember('CLOSED')),
        makeLoanRepo([]),
        new LoanEligibilityService(3),
      );

      const result = await useCase.execute({ memberId: 'member-1', bookId: 'book-1' });
      expect(result.allowed).toBe(false);
      if (!result.allowed) {
        expect(result.reason.code).toBe('MEMBER_SUSPENDED');
      }
    });
  });

  describe('borrow limit rule (configurable, default 3)', () => {
    it('denies BORROW_LIMIT_EXCEEDED when active loans reach the configured limit (3)', async () => {
      const useCase = new CanBorrowUseCase(
        makeBookRepo(),
        makeMemberRepo(),
        makeLoanRepo([makeLoan('l1'), makeLoan('l2'), makeLoan('l3')]),
        new LoanEligibilityService(3),
      );

      const result = await useCase.execute({ memberId: 'member-1', bookId: 'book-1' });
      expect(result.allowed).toBe(false);
      if (!result.allowed) {
        expect(result.reason.code).toBe('BORROW_LIMIT_EXCEEDED');
        expect(result.reason.message).toContain('3');
      }
    });

    it('allows when active loan count is below the limit', async () => {
      const useCase = new CanBorrowUseCase(
        makeBookRepo(),
        makeMemberRepo(),
        makeLoanRepo([makeLoan('l1'), makeLoan('l2')]),
        new LoanEligibilityService(3),
      );

      const result = await useCase.execute({ memberId: 'member-1', bookId: 'book-1' });
      expect(result).toEqual({ allowed: true });
    });

    it('respects an alternative configured limit (5)', async () => {
      const fiveLoans = [
        makeLoan('l1'),
        makeLoan('l2'),
        makeLoan('l3'),
        makeLoan('l4'),
        makeLoan('l5'),
      ];

      const tight = new CanBorrowUseCase(
        makeBookRepo(),
        makeMemberRepo(),
        makeLoanRepo(fiveLoans),
        new LoanEligibilityService(3),
      );
      expect((await tight.execute({ memberId: 'member-1', bookId: 'book-1' })).allowed).toBe(false);

      const generous = new CanBorrowUseCase(
        makeBookRepo(),
        makeMemberRepo(),
        makeLoanRepo(fiveLoans),
        new LoanEligibilityService(10),
      );
      expect((await generous.execute({ memberId: 'member-1', bookId: 'book-1' })).allowed).toBe(
        true,
      );
    });
  });

  describe('available copies rule (totalCopies - activeLoanCount)', () => {
    it('denies NO_COPIES_AVAILABLE when activeLoanCount equals totalCopies', async () => {
      const book = makeBook({ totalCopies: 2, activeLoanCount: 2 });
      expect(book.availableCopies).toBe(0);

      const useCase = new CanBorrowUseCase(
        makeBookRepo(book),
        makeMemberRepo(),
        makeLoanRepo([]),
        new LoanEligibilityService(3),
      );

      const result = await useCase.execute({ memberId: 'member-1', bookId: 'book-1' });
      expect(result.allowed).toBe(false);
      if (!result.allowed) {
        expect(result.reason.code).toBe('NO_COPIES_AVAILABLE');
        expect(result.reason.message).toContain('Clean Code');
      }
    });

    it('allows when there is at least one free copy (5 total - 4 active = 1 available)', async () => {
      const book = makeBook({ totalCopies: 5, activeLoanCount: 4 });
      expect(book.availableCopies).toBe(1);

      const useCase = new CanBorrowUseCase(
        makeBookRepo(book),
        makeMemberRepo(),
        makeLoanRepo([]),
        new LoanEligibilityService(3),
      );

      const result = await useCase.execute({ memberId: 'member-1', bookId: 'book-1' });
      expect(result).toEqual({ allowed: true });
    });

    it('availableCopies is exactly total - active across multiple values', () => {
      expect(makeBook({ totalCopies: 1, activeLoanCount: 0 }).availableCopies).toBe(1);
      expect(makeBook({ totalCopies: 5, activeLoanCount: 3 }).availableCopies).toBe(2);
      expect(makeBook({ totalCopies: 10, activeLoanCount: 10 }).availableCopies).toBe(0);
    });
  });
});
