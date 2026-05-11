/**
 * Helper: parseQuery
 *
 * Safely extracts and coerces query parameters from a Next.js Request URL.
 * No business logic — pure input parsing.
 */
export function parsePaginationQuery(url: string): { page: number; limit: number } {
  const { searchParams } = new URL(url);

  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const limit = parseInt(searchParams.get('limit') ?? '20', 10);

  return {
    page: isNaN(page) || page < 1 ? 1 : page,
    limit: isNaN(limit) || limit < 1 ? 20 : Math.min(limit, 100),
  };
}

export function parseStringQuery(url: string, key: string): string | null {
  const { searchParams } = new URL(url);
  const value = searchParams.get(key);
  return value?.trim() || null;
}
