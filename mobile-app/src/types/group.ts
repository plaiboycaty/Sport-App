export interface Group {
  id: string;
  name: string;
  sportId?: string | null;
  sportType: string;
  avatarUrl?: string | null;
  createdBy: string;
  memberCount: number;
  createdAt?: string;
  updatedAt?: string;
  role?: 'owner' | 'member';
  description?: string;
  icon?: string;
  iconBgColor?: string;
}

export interface GroupMemberItem {
  id: string; // group_members.id
  userId: string;
  groupId: string;
  role: 'TRƯỞNG NHÓM' | 'THÀNH VIÊN';
  dbRole: 'owner' | 'member';
  joinedAt: string;
  name: string;
  avatarUrl?: string;
  skillLevel?: string;
  friendCode?: string;
  email?: string;
}

export interface GroupDetailData {
  group: Group;
  members: GroupMemberItem[];
  isOwner: boolean;
  userRole?: 'TRƯỞNG NHÓM' | 'THÀNH VIÊN';
}

export interface SuggestedGroup {
  id: string;
  name: string;
  sportType: string;
  memberCount?: number;
  avatarUrl?: string | null;
  tag?: string;
  distance?: string;
  icon: string;
  bgColor?: string;
}

export interface CreateGroupInput {
  name: string;
  sportId?: string;
  sportName?: string;
  avatarUrl?: string;
  description?: string;
  memberUserIds?: string[];
}

export interface UpdateGroupInput {
  name?: string;
  sportId?: string;
  sportName?: string;
  avatarUrl?: string;
  description?: string;
}

export interface SportOption {
  id: string;
  name: string;
  nameEn?: string;
  icon?: string;
  description?: string;
}
