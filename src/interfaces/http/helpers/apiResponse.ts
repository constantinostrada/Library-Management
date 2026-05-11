import { NextResponse } from 'next/server';

import { DomainError } from '@/domain/errors/DomainError';

/**
 * HTTP response helpers.
 *
 * These helpers translate application/domain concepts into HTTP responses.
 * All status code decisions live here — use cases and domain are HTTP-agnostic.
 */

export function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ success: true, data }, { status });
}

export function created<T>(data: T): NextResponse {
  return NextResponse.json({ success: true, data }, { status: 201 });
}

export function noContent(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

export function errorResponse(message: string, status: number): NextResponse {
  return NextResponse.json({ success: false, error: message }, { status });
}

/**
 * Maps known domain error codes to appropriate HTTP status codes.
 * Falls back to 500 for unrecognised errors.
 */
export function handleError(error: unknown): NextResponse {
  if (error instanceof DomainError) {
    const statusMap: Record<string, number> = {
      BOOK_NOT_FOUND: 404,
      MEMBER_NOT_FOUND: 404,
      LOAN_NOT_FOUND: 404,
      NO_COPIES_AVAILABLE: 409,
      MEMBER_SUSPENDED: 403,
      BORROW_LIMIT_EXCEEDED: 409,
      LOAN_ALREADY_RETURNED: 409,
      DUPLICATE_ISBN: 409,
      EMAIL_ALREADY_REGISTERED: 409,
      INVALID_ISBN: 422,
      INVALID_EMAIL: 422,
      INVALID_LOAN_DURATION: 422,
    };

    const status = statusMap[error.code] ?? 400;
    return errorResponse(error.message, status);
  }

  if (error instanceof Error) {
    // Log unexpected errors server-side without leaking internals to clients
    console.error('[UnexpectedError]', error.message, error.stack);
    return errorResponse('An unexpected error occurred. Please try again later.', 500);
  }

  return errorResponse('Unknown error.', 500);
}
