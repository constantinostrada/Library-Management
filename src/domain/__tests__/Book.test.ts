import { Book } from '../entities/Book';

const baseParams = {
  id: 'book-1',
  isbn: '9780132350884',
  title: 'Clean Code',
  author: 'Robert C. Martin',
  publisher: 'Prentice Hall',
  publishedAt: new Date('2008-08-01'),
  totalCopies: 3,
};

describe('Book entity', () => {
  it('creates a book with correct initial state', () => {
    const book = Book.create(baseParams);

    expect(book.title).toBe('Clean Code');
    expect(book.totalCopies).toBe(3);
    expect(book.activeLoanCount).toBe(0);
    expect(book.availableCopies).toBe(3);
    expect(book.isAvailable).toBe(true);
  });

  it('correctly tracks availability after incrementing loan count', () => {
    const book = Book.create({ ...baseParams, totalCopies: 1 });

    book.incrementActiveLoanCount();

    expect(book.isAvailable).toBe(false);
    expect(book.availableCopies).toBe(0);
  });

  it('throws when incrementing beyond total copies', () => {
    const book = Book.create({ ...baseParams, totalCopies: 1 });
    book.incrementActiveLoanCount();

    expect(() => book.incrementActiveLoanCount()).toThrow();
  });

  it('decrements the active loan count on return', () => {
    const book = Book.create({ ...baseParams, activeLoanCount: 2 });
    book.decrementActiveLoanCount();

    expect(book.activeLoanCount).toBe(1);
    expect(book.availableCopies).toBe(2);
  });

  it('throws when decrementing below zero', () => {
    const book = Book.create(baseParams);
    expect(() => book.decrementActiveLoanCount()).toThrow();
  });

  it('throws for an empty title', () => {
    expect(() => Book.create({ ...baseParams, title: '' })).toThrow();
  });

  it('throws for zero total copies', () => {
    expect(() => Book.create({ ...baseParams, totalCopies: 0 })).toThrow();
  });
});
