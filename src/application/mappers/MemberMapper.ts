import { Member } from '@/domain/entities/Member';

import { MemberDTO } from '../dtos/MemberDTO';

/**
 * Mapper: MemberMapper
 */
export class MemberMapper {
  static toDTO(member: Member): MemberDTO {
    return {
      id: member.id,
      email: member.email.value,
      name: member.name,
      status: member.status,
      createdAt: member.createdAt.toISOString(),
      updatedAt: member.updatedAt.toISOString(),
    };
  }

  static toDTOList(members: Member[]): MemberDTO[] {
    return members.map(MemberMapper.toDTO);
  }
}
