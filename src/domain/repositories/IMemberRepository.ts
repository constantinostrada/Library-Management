import { Member, MemberStatus } from '../entities/Member';

/** Optional filters applied to the paginated `findAll` query. */
export interface MemberFilterCriteria {
  status?: MemberStatus;
}

/**
 * Repository Interface: IMemberRepository
 *
 * Defines the persistence contract for library members.
 */
export interface IMemberRepository {
  /** Finds a member by surrogate ID. Returns null if not found. */
  findById(id: string): Promise<Member | null>;

  /** Finds a member by email address. Returns null if not found. */
  findByEmail(email: string): Promise<Member | null>;

  /**
   * Returns a paginated list of members, optionally filtered by status.
   * @param page    1-based page number.
   * @param limit   Items per page.
   * @param filters Optional filter criteria.
   */
  findAll(
    page: number,
    limit: number,
    filters?: MemberFilterCriteria,
  ): Promise<{ members: Member[]; total: number }>;

  /** Persists a new member. Returns the created member. */
  create(member: Member): Promise<Member>;

  /** Updates an existing member. Returns the updated member. */
  update(member: Member): Promise<Member>;

  /** Removes a member by ID. */
  delete(id: string): Promise<void>;
}
