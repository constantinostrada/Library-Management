import { PrismaClient } from '@prisma/client';

import { Member, MemberStatus } from '@/domain/entities/Member';
import { IMemberRepository, MemberFilterCriteria } from '@/domain/repositories/IMemberRepository';

/**
 * Infrastructure: PrismaMemberRepository
 *
 * Concrete implementation of IMemberRepository using Prisma + PostgreSQL.
 */
export class PrismaMemberRepository implements IMemberRepository {
  constructor(private readonly db: PrismaClient) {}

  // ── Queries ────────────────────────────────────────────────────────────────

  async findById(id: string): Promise<Member | null> {
    const row = await this.db.member.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findByEmail(email: string): Promise<Member | null> {
    const row = await this.db.member.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
    return row ? this.toDomain(row) : null;
  }

  async findAll(
    page: number,
    limit: number,
    filters?: MemberFilterCriteria,
  ): Promise<{ members: Member[]; total: number }> {
    const skip = (page - 1) * limit;
    const where = filters?.status ? { status: filters.status } : undefined;

    const [rows, total] = await this.db.$transaction([
      this.db.member.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.db.member.count({ where }),
    ]);

    return { members: rows.map((r) => this.toDomain(r)), total };
  }

  // ── Mutations ──────────────────────────────────────────────────────────────

  async create(member: Member): Promise<Member> {
    const row = await this.db.member.create({
      data: {
        id: member.id,
        email: member.email.value,
        name: member.name,
        status: member.status,
      },
    });
    return this.toDomain(row);
  }

  async update(member: Member): Promise<Member> {
    const row = await this.db.member.update({
      where: { id: member.id },
      data: {
        name: member.name,
        status: member.status,
        updatedAt: new Date(),
      },
    });
    return this.toDomain(row);
  }

  async delete(id: string): Promise<void> {
    await this.db.member.delete({ where: { id } });
  }

  // ── Private mapper ─────────────────────────────────────────────────────────

  private toDomain(row: {
    id: string;
    email: string;
    name: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  }): Member {
    return Member.create({
      id: row.id,
      email: row.email,
      name: row.name,
      status: row.status as MemberStatus,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
