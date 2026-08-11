import { supabase } from '@/services/supabase';
import {
  Group,
  GroupMemberItem,
  GroupDetailData,
  SuggestedGroup,
  CreateGroupInput,
  UpdateGroupInput,
  SportOption,
} from '@/types/group';

// Danh mục môn thể thao mặc định (nếu chưa có trong DB)
const DEFAULT_SPORTS: SportOption[] = [
  { id: 'a0000000-0000-0000-0000-000000000001', name: 'Cầu lông', icon: 'tennisball-outline' },
  { id: 'a0000000-0000-0000-0000-000000000002', name: 'Bóng đá', icon: 'football-outline' },
  { id: 'a0000000-0000-0000-0000-000000000003', name: 'Pickleball', icon: 'tennisball-outline' },
  { id: 'a0000000-0000-0000-0000-000000000004', name: 'Tennis', icon: 'tennisball-outline' },
  { id: 'a0000000-0000-0000-0000-000000000005', name: 'Chạy bộ', icon: 'walk-outline' },
  { id: 'a0000000-0000-0000-0000-000000000006', name: 'Bóng rổ', icon: 'basketball-outline' },
  { id: 'a0000000-0000-0000-0000-000000000007', name: 'Gym & Fitness', icon: 'fitness-outline' },
  { id: 'a0000000-0000-0000-0000-000000000008', name: 'Bơi lội', icon: 'water-outline' },
];

/**
 * Kiểm tra xem chuỗi có phải là định dạng UUID hợp lệ của Postgres hay không
 */
