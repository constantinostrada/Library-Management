import { Member } from '../entities/Member';

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
   * Returns a paginated list of all members.
   * @param page  1-based page number.
   * @param limit Items per page.
   */
  findAll(page: number, limit: number): Promise<{ members: Member[]; total: number }>;

  /** Persists a new member. Returns the created member. */
  create(member: Member): Promise<Member>;

  /** Updates an existing member. Returns the updated member. */
  update(member: Member): Promise<Member>;

  /** Removes a member by ID. */
  delete(id: string): Promise<void>;
}
