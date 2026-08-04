// Data for User Profile
export interface UserProfileMock {
  id: string;
  fullName: string;
  email: string;
  avatarUrl: string;
  friendCode: string;
  skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'professional';
  favoriteSports: string[];
}

export interface PlayerStatsMock {
  totalMatches: number;
  winPercentage: number;
  elo: number;
  achievements: { id: string; name: string; date: string; icon: string }[];
  sportsStats: {
    sportName: string;
    winRate: number;
  }[];
  eloHistory: number[]; // For chart
}

export interface MatchHistoryMock {
  id: string;
  title: string;
  date: string;
  eloChange: number;
  score: string;
}

export const mockUserProfile: UserProfileMock = {
  id: 'u1',
  fullName: 'Nguyễn Minh Tú',
  email: 'minhtu.nguyen@sportsync.com',
  avatarUrl: 'https://i.pravatar.cc/150?u=minhtu',
  friendCode: 'SPT-9921',
  skillLevel: 'advanced',
  favoriteSports: ['badminton', 'football'],
};

export const mockPlayerStats: PlayerStatsMock = {
  totalMatches: 128,
  winPercentage: 68,
  elo: 1450,
  achievements: [
    { id: 'a1', name: 'Huy chương vàng', date: 'Tournament Bán chuyên • 12/2023', icon: 'medal-outline' },
    { id: 'a2', name: 'Top 3 Cầu lông công ty', date: 'Corporate League Season 4', icon: 'trophy-outline' },
  ],
  sportsStats: [
    { sportName: 'Cầu lông', winRate: 80 },
    { sportName: 'Bóng đá', winRate: 50 },
  ],
  eloHistory: [1300, 1330, 1380, 1350, 1400, 1430, 1450], // Week 1 to Week 7
};

export const mockMatchHistory: MatchHistoryMock[] = [
  {
    id: 'mh1',
    title: 'Kéo co - Sân Quán Khu 7',
    date: 'Hôm qua, 18:30',
    eloChange: 25,
    score: '2-0'
  },
  {
    id: 'mh2',
    title: 'Giao lưu - CLB Phú Thọ',
    date: '12/03/2024, 20:00',
    eloChange: -12,
    score: '1-2'
  },
  {
    id: 'mh3',
    title: 'Tournament Bán chuyên',
    date: '10/03/2024, 09:00',
    eloChange: 40,
    score: '2-1'
  },
];
