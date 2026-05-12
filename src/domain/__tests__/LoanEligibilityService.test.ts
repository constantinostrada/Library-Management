import { Book } from '../entities/Book';
import { Member } from '../entities/Member';
import { BorrowLimitExceededError } from '../errors/BorrowLimitExceededError';
import { MemberSuspendedError } from '../errors/MemberSuspendedError';
import { NoCopiesAvailableError } from '../errors/NoCopiesAvailableError';
import { LoanEligibilityService } from '../services/LoanEligibilityService';

const makeBook = (totalCopies: number, activeLoanCount = 0): Book =>
  Book.create({
    id: 'b1',
    isbn: '9780132350884',
    title: 'Clean Code',
    author: 'Robert C. Martin',
    publisher: 'Prentice Hall',
    publishedAt: new Date(),
    totalCopies,
    activeLoanCount,
  });

const makeMember = (status: 'ACTIVE' | 'SUSPENDED' | 'CLOSED' = 'ACTIVE'): Member =>
  Member.create({ id: 'm1', email: 'alice@example.com', name: 'Alice', status });

describe('LoanEligibilityService', () => {
  const service = new LoanEligibilityService(5);

  describe('assertCanBorrow (throwing variant)', () => {
    it('allows an ACTIVE member to borrow an available book', () => {
      expect(() =>
        service.assertCanBorrow({
          member: makeMember('ACTIVE'),
          book: makeBook(3, 0),
          currentActiveLoanCount: 0,
        }),
      ).not.toThrow();
    });

    it('throws MemberSuspendedError when member is SUSPENDED', () => {
      expect(() =>
        service.assertCanBorrow({
          member: makeMember('SUSPENDED'),
          book: makeBook(3),
          currentActiveLoanCount: 0,
        }),
      ).toThrow(MemberSuspendedError);
    });

    it('throws MemberSuspendedError when member is CLOSED', () => {
      expect(() =>
        service.assertCanBorrow({
          member: makeMember('CLOSED'),
          book: makeBook(3),
          currentActiveLoanCount: 0,
        }),
      ).toThrow(MemberSuspendedError);
    });

    it('throws NoCopiesAvailableError when all copies are on loan', () => {
      expect(() =>
        service.assertCanBorrow({
          member: makeMember('ACTIVE'),
          book: makeBook(2, 2), // all copies out
          currentActiveLoanCount: 0,
        }),
      ).toThrow(NoCopiesAvailableError);
    });

    it('throws BorrowLimitExceededError when member is at borrow limit', () => {
      expect(() =>
        service.assertCanBorrow({
          member: makeMember('ACTIVE'),
          book: makeBook(3),
          currentActiveLoanCount: 5, // at limit
        }),
      ).toThrow(BorrowLimitExceededError);
    });
  });

  describe('check (non-throwing variant)', () => {
    it('returns { allowed: true } when all rules pass', () => {
      const result = service.check({
        member: makeMember('ACTIVE'),
        book: makeBook(3, 0),
        currentActiveLoanCount: 0,
      });
      expect(result).toEqual({ allowed: true });
    });

    describe('member suspended rule', () => {
      it('returns MEMBER_SUSPENDED with descriptive message when member is SUSPENDED', () => {
        const result = service.check({
          member: makeMember('SUSPENDED'),
          book: makeBook(3, 0),
          currentActiveLoanCount: 0,
        });
        expect(result.allowed).toBe(false);
        if (!result.allowed) {
          expect(result.reason.code).toBe('MEMBER_SUSPENDED');
          expect(result.reason.message).toContain('m1');
          expect(result.reason.message).toMatch(/suspended|closed/i);
        }
      });

      it('returns MEMBER_SUSPENDED when member is CLOSED', () => {
        const result = service.check({
          member: makeMember('CLOSED'),
          book: makeBook(3, 0),
          currentActiveLoanCount: 0,
        });
        expect(result.allowed).toBe(false);
        if (!result.allowed) {
          expect(result.reason.code).toBe('MEMBER_SUSPENDED');
        }
      });
    });

    describe('available copies rule', () => {
      it('returns NO_COPIES_AVAILABLE when activeLoanCount equals totalCopies', () => {
        const book = makeBook(2, 2); // 2 total / 2 active → 0 available
        expect(book.availableCopies).toBe(0);
        expect(book.isAvailable).toBe(false);

        const result = service.check({
          member: makeMember('ACTIVE'),
          book,
          currentActiveLoanCount: 0,
        });
        expect(result.allowed).toBe(false);
        if (!result.allowed) {
          expect(result.reason.code).toBe('NO_COPIES_AVAILABLE');
          expect(result.reason.message).toContain('Clean Code');
        }
      });

      it('availableCopies = totalCopies - activeLoanCount (verified across values)', () => {
        expect(makeBook(5, 0).availableCopies).toBe(5);
        expect(makeBook(5, 1).availableCopies).toBe(4);
        expect(makeBook(5, 5).availableCopies).toBe(0);
        expect(makeBook(10, 7).availableCopies).toBe(3);
      });

      it('allows when at least one copy is free (4/5 active)', () => {
        const result = service.check({
          member: makeMember('ACTIVE'),
          book: makeBook(5, 4), // 1 available
          currentActiveLoanCount: 0,
        });
        expect(result).toEqual({ allowed: true });
      });
    });

    describe('borrow limit rule', () => {
      it('returns BORROW_LIMIT_EXCEEDED when active loans equal the limit', () => {
        const result = service.check({
          member: makeMember('ACTIVE'),
          book: makeBook(3, 0),
          currentActiveLoanCount: 5,
        });
        expect(result.allowed).toBe(false);
        if (!result.allowed) {
          expect(result.reason.code).toBe('BORROW_LIMIT_EXCEEDED');
          expect(result.reason.message).toContain('5');
        }
      });

      it('respects a configurable borrow limit (3)', () => {
        const tightService = new LoanEligibilityService(3);
        const result = tightService.check({
          member: makeMember('ACTIVE'),
          book: makeBook(5, 0),
          currentActiveLoanCount: 3,
        });
        expect(result.allowed).toBe(false);
        if (!result.allowed) {
          expect(result.reason.code).toBe('BORROW_LIMIT_EXCEEDED');
          expect(result.reason.message).toContain('3');
        }
      });

      it('default constructor sets borrow limit to 3', () => {
        const defaultService = new LoanEligibilityService();
        expect(defaultService.borrowLimit).toBe(3);

        const result = defaultService.check({
          member: makeMember('ACTIVE'),
          book: makeBook(5, 0),
          currentActiveLoanCount: 3,
        });
        expect(result.allowed).toBe(false);
      });
    });

    it('member suspended takes precedence over no-copies and limit', () => {
      const result = service.check({
        member: makeMember('SUSPENDED'),
        book: makeBook(1, 1), // also no copies
        currentActiveLoanCount: 99, // also over limit
      });
      expect(result.allowed).toBe(false);
      if (!result.allowed) {
        expect(result.reason.code).toBe('MEMBER_SUSPENDED');
      }
    });
  });
});
