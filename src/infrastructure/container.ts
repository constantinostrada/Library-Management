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
import { CanBorrowUseCase } from '@/application/use-cases/loan/CanBorrowUseCase';
import { CountActiveLoansByMemberUseCase } from '@/application/use-cases/loan/CountActiveLoansByMemberUseCase';
import { ListLoansUseCase } from '@/application/use-cases/loan/ListLoansUseCase';
import { ReturnBookUseCase } from '@/application/use-cases/loan/ReturnBookUseCase';
import { GetMemberLoansUseCase } from '@/application/use-cases/member/GetMemberLoansUseCase';
import { GetMemberUseCase } from '@/application/use-cases/member/GetMemberUseCase';
import { ListMembersUseCase } from '@/application/use-cases/member/ListMembersUseCase';
import { RegisterMemberUseCase } from '@/application/use-cases/member/RegisterMemberUseCase';
import { UpdateMemberUseCase } from '@/application/use-cases/member/UpdateMemberUseCase';

import { prisma } from './database/prismaClient';
import { PrismaBookRepository } from './repositories/PrismaBookRepository';
import { PrismaLoanRepository } from './repositories/PrismaLoanRepository';
import { PrismaMemberRepository } from './repositories/PrismaMemberRepository';

// ── Repositories ───────────────────────────────────────────────────────────────
const bookRepository = new PrismaBookRepository(prisma);
const memberRepository = new PrismaMemberRepository(prisma);
const loanRepository = new PrismaLoanRepository(prisma);

// ── Domain Services ────────────────────────────────────────────────────────────
// BORROW_LIMIT controls the max concurrent active loans per member (default 3).
const parsedBorrowLimit = parseInt(process.env.BORROW_LIMIT ?? '3', 10);
const borrowLimit =
  Number.isInteger(parsedBorrowLimit) && parsedBorrowLimit > 0 ? parsedBorrowLimit : 3;
const eligibilityService = new LoanEligibilityService(borrowLimit);

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
export const updateMemberUseCase = new UpdateMemberUseCase(memberRepository);
export const getMemberLoansUseCase = new GetMemberLoansUseCase(memberRepository, loanRepository);

// ── Loan Use Cases ─────────────────────────────────────────────────────────────
export const borrowBookUseCase = new BorrowBookUseCase(
  bookRepository,
  memberRepository,
  loanRepository,
  eligibilityService,
);
export const returnBookUseCase = new ReturnBookUseCase(loanRepository, bookRepository);
export const listLoansUseCase = new ListLoansUseCase(loanRepository);
export const countActiveLoansByMemberUseCase = new CountActiveLoansByMemberUseCase(loanRepository);
export const canBorrowUseCase = new CanBorrowUseCase(
  bookRepository,
  memberRepository,
  loanRepository,
  eligibilityService,
);
