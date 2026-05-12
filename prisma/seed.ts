/**
 * Prisma Seed Script
 * Populates the database with deterministic sample data for development.
 *
 * Run with: npm run db:seed
 * Idempotent — re-runnable thanks to upsert on unique fields (book.isbn, member.email).
 * Loans are only created on a fresh seed (skipped when at least one loan already exists)
 * so re-seeding doesn't pile up duplicate active loans.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const BOOKS = [
  {
    isbn: '978-0-13-110362-7',
    title: 'The C Programming Language',
    author: 'Brian W. Kernighan, Dennis M. Ritchie',
    publisher: 'Prentice Hall',
    publishedAt: new Date('1988-04-01'),
    totalCopies: 5,
  },
  {
    isbn: '978-0-201-63361-0',
    title: 'Design Patterns: Elements of Reusable Object-Oriented Software',
    author: 'Gang of Four',
    publisher: 'Addison-Wesley',
    publishedAt: new Date('1994-10-31'),
    totalCopies: 3,
  },
  {
    isbn: '978-0-13-468599-1',
    title: 'Clean Architecture',
    author: 'Robert C. Martin',
    publisher: 'Prentice Hall',
    publishedAt: new Date('2017-09-10'),
    totalCopies: 4,
  },
  {
    isbn: '978-0-13-235088-4',
    title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
    author: 'Robert C. Martin',
    publisher: 'Prentice Hall',
    publishedAt: new Date('2008-08-11'),
    totalCopies: 6,
  },
  {
    isbn: '978-0-201-89683-3',
    title: 'The Art of Computer Programming, Vol. 1',
    author: 'Donald E. Knuth',
    publisher: 'Addison-Wesley',
    publishedAt: new Date('1997-07-17'),
    totalCopies: 2,
  },
  {
    isbn: '978-0-321-12521-7',
    title: 'Domain-Driven Design: Tackling Complexity in the Heart of Software',
    author: 'Eric Evans',
    publisher: 'Addison-Wesley',
    publishedAt: new Date('2003-08-30'),
    totalCopies: 4,
  },
];

const MEMBERS = [
  { email: 'alice@example.com', name: 'Alice Johnson', status: 'ACTIVE' as const },
  { email: 'bob@example.com', name: 'Bob Smith', status: 'ACTIVE' as const },
  { email: 'carol@example.com', name: 'Carol Martinez', status: 'ACTIVE' as const },
  { email: 'dave@example.com', name: 'Dave Wilson', status: 'SUSPENDED' as const },
];

async function main(): Promise<void> {
  console.warn('🌱 Seeding database...');

  // ── Books ────────────────────────────────────────────────────────────────
  const books = await Promise.all(
    BOOKS.map((data) =>
      prisma.book.upsert({
        where: { isbn: data.isbn },
        update: {},
        create: data,
      }),
    ),
  );

  // ── Members ───────────────────────────────────────────────────────────────
  const members = await Promise.all(
    MEMBERS.map((data) =>
      prisma.member.upsert({
        where: { email: data.email },
        update: {},
        create: data,
      }),
    ),
  );

  // ── Loans ─────────────────────────────────────────────────────────────────
  // Only seed loans when the table is empty, so re-runs stay idempotent.
  const existingLoans = await prisma.loan.count();
  if (existingLoans === 0) {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);

    await prisma.loan.create({
      data: {
        bookId: books[0].id,
        memberId: members[0].id,
        dueAt: dueDate,
        status: 'ACTIVE',
      },
    });

    await prisma.loan.create({
      data: {
        bookId: books[1].id,
        memberId: members[1].id,
        dueAt: dueDate,
        status: 'ACTIVE',
      },
    });

    await prisma.loan.create({
      data: {
        bookId: books[3].id,
        memberId: members[2].id,
        dueAt: dueDate,
        status: 'ACTIVE',
      },
    });
  }

  console.warn('✅ Seed complete.');
  console.warn(`  📚 Books:   ${books.length}`);
  console.warn(`  👥 Members: ${members.length}`);
  console.warn(`  🔖 Loans:   ${existingLoans === 0 ? 3 : existingLoans} (existing)`);
}

main()
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
