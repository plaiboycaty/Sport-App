export interface TournamentMockItem {
  id: string;
  name: string;
  sport: string;
  location: string;
  status: 'Đang diễn ra' | 'Sắp tới' | 'Đã kết thúc';
  progress?: number;
  participants?: string[];
  startDate?: string;
  teamsRegistered?: string;
  winner?: string;
}

export const DUMMY_TOURNAMENTS: TournamentMockItem[] = [
  {
    id: '1',
    name: 'Vietnam Open 2024',
    sport: 'Bóng đá',
    location: 'Sân vận động Mỹ Đình',
    status: 'Đang diễn ra',
    progress: 75,
    participants: ['AN', 'KV', '+14'],
  },
  {
    id: '2',
    name: 'Summer Smash 2024',
    sport: 'Cầu lông',
    location: 'Trung tâm TDTT Q1',
    status: 'Sắp tới',
    startDate: '25 Th08',
    teamsRegistered: '12/16',
  },
  {
    id: '3',
    name: 'Spring Cup 2024',
    sport: 'Bóng rổ',
    location: 'Nhà thi đấu Phú Thọ',
    status: 'Đã kết thúc',
    winner: 'Thunder Wolves',
  },
];

export const MOCK_SPORTS = [
  { id: '1', name: 'Cầu lông', icon: 'tennisball-outline' },
  { id: '2', name: 'Bóng đá', icon: 'football-outline' },
  { id: '3', name: 'Tennis', icon: 'tennisball' },
  { id: '4', name: 'Bóng rổ', icon: 'basketball-outline' },
];

export const MOCK_FORMATS = [
  { id: 'round_robin', name: 'Vòng tròn', icon: 'people' },
  { id: 'knockout', name: 'Loại trực tiếp', icon: 'git-network' },
  { id: 'group_knockout', name: 'Chia bảng', icon: 'grid' },
];
