import { Group, SuggestedGroup } from '../types/group';

export const MOCK_MY_GROUPS: Group[] = [
  {
    id: 'group-1',
    name: 'Team Cầu lông Tech',
    memberCount: 12,
    sportType: 'Cầu lông',
    icon: 'tennisball-outline',
    createdBy: 'mock-user-1',
    description: 'Nhóm dành cho các anh em làm công nghệ đam mê cầu lông, giao lưu tối T3-T5-T7.',
  },
  {
    id: 'group-2',
    name: 'Hội đá bóng Thứ 4',
    memberCount: 24,
    sportType: 'Bóng đá',
    icon: 'football-outline',
    createdBy: 'mock-user-2',
    description: 'Sân 7 người cố định tối thứ 4 hàng tuần tại sân bóng Thủy Lợi.',
  },
  {
    id: 'group-3',
    name: 'Hội Pickleball Thanh Xuân',
    memberCount: 18,
    sportType: 'Pickleball',
    icon: 'tennisball-outline',
    createdBy: 'mock-user-3',
    description: 'CLB Pickleball phong trào cho mọi lứa tuổi tại khu vực Thanh Xuân.',
  },
];

export const MOCK_SUGGESTED_GROUPS: SuggestedGroup[] = [
  {
    id: 'suggested-1',
    name: 'Gym & Fitness Hà Nội',
    sportType: 'Gym & Fitness',
    memberCount: 45,
    tag: 'New',
    icon: 'fitness-outline',
  },
  {
    id: 'suggested-2',
    name: 'CLB Bơi Lội Sóng Xanh',
    sportType: 'Bơi lội',
    memberCount: 30,
    distance: '800m gần bạn',
    icon: 'water-outline',
  },
  {
    id: 'suggested-3',
    name: 'Hội Chạy Bộ Hồ Tây',
    sportType: 'Chạy bộ',
    memberCount: 120,
    tag: 'Hot',
    icon: 'walk-outline',
  },
  {
    id: 'suggested-4',
    name: 'Yoga & Meditate Space',
    sportType: 'Gym & Fitness',
    memberCount: 15,
    distance: '1.5km gần bạn',
    icon: 'fitness-outline',
  },
];
