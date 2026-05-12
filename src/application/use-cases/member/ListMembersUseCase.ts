import { IMemberRepository } from '@/domain/repositories/IMemberRepository';

import { ListMembersDTO, PaginatedMembersDTO } from '../../dtos/MemberDTO';
import { MemberMapper } from '../../mappers/MemberMapper';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

/**
 * Use Case: ListMembersUseCase
 *
 * Returns a paginated list of all registered members.
 */
export class ListMembersUseCase {
  constructor(private readonly memberRepository: IMemberRepository) {}

  async execute(dto: ListMembersDTO): Promise<PaginatedMembersDTO> {
    const page = Math.max(1, dto.page ?? DEFAULT_PAGE);
    const limit = Math.min(100, Math.max(1, dto.limit ?? DEFAULT_LIMIT));

    const filters = dto.status ? { status: dto.status } : undefined;

    const { members, total } = await this.memberRepository.findAll(page, limit, filters);

    return {
      members: MemberMapper.toDTOList(members),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
