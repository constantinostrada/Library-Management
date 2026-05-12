import { PrismaClient } from '@prisma/client';

import { Loan, LoanStatus } from '@/domain/entities/Loan';
import { ILoanRepository } from '@/domain/repositories/ILoanRepository';

/**
 * Infrastructure: PrismaLoanRepository
 *
 * Concrete implementation of ILoanRepository using Prisma + PostgreSQL.
 */
export class PrismaLoanRepository implements ILoanRepository {
  constructor(private readonly db: PrismaClient) {}

  // ── Queries ────────────────────────────────────────────────────────────────

  async findById(id: string): Promise<Loan | null> {
    const row = await this.db.loan.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findActiveLoansByMemberId(memberId: string): Promise<Loan[]> {
    const rows = await this.db.loan.findMany({
      where: {
        memberId,
        status: { in: ['ACTIVE', 'OVERDUE'] },
      },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async findLoansByMemberId(memberId: string): Promise<Loan[]> {
    const rows = await this.db.loan.findMany({
      where: { memberId },
      orderBy: { borrowedAt: 'desc' },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async findLoansByBookId(bookId: string): Promise<Loan[]> {
    const rows = await this.db.loan.findMany({
      where: { bookId },
      orderBy: { borrowedAt: 'desc' },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async findOverdueLoans(): Promise<Loan[]> {
    const now = new Date();
    const rows = await this.db.loan.findMany({
      where: {
        status: 'ACTIVE',
        dueAt: { lt: now },
      },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async findAll(page: number, limit: number): Promise<{ loans: Loan[]; total: number }> {
    const skip = (page - 1) * limit;

    const [rows, total] = await this.db.$transaction([
      this.db.loan.findMany({
        skip,
        take: limit,
        orderBy: { borrowedAt: 'desc' },
      }),
      this.db.loan.count(),
    ]);

    return { loans: rows.map((r) => this.toDomain(r)), total };
  }

  // ── Mutations ──────────────────────────────────────────────────────────────

  async create(loan: Loan): Promise<Loan> {
    const row = await this.db.loan.create({
      data: {
        id: loan.id,
        bookId: loan.bookId,
        memberId: loan.memberId,
        borrowedAt: loan.borrowedAt,
        dueAt: loan.dueAt,
        returnedAt: loan.returnedAt,
        status: loan.status,
      },
    });
    return this.toDomain(row);
  }

  async update(loan: Loan): Promise<Loan> {
    const row = await this.db.loan.update({
      where: { id: loan.id },
      data: {
        returnedAt: loan.returnedAt,
        status: loan.status,
      },
    });
    return this.toDomain(row);
  }

  // ── Private mapper ─────────────────────────────────────────────────────────

  private toDomain(row: {
    id: string;
    bookId: string;
    memberId: string;
    borrowedAt: Date;
    dueAt: Date;
    returnedAt: Date | null;
    status: string;
  }): Loan {
    return Loan.create({
      id: row.id,
      bookId: row.bookId,
      memberId: row.memberId,
      borrowedAt: row.borrowedAt,
      dueAt: row.dueAt,
      returnedAt: row.returnedAt,
      status: row.status as LoanStatus,
    });
  }
}
