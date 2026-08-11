import { SkillLevel } from './auth';

export interface Friend {
  id: string;
  name: string;
  avatarUrl?: string;
  skillLevel: SkillLevel | 'Bán chuyên' | 'Chuyên nghiệp' | 'Người mới' | 'Xuất sắc';
  isOnline?: boolean;
  friendCode?: string;
}
