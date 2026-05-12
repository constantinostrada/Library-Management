/**
 * DTOs for the Member resource.
 */

export type MemberStatusDTO = 'ACTIVE' | 'SUSPENDED' | 'CLOSED';

/** Outbound — shape returned by use cases. */
export interface MemberDTO {
  id: string;
  email: string;
  name: string;
  status: MemberStatusDTO;
  createdAt: string;
  updatedAt: string;
}

/** Inbound — data required to register a new member. */
export interface CreateMemberDTO {
  email: string;
  name: string;
}

/** Inbound — data to update an existing member. */
export interface UpdateMemberDTO {
  id: string;
  name?: string;
  email?: string;
  status?: MemberStatusDTO;
}

/** Inbound — pagination + filter parameters. */
export interface ListMembersDTO {
  page?: number;
  limit?: number;
  status?: MemberStatusDTO;
}

/** Outbound — paginated response. */
export interface PaginatedMembersDTO {
  members: MemberDTO[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