function isValidUuid(str?: string | null): boolean {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

/**
 * Helper mapping icon theo tên môn thể thao
 */
export function getSportIconByName(sportName?: string): string {
  if (!sportName) return 'fitness-outline';
  const lower = sportName.toLowerCase();
  if (lower.includes('bóng đá') || lower.includes('football') || lower.includes('soccer')) {
    return 'football-outline';
  }
  if (lower.includes('cầu lông') || lower.includes('badminton') || lower.includes('pickleball') || lower.includes('tennis')) {
    return 'tennisball-outline';
  }
  if (lower.includes('bóng rổ') || lower.includes('basketball')) {
    return 'basketball-outline';
  }
  if (lower.includes('chạy') || lower.includes('run')) {
    return 'walk-outline';
  }
  if (lower.includes('bơi') || lower.includes('swim')) {
    return 'water-outline';
  }
  return 'fitness-outline';
}

export const groupService = {
  /**
   * Lấy danh sách các môn thể thao từ Supabase (bảng sports)
   */
  async getSports(): Promise<SportOption[]> {
    try {
      const { data, error } = await supabase
        .from('sports')
        .select('id, name, name_en, icon, description')
        .eq('is_active', true)
        .order('name');

      if (error || !data || data.length === 0) {
        return DEFAULT_SPORTS;
      }

      return data.map((s: any) => ({
        id: s.id,
        name: s.name,
        nameEn: s.name_en || undefined,
        icon: s.icon || getSportIconByName(s.name),
        description: s.description || undefined,
      }));
    } catch (e) {
      console.warn('Lỗi khi lấy danh sách môn thể thao:', e);
      return DEFAULT_SPORTS;
    }
  },

  /**
   * Lấy danh sách các nhóm mà User hiện tại tham gia hoặc sở hữu (Supabase: groups + group_members)
   */
  async getMyGroups(): Promise<Group[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return [];
    }

    try {
      // 1. Truy vấn bảng groups cùng với bảng sports và group_members liên kết
      const { data, error } = await supabase
        .from('groups')
        .select(`
          id,
          name,
          sport_id,
          avatar_url,
          created_by,
          created_at,
          updated_at,
          sport:sports!groups_sport_id_fkey(
            id,
            name,
            icon
          ),
          members:group_members(
            id,
            user_id,
            role
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Lỗi khi tải danh sách nhóm của tôi từ Supabase:', error.message);
        // Fallback: nếu join group_members bị lỗi policy, query trực tiếp bảng groups do user tạo
        const { data: fallbackData } = await supabase
          .from('groups')
          .select('id, name, sport_id, avatar_url, created_by, created_at, updated_at')
          .eq('created_by', user.id)
          .order('created_at', { ascending: false });

        if (!fallbackData) return [];

        return fallbackData.map((item: any) => ({
          id: item.id,
          name: item.name,
          sportId: item.sport_id,
          sportType: 'Thể thao',
          avatarUrl: item.avatar_url || null,
          createdBy: item.created_by,
          memberCount: 1,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
          role: 'owner',
          icon: 'fitness-outline',
        }));
      }

      if (!data || data.length === 0) {
        return [];
      }

      // Lọc ra các nhóm mà User hiện tại là chủ nhóm (created_by) HOẶC là thành viên trong members
      const myGroupsList = data.filter((item: any) => {
        const isOwner = item.created_by === user.id;
        const membersList = Array.isArray(item.members) ? item.members : [];
        const isMember = membersList.some((m: any) => m.user_id === user.id);
        return isOwner || isMember;
      });

      return myGroupsList.map((item: any) => {
        const sportObj = Array.isArray(item.sport) ? item.sport[0] : item.sport;
        const membersList = Array.isArray(item.members) ? item.members : [];
        const userMemberRecord = membersList.find((m: any) => m.user_id === user.id);
        const isOwner = item.created_by === user.id || userMemberRecord?.role === 'owner';
        const sportName = sportObj?.name || 'Thể thao chung';
        const icon = sportObj?.icon || getSportIconByName(sportName);

        return {
          id: item.id,
          name: item.name,
          sportId: item.sport_id,
          sportType: sportName,
          avatarUrl: item.avatar_url || null,
          createdBy: item.created_by,
          memberCount: Math.max(membersList.length, 1),
          createdAt: item.created_at,
          updatedAt: item.updated_at,
          role: isOwner ? 'owner' : 'member',
          icon,
        };
      });
    } catch (e: any) {
      console.error('Lỗi ngoại lệ khi getMyGroups:', e.message);
      return [];
    }
  },

  /**
   * Lấy danh sách nhóm gợi ý / khám phá (các nhóm mà user hiện tại CHƯA tham gia)
   */
  async getSuggestedGroups(): Promise<SuggestedGroup[]> {
    const { data: { user } } = await supabase.auth.getUser();

    try {
      const { data, error } = await supabase
        .from('groups')
        .select(`
          id,
          name,
          avatar_url,
          created_by,
          created_at,
          sport:sports!groups_sport_id_fkey(
            id,
            name,
            icon
          ),
          members:group_members(
            id,
            user_id
          )
        `)
        .order('created_at', { ascending: false })
        .limit(15);

      if (error || !data) {
        return [];
      }

      // Lọc ra các nhóm mà user hiện tại CHƯA tham gia
      const filtered = data.filter((item: any) => {
        if (!user) return true;
        const membersList = Array.isArray(item.members) ? item.members : [];
        const isAlreadyMember = membersList.some((m: any) => m.user_id === user.id);
        const isCreator = item.created_by === user.id;
        return !isAlreadyMember && !isCreator;
      });

      return filtered.map((item: any, index: number) => {
        const sportObj = Array.isArray(item.sport) ? item.sport[0] : item.sport;
        const sportName = sportObj?.name || 'Thể thao';
        const icon = sportObj?.icon || getSportIconByName(sportName);
        const membersList = Array.isArray(item.members) ? item.members : [];

        return {
          id: item.id,
          name: item.name,
          sportType: sportName,
          memberCount: membersList.length,
          avatarUrl: item.avatar_url || null,
          tag: index === 0 ? 'Hot' : index === 1 ? 'Mới' : undefined,
          icon,
        };
      });
    } catch (e) {
      console.error('Lỗi khi tải gợi ý nhóm:', e);
      return [];
    }
  },

  /**
   * Lấy chi tiết nhóm và danh sách thành viên từ Supabase
   */
  async getGroupDetail(groupId: string): Promise<GroupDetailData> {
    const { data: { user } } = await supabase.auth.getUser();

    // 1. Lấy thông tin nhóm
    const { data: groupData, error: groupError } = await supabase
      .from('groups')
      .select(`
        id,
        name,
        sport_id,
        avatar_url,
        created_by,
        created_at,
        updated_at,
        sport:sports!groups_sport_id_fkey(
          id,
          name,
          icon
        )
      `)
      .eq('id', groupId)
      .single();

    if (groupError || !groupData) {
      throw new Error(groupError?.message || 'Không tìm thấy thông tin nhóm!');
    }

    // 2. Lấy danh sách thành viên trong nhóm kèm profile
    let members: GroupMemberItem[] = [];
    try {
      const { data: membersData, error: membersError } = await supabase
        .from('group_members')
        .select(`
          id,
          group_id,
          user_id,
          role,
          joined_at,
          profile:profiles!group_members_user_id_fkey(
            id,
            full_name,
            avatar_url,
            skill_level,
            friend_code,
            email
          )
        `)
        .eq('group_id', groupId)
        .order('joined_at', { ascending: true });

      if (!membersError && membersData) {
        members = membersData.map((m: any) => {
          const p = Array.isArray(m.profile) ? m.profile[0] : m.profile;
          const isOwnerRole = m.role === 'owner' || m.user_id === groupData.created_by;

          return {
            id: m.id,
            userId: m.user_id,
            groupId: m.group_id,
            role: isOwnerRole ? 'TRƯỞNG NHÓM' : 'THÀNH VIÊN',
            dbRole: m.role,
            joinedAt: m.joined_at,
            name: p?.full_name || 'Người dùng',
            avatarUrl: p?.avatar_url || undefined,
            skillLevel: p?.skill_level || 'beginner',
            friendCode: p?.friend_code || undefined,
            email: p?.email || undefined,
          };
        });
      }
    } catch (memErr) {
      console.warn('Không thể tải group_members, sử dụng fallback:', memErr);
    }

    const sportObj = Array.isArray(groupData.sport) ? groupData.sport[0] : groupData.sport;
    const sportName = sportObj?.name || 'Thể thao chung';
    const icon = sportObj?.icon || getSportIconByName(sportName);

    // Nếu members rỗng, tự tạo item cho owner
    if (members.length === 0 && groupData.created_by) {
      const { data: ownerProfile } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, skill_level, friend_code, email')
        .eq('id', groupData.created_by)
        .single();

      if (ownerProfile) {
        members.push({
          id: `owner-${groupData.created_by}`,
          userId: ownerProfile.id,
          groupId: groupData.id,
          role: 'TRƯỞNG NHÓM',
          dbRole: 'owner',
          joinedAt: groupData.created_at,
          name: ownerProfile.full_name || 'Trưởng nhóm',
          avatarUrl: ownerProfile.avatar_url || undefined,
          skillLevel: ownerProfile.skill_level || 'beginner',
          friendCode: ownerProfile.friend_code || undefined,
          email: ownerProfile.email || undefined,
        });
      }
    }

    // Sắp xếp: Trưởng nhóm lên đầu tiên
    members.sort((a, b) => (a.role === 'TRƯỞNG NHÓM' ? -1 : 1));

    const isOwner = user?.id === groupData.created_by;
    const currentUserMember = members.find((m) => m.userId === user?.id);

    const group: Group = {
      id: groupData.id,
      name: groupData.name,
      sportId: groupData.sport_id,
      sportType: sportName,
      avatarUrl: groupData.avatar_url || null,
      createdBy: groupData.created_by,
      memberCount: members.length,
      createdAt: groupData.created_at,
      updatedAt: groupData.updated_at,
      role: isOwner ? 'owner' : 'member',
      icon,
    };

    return {
      group,
      members,
      isOwner,
      userRole: currentUserMember?.role || (isOwner ? 'TRƯỞNG NHÓM' : 'THÀNH VIÊN'),
    };
  },

  /**
   * Tạo nhóm mới trên Supabase (Hỗ trợ gọi RPC create_sport_group hoặc fallback direct insert)
   */
  async createGroup(input: CreateGroupInput): Promise<Group> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Vui lòng đăng nhập để tạo nhóm!');
    }

    const cleanName = input.name.trim();
    if (!cleanName) {
      throw new Error('Tên nhóm không được để trống!');
    }

    // 1. Tìm hoặc ánh xạ sport_id (chỉ chấp nhận UUID hợp lệ)
    let sportId: string | null = null;
    if (input.sportId && isValidUuid(input.sportId)) {
      sportId = input.sportId;
    } else if (input.sportName) {
      const { data: sport } = await supabase
        .from('sports')
        .select('id')
        .ilike('name', input.sportName.trim())
        .maybeSingle();

      if (sport && isValidUuid(sport.id)) {
        sportId = sport.id;
      }
    }

    const validMemberIds = (input.memberUserIds || []).filter(
      (id) => isValidUuid(id) && id !== user.id
    );

    // 2. Thử tạo bằng RPC create_sport_group trước (atomic, an toàn, không đụng RLS recursion)
    try {
      const { data: rpcGroupId, error: rpcError } = await supabase.rpc('create_sport_group', {
        p_name: cleanName,
        p_sport_id: sportId,
        p_avatar_url: input.avatarUrl || null,
        p_member_ids: validMemberIds,
      });

      if (!rpcError && rpcGroupId) {
        return {
          id: rpcGroupId,
          name: cleanName,
          sportId: sportId,
          sportType: input.sportName || 'Thể thao',
          avatarUrl: input.avatarUrl || null,
          createdBy: user.id,
          memberCount: 1 + validMemberIds.length,
          role: 'owner',
          icon: getSportIconByName(input.sportName),
        };
      }
    } catch (rpcErr) {
      console.warn('RPC create_sport_group không khả dụng, chuyển sang fallback direct insert:', rpcErr);
    }

    // 3. Fallback: Chèn trực tiếp vào bảng groups
    const { data: newGroup, error: insertGroupError } = await supabase
      .from('groups')
      .insert({
        name: cleanName,
        sport_id: sportId,
        avatar_url: input.avatarUrl || null,
        created_by: user.id,
      })
      .select(`
        id,
        name,
        sport_id,
        avatar_url,
        created_by,
        created_at,
        updated_at,
        sport:sports!groups_sport_id_fkey(
          id,
          name,
          icon
        )
      `)
      .single();

    if (insertGroupError || !newGroup) {
      console.error('Lỗi khi chèn nhóm vào Supabase:', insertGroupError);
      throw new Error(insertGroupError?.message || 'Không thể tạo nhóm mới.');
    }

    // 4. Chèn người tạo (owner) vào group_members
    const membersToInsert: Array<{ group_id: string; user_id: string; role: 'owner' | 'member' }> = [
      {
        group_id: newGroup.id,
        user_id: user.id,
        role: 'owner',
      },
    ];

    for (const friendId of validMemberIds) {
      membersToInsert.push({
        group_id: newGroup.id,
        user_id: friendId,
        role: 'member',
      });
    }

    await supabase.from('group_members').insert(membersToInsert);

    const sportObj = Array.isArray(newGroup.sport) ? newGroup.sport[0] : newGroup.sport;
    const sportName = sportObj?.name || input.sportName || 'Thể thao chung';
    const icon = sportObj?.icon || getSportIconByName(sportName);

    return {
      id: newGroup.id,
      name: newGroup.name,
      sportId: newGroup.sport_id,
      sportType: sportName,
      avatarUrl: newGroup.avatar_url || null,
      createdBy: newGroup.created_by,
      memberCount: membersToInsert.length,
      createdAt: newGroup.created_at,
      updatedAt: newGroup.updated_at,
      role: 'owner',
      icon,
    };
  },

  /**
   * Cập nhật thông tin nhóm (Tên, Môn thể thao, Avatar)
   */
  async updateGroup(groupId: string, input: UpdateGroupInput): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Vui lòng đăng nhập để cập nhật nhóm!');
    }

    let sportId: string | null | undefined = undefined;
    if (input.sportId && isValidUuid(input.sportId)) {
      sportId = input.sportId;
    } else if (input.sportName) {
      const { data: sport } = await supabase
        .from('sports')
        .select('id')
        .ilike('name', input.sportName.trim())
        .maybeSingle();

      if (sport && isValidUuid(sport.id)) {
        sportId = sport.id;
      }
    }

    const updatePayload: any = {
      updated_at: new Date().toISOString(),
    };

    if (input.name && input.name.trim()) {
      updatePayload.name = input.name.trim();
    }
    if (sportId !== undefined) {
      updatePayload.sport_id = sportId;
    }
    if (input.avatarUrl !== undefined) {
      updatePayload.avatar_url = input.avatarUrl;
    }

    const { error } = await supabase
      .from('groups')
      .update(updatePayload)
      .eq('id', groupId);

    if (error) {
      console.error('Lỗi cập nhật nhóm Supabase:', error.message);
      throw new Error(error.message || 'Không thể cập nhật thông tin nhóm.');
    }
  },

  /**
   * Xóa nhóm (Dành cho chủ nhóm - CASCADE xóa cả group_members)
   */
  async deleteGroup(groupId: string): Promise<void> {
    const { error } = await supabase
      .from('groups')
      .delete()
      .eq('id', groupId);

    if (error) {
      console.error('Lỗi khi xóa nhóm Supabase:', error.message);
      throw new Error(error.message || 'Không thể xóa nhóm.');
    }
  },

  /**
   * Rời nhóm (Thành viên tự xóa khỏi group_members)
   */
  async leaveGroup(groupId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Vui lòng đăng nhập để thực hiện!');
    }

    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Lỗi khi rời nhóm:', error.message);
      throw new Error(error.message || 'Không thể rời nhóm.');
    }
  },

  /**
   * Thêm thành viên vào nhóm
   */
  async addMembers(groupId: string, userIds: string[]): Promise<void> {
    const validIds = userIds.filter((uid) => isValidUuid(uid));
    if (validIds.length === 0) return;

    const records = validIds.map((uid) => ({
      group_id: groupId,
      user_id: uid,
      role: 'member' as const,
    }));

    const { error } = await supabase
      .from('group_members')
      .insert(records);

    if (error) {
      console.error('Lỗi khi thêm thành viên:', error.message);
      throw new Error(error.message || 'Không thể thêm thành viên vào nhóm.');
    }
  },

  /**
   * Xóa một thành viên khỏi nhóm (Chủ nhóm gỡ thành viên)
   */
  async removeMember(groupId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', userId);

    if (error) {
      console.error('Lỗi khi gỡ thành viên:', error.message);
      throw new Error(error.message || 'Không thể gỡ thành viên khỏi nhóm.');
    }
  },

  /**
   * Người dùng tự tham gia nhóm gợi ý / công khai
   */
  async joinGroup(groupId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Vui lòng đăng nhập để tham gia nhóm!');
    }

    // Kiểm tra xem đã là thành viên chưa
    const { data: existing } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      throw new Error('Bạn đã là thành viên của nhóm này rồi!');
    }

    const { error } = await supabase
      .from('group_members')
      .insert({
        group_id: groupId,
        user_id: user.id,
        role: 'member',
      });

    if (error) {
      console.error('Lỗi khi tham gia nhóm:', error.message);
      throw new Error(error.message || 'Không thể tham gia nhóm.');
    }
  },
};
