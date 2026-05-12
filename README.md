# Library Management

A production-ready **Library Management System** built with **Next.js 14**, **TypeScript**, **PostgreSQL**, **Prisma ORM**, and **Tailwind CSS** — following strict **Clean Architecture** principles.

---

## Table of Contents

1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Getting Started](#getting-started)
4. [Project Structure](#project-structure)
5. [Clean Architecture Layers](#clean-architecture-layers)
6. [API Reference](#api-reference)
7. [Scripts](#scripts)
8. [Environment Variables](#environment-variables)
9. [Testing](#testing)
10. [Contributing](#contributing)

---

## Features

- 📚 **Book Catalogue** — add books with ISBN validation, track copies and availability
- 👥 **Member Management** — register members, manage account status (Active / Suspended / Closed)
- 🔖 **Loan Lifecycle** — borrow and return books with due-date tracking and overdue detection
- 🔍 **Search** — full-text search over titles and authors
- 📄 **Pagination** — all list endpoints support page / limit query params
- ✅ **Validated API** — Zod schemas on every mutation endpoint
- 🛡️ **Domain safety** — business invariants enforced inside domain entities and value objects
- 🧪 **Tested** — unit tests for domain logic and use cases with mock repositories

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 14](https://nextjs.org) (App Router) |
| Language | [TypeScript 5](https://www.typescriptlang.org) |
| Database | [PostgreSQL](https://www.postgresql.org) |
| ORM | [Prisma 5](https://www.prisma.io) |
| Styling | [Tailwind CSS 3](https://tailwindcss.com) |
| Validation | [Zod](https://zod.dev) |
| Testing | [Jest](https://jestjs.io) + [ts-jest](https://kulshekhar.github.io/ts-jest/) |
| Linting | [ESLint](https://eslint.org) + [@typescript-eslint](https://typescript-eslint.io) |
| Formatting | [Prettier](https://prettier.io) |

---

## Getting Started

### Prerequisites

- Node.js ≥ 20
- PostgreSQL ≥ 15 running locally (or a connection string to a remote instance)
- `npm` ≥ 10

### 1. Clone & install

```bash
git clone <repo-url>
cd library-management
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local` and set your `DATABASE_URL`:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/library_management?schema=public"
```

### 3. Set up the database

```bash
# Run migrations (creates the schema in your PostgreSQL database)
npm run db:migrate

# Seed the database with sample data (6 books, 4 members, 3 active loans)
npm run db:seed
```

To wipe the database and re-run all migrations + seeds in one shot (useful when
something gets into a bad state):

```bash
npm run db:reset
```

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Project Structure

```
library-management/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Development seed data
│
├── src/
│   ├── domain/                # ① Business rules & entities
│   │   ├── entities/
│   │   ├── value-objects/
│   │   ├── repositories/      # Interfaces only (no implementation)
│   │   ├── services/
│   │   └── errors/
│   │
│   ├── application/           # ② Use cases & DTOs
│   │   ├── use-cases/
│   │   │   ├── book/
│   │   │   ├── member/
│   │   │   └── loan/
│   │   ├── dtos/
│   │   └── mappers/
│   │
│   ├── infrastructure/        # ③ DB, external APIs
│   │   ├── database/          # Prisma client singleton
│   │   ├── repositories/      # Prisma implementations of domain interfaces
│   │   └── container.ts       # Composition root (DI wiring)
│   │
│   ├── interfaces/            # ④ HTTP handlers & validators
│   │   └── http/
│   │       ├── helpers/
│   │       └── validators/
│   │
│   ├── components/            # Shared presentational React components
│   │                          #   (e.g. TailwindTest) — pure UI, no business logic
│   │
│   ├── lib/                   # Cross-cutting utilities (e.g. cn() class merger)
│   │                          #   — framework-agnostic helpers shared across layers
│   │
│   └── app/                   # Next.js App Router
│       ├── api/               # Route handlers (call use cases)
│       ├── books/             # UI pages
│       ├── members/
│       ├── loans/
│       ├── layout.tsx
│       └── page.tsx
│
├── .env.example
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Clean Architecture Layers

This project enforces a strict **dependency rule**: dependencies always point inward. Outer layers may import from inner layers, never the reverse.

```
┌──────────────────────────────────────┐
│  interfaces  (HTTP, UI, CLI)         │  → knows about: application
│  infrastructure (DB, external APIs)  │  → knows about: domain, application
│  application  (Use Cases, DTOs)      │  → knows about: domain
│  domain       (Entities, VO, Rules)  │  → knows about: NOTHING external
└──────────────────────────────────────┘
```

### `src/domain/` — The Core

The heart of the application. **Zero external dependencies.**

- **Entities** (`Book`, `Member`, `Loan`) — objects with identity that protect their own invariants.
- **Value Objects** (`ISBN`, `Email`, `LoanDuration`) — immutable, validated, equality by value.
- **Repository Interfaces** (`IBookRepository`, etc.) — define *what* persistence operations exist, not *how* they work.
- **Domain Services** (`LoanEligibilityService`) — business logic that spans multiple entities.
- **Domain Errors** — typed, machine-readable error codes for every rule violation.

### `src/application/` — Orchestration

Coordinates domain objects to fulfil user stories. Knows *what* to do, not *how*.

- **Use Cases** — one class per operation, each with a single `execute(dto)` method.
- **DTOs** — plain data contracts; use cases accept and return DTOs, never raw entities.
- **Mappers** — translate domain entities → DTOs at the application boundary.

### `src/infrastructure/` — I/O

All side-effects live here: database, external HTTP, queues, etc.

- **Prisma repositories** — implement the domain interfaces; map DB rows ↔ domain entities.
- **`container.ts`** — the *composition root*; the only place that instantiates concrete classes and wires them together.

### `src/interfaces/` — Entry Points

Thin adapters that translate external input into use case calls.

- **API route handlers** — validate input with Zod → call use case → serialise response.
- **Helpers** — `apiResponse.ts` maps domain errors to HTTP status codes.

---

## API Reference

All responses follow the envelope pattern:

```json
{ "success": true,  "data": { … } }
{ "success": false, "error": "message" }
```

### Books

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/books` | List books (paginated). Add `?q=` to search. |
| `POST` | `/api/books` | Add a book to the catalogue |
| `GET` | `/api/books/:id` | Get a single book |

**POST /api/books body:**
```json
{
  "isbn": "978-0-13-235088-4",
  "title": "Clean Code",
  "author": "Robert C. Martin",
  "publisher": "Prentice Hall",
  "publishedAt": "2008-08-01T00:00:00.000Z",
  "totalCopies": 5
}
```

### Members

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/members` | List members (paginated) |
| `POST` | `/api/members` | Register a new member |
| `GET` | `/api/members/:id` | Get a single member |

### Loans

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/loans` | List all loans (paginated) |
| `POST` | `/api/loans` | Borrow a book |
| `POST` | `/api/loans/return` | Return a book |

**POST /api/loans body:**
```json
{
  "bookId": "uuid",
  "memberId": "uuid",
  "loanDurationDays": 14
}
```

**POST /api/loans/return body:**
```json
{ "loanId": "uuid" }
```

---

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start Next.js dev server with hot reload |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Auto-fix ESLint issues |
| `npm run format` | Format all files with Prettier |
| `npm run type-check` | TypeScript type checking (no emit) |
| `npm run db:generate` | Regenerate Prisma client after schema changes |
| `npm run db:migrate` | Run database migrations (dev) |
| `npm run db:migrate:prod` | Run database migrations (production) |
| `npm run db:seed` | Seed database with sample data |
| `npm run db:studio` | Open Prisma Studio GUI |
| `npm run db:reset` | Reset database and re-run migrations |
| `npm test` | Run Jest tests |
| `npm run test:coverage` | Run tests with coverage report |

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | ✅ | — | PostgreSQL connection string |
| `NEXT_PUBLIC_APP_URL` | ✅ | `http://localhost:3000` | Public base URL |
| `LOAN_DURATION_DAYS` | ❌ | `14` | Default days before a loan is due |
| `MAX_BOOKS_PER_MEMBER` | ❌ | `5` | Max concurrent loans per member |

---

## Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report (outputs to ./coverage)
npm run test:coverage
```

Tests are co-located in `__tests__/` directories next to the source files they test:

- `src/domain/__tests__/` — pure unit tests, zero I/O
- `src/application/__tests__/` — use case tests with mocked repositories

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Follow the [Clean Architecture layer rules](#clean-architecture-layers)
4. Ensure `npm run lint`, `npm run type-check`, and `npm test` all pass
5. Open a pull request
