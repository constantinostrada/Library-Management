/**
 * Composition Root / DI Container
 *
 * This is the ONLY place in the codebase where concrete infrastructure
 * classes are instantiated and wired to use cases.
 *
 * Controllers import use cases from here — they never instantiate anything
 * themselves, and they never import Prisma, repositories, or domain services.
 *
 * This file lives in infrastructure because it is the only layer that knows
 * about ALL concrete implementations.
 */
import { LoanEligibilityService } from '@/domain/services/LoanEligibilityService';

import { AddBookUseCase } from '@/application/use-cases/book/AddBookUseCase';
import { DeleteBookUseCase } from '@/application/use-cases/book/DeleteBookUseCase';
import { GetBookUseCase } from '@/application/use-cases/book/GetBookUseCase';
import { ListBooksUseCase } from '@/application/use-cases/book/ListBooksUseCase';
import { SearchBooksUseCase } from '@/application/use-cases/book/SearchBooksUseCase';
import { UpdateBookUseCase } from '@/application/use-cases/book/UpdateBookUseCase';
import { BorrowBookUseCase } from '@/application/use-cases/loan/BorrowBookUseCase';
import { ListLoansUseCase } from '@/application/use-cases/loan/ListLoansUseCase';
import { ReturnBookUseCase } from '@/application/use-cases/loan/ReturnBookUseCase';
import { GetMemberUseCase } from '@/application/use-cases/member/GetMemberUseCase';
import { ListMembersUseCase } from '@/application/use-cases/member/ListMembersUseCase';
import { RegisterMemberUseCase } from '@/application/use-cases/member/RegisterMemberUseCase';

import { prisma } from './database/prismaClient';
import { PrismaBookRepository } from './repositories/PrismaBookRepository';
import { PrismaLoanRepository } from './repositories/PrismaLoanRepository';
import { PrismaMemberRepository } from './repositories/PrismaMemberRepository';

// ── Repositories ───────────────────────────────────────────────────────────────
const bookRepository = new PrismaBookRepository(prisma);
const memberRepository = new PrismaMemberRepository(prisma);
const loanRepository = new PrismaLoanRepository(prisma);

// ── Domain Services ────────────────────────────────────────────────────────────
const maxBooksPerMember = parseInt(process.env.MAX_BOOKS_PER_MEMBER ?? '5', 10);
const eligibilityService = new LoanEligibilityService(maxBooksPerMember);

// ── Book Use Cases ─────────────────────────────────────────────────────────────
export const addBookUseCase = new AddBookUseCase(bookRepository);
export const getBookUseCase = new GetBookUseCase(bookRepository);
export const listBooksUseCase = new ListBooksUseCase(bookRepository);
export const searchBooksUseCase = new SearchBooksUseCase(bookRepository);
export const updateBookUseCase = new UpdateBookUseCase(bookRepository);
export const deleteBookUseCase = new DeleteBookUseCase(bookRepository, loanRepository);

// ── Member Use Cases ───────────────────────────────────────────────────────────
export const registerMemberUseCase = new RegisterMemberUseCase(memberRepository);
export const getMemberUseCase = new GetMemberUseCase(memberRepository);
export const listMembersUseCase = new ListMembersUseCase(memberRepository);

// ── Loan Use Cases ─────────────────────────────────────────────────────────────
export const borrowBookUseCase = new BorrowBookUseCase(
  bookRepository,
  memberRepository,
  loanRepository,
  eligibilityService,
);
export const returnBookUseCase = new ReturnBookUseCase(loanRepository, bookRepository);
export const listLoansUseCase = new ListLoansUseCase(loanRepository);
