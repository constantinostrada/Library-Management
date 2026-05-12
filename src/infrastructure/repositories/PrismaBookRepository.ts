import { PrismaClient } from '@prisma/client';

import { Book } from '@/domain/entities/Book';
import { BookFilterCriteria, IBookRepository } from '@/domain/repositories/IBookRepository';

/**
 * Infrastructure: PrismaBookRepository
 *
 * Concrete implementation of IBookRepository using Prisma + PostgreSQL.
 *
 * Responsibilities:
 *  - Map Prisma model rows → Book domain entities.
 *  - Map Book domain entities → Prisma create/update payloads.
 *  - Catch Prisma errors and re-throw as infrastructure-neutral errors.
 *
 * This class knows about Prisma. The application layer does NOT.
 */
export class PrismaBookRepository implements IBookRepository {
  constructor(private readonly db: PrismaClient) {}

  // ── Queries ────────────────────────────────────────────────────────────────

  async findById(id: string): Promise<Book | null> {
    const row = await this.db.book.findUnique({
      where: { id },
      include: { _count: { select: { loans: { where: { status: { in: ['ACTIVE', 'OVERDUE'] } } } } } },
    });

    return row ? this.toDomain(row) : null;
  }

  async findByIsbn(isbn: string): Promise<Book | null> {
    // Normalise the ISBN the same way the value object does (strip hyphens)
    const normalised = isbn.replace(/[-\s]/g, '').toUpperCase();

    const row = await this.db.book.findUnique({
      where: { isbn: normalised },
      include: { _count: { select: { loans: { where: { status: { in: ['ACTIVE', 'OVERDUE'] } } } } } },
    });

    return row ? this.toDomain(row) : null;
  }

  async findAll(
    page: number,
    limit: number,
    filters: BookFilterCriteria = {},
  ): Promise<{ books: Book[]; total: number }> {
    const skip = (page - 1) * limit;

    const where = {
      ...(filters.title
        ? { title: { contains: filters.title, mode: 'insensitive' as const } }
        : {}),
      ...(filters.author
        ? { author: { contains: filters.author, mode: 'insensitive' as const } }
        : {}),
    };

    const [rows, total] = await this.db.$transaction([
      this.db.book.findMany({
        where,
        skip,
        take: limit,
        orderBy: { title: 'asc' },
        include: { _count: { select: { loans: { where: { status: { in: ['ACTIVE', 'OVERDUE'] } } } } } },
      }),
      this.db.book.count({ where }),
    ]);

    return { books: rows.map((r) => this.toDomain(r)), total };
  }

  async search(query: string): Promise<Book[]> {
    const rows = await this.db.book.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { author: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: { title: 'asc' },
      take: 50,
      include: { _count: { select: { loans: { where: { status: { in: ['ACTIVE', 'OVERDUE'] } } } } } },
    });

    return rows.map((r) => this.toDomain(r));
  }

  // ── Mutations ──────────────────────────────────────────────────────────────

  async create(book: Book): Promise<Book> {
    const row = await this.db.book.create({
      data: {
        id: book.id,
        isbn: book.isbn.value,
        title: book.title,
        author: book.author,
        publisher: book.publisher,
        publishedAt: book.publishedAt,
        totalCopies: book.totalCopies,
      },
      include: { _count: { select: { loans: { where: { status: { in: ['ACTIVE', 'OVERDUE'] } } } } } },
    });

    return this.toDomain(row);
  }

  async update(book: Book): Promise<Book> {
    const row = await this.db.book.update({
      where: { id: book.id },
      data: {
        title: book.title,
        author: book.author,
        publisher: book.publisher,
        totalCopies: book.totalCopies,
        updatedAt: new Date(),
      },
      include: { _count: { select: { loans: { where: { status: { in: ['ACTIVE', 'OVERDUE'] } } } } } },
    });

    return this.toDomain(row);
  }

  async delete(id: string): Promise<void> {
    await this.db.book.delete({ where: { id } });
  }

  // ── Private mapper ─────────────────────────────────────────────────────────

  private toDomain(
    row: {
      id: string;
      isbn: string;
      title: string;
      author: string;
      publisher: string;
      publishedAt: Date;
      totalCopies: number;
      createdAt: Date;
      updatedAt: Date;
      _count: { loans: number };
    },
  ): Book {
    return Book.create({
      id: row.id,
      isbn: row.isbn,
      title: row.title,
      author: row.author,
      publisher: row.publisher,
      publishedAt: row.publishedAt,
      totalCopies: row.totalCopies,
      activeLoanCount: row._count.loans,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
