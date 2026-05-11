/**
 * Prisma Seed Script
 * Populates the database with initial sample data for development.
 * Run with: npm run db:seed
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.warn('🌱 Seeding database...');

  // ── Books ────────────────────────────────────────────────────────────────
  const book1 = await prisma.book.upsert({
    where: { isbn: '978-0-13-110362-7' },
    update: {},
    create: {
      isbn: '978-0-13-110362-7',
      title: 'The C Programming Language',
      author: 'Brian W. Kernighan, Dennis M. Ritchie',
      publisher: 'Prentice Hall',
      publishedAt: new Date('1988-04-01'),
      totalCopies: 5,
    },
  });

  const book2 = await prisma.book.upsert({
    where: { isbn: '978-0-201-63361-0' },
    update: {},
    create: {
      isbn: '978-0-201-63361-0',
      title: 'Design Patterns: Elements of Reusable Object-Oriented Software',
      author: 'Gang of Four',
      publisher: 'Addison-Wesley',
      publishedAt: new Date('1994-10-31'),
      totalCopies: 3,
    },
  });

  const book3 = await prisma.book.upsert({
    where: { isbn: '978-0-13-468599-1' },
    update: {},
    create: {
      isbn: '978-0-13-468599-1',
      title: 'Clean Architecture',
      author: 'Robert C. Martin',
      publisher: 'Prentice Hall',
      publishedAt: new Date('2017-09-10'),
      totalCopies: 4,
    },
  });

  // ── Members ───────────────────────────────────────────────────────────────
  const member1 = await prisma.member.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: {
      email: 'alice@example.com',
      name: 'Alice Johnson',
      status: 'ACTIVE',
    },
  });

  const member2 = await prisma.member.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: {
      email: 'bob@example.com',
      name: 'Bob Smith',
      status: 'ACTIVE',
    },
  });

  // ── Loans ─────────────────────────────────────────────────────────────────
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 14);

  await prisma.loan.create({
    data: {
      bookId: book1.id,
      memberId: member1.id,
      dueAt: dueDate,
      status: 'ACTIVE',
    },
  });

  await prisma.loan.create({
    data: {
      bookId: book2.id,
      memberId: member2.id,
      dueAt: dueDate,
      status: 'ACTIVE',
    },
  });

  console.warn('✅ Seed complete.');
  console.warn(`  📚 Books:   ${[book1.title, book2.title, book3.title].join(', ')}`);
  console.warn(`  👥 Members: ${[member1.name, member2.name].join(', ')}`);
}

main()
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
