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
