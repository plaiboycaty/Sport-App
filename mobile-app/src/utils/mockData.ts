export interface LiveMatch {
  id: string;
  tournamentName: string;
  sportId: string;
  sportName: string;
  location: string;
  startedAt: string;
  status: 'live' | 'scheduled' | 'completed';
  currentSet: number;
  homeTeam: {
    id: string;
    name: string;
    avatarUrl: string;
    score: number;
  };
  awayTeam: {
    id: string;
    name: string;
    avatarUrl: string;
    score: number;
  };
}

export interface TournamentMock {
  id: string;
  name: string;
  sportId: string;
  currentStage: string;
  participantCount: number;
  progressPercentage: number;
}

export interface NotificationMock {
  id: string;
  type: 'tournament_invite' | 'match_reminder' | 'match_result' | 'group_update' | 'system_stats';
  title: string;
  body: string;
  createdAt: string;
  isRead: boolean;
  tournamentId?: string;
  matchId?: string;
  groupId?: string;
}

export const mockLiveMatches: LiveMatch[] = [
  {
    id: 'm1',
    tournamentName: 'Badminton Summer Cup 2024',
    sportId: 'badminton',
    sportName: 'Badminton',
    location: 'Sân 4',
    startedAt: new Date(Date.now() - 45 * 60000 - 12000).toISOString(), // 45:12 ago
    status: 'live',
    currentSet: 3,
    homeTeam: {
      id: 'p1',
      name: 'Nguyễn V. A.',
      avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704d',
      score: 21,
    },
    awayTeam: {
      id: 'p2',
      name: 'Trần T. B.',
      avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704e',
      score: 19,
    },
  },
  {
    id: 'm2',
    tournamentName: 'Pickleball Open',
    sportId: 'pickleball',
    sportName: 'Pickleball',
    location: 'Sân 1',
    startedAt: new Date(Date.now() - 45 * 60000 - 12000).toISOString(),
    status: 'live',
    currentSet: 1,
    homeTeam: {
      id: 'p3',
      name: 'Lê H. C.',
      avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704f',
      score: 21,
    },
    awayTeam: {
      id: 'p4',
      name: 'Phạm D.',
      avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704g',
      score: 19,
    },
  },
  {
    id: 'm3',
    tournamentName: 'Giao hữu nội bộ',
    sportId: 'badminton',
    sportName: 'Badminton',
    location: 'Sân 1',
    startedAt: new Date(Date.now() - 22 * 60000 - 15000).toISOString(), // 22:15 ago
    status: 'live',
    currentSet: 1,
    homeTeam: {
      id: 'p5',
      name: 'Thu Trang',
      avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704h',
      score: 11,
    },
    awayTeam: {
      id: 'p6',
      name: 'Minh Hạnh',
      avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704i',
      score: 5,
    },
  },
];

export const mockTournaments: TournamentMock[] = [
  {
    id: 't1',
    name: 'Badminton Summer Cup 2024',
    sportId: 'badminton',
    currentStage: 'Vòng Bảng',
    participantCount: 12,
    progressPercentage: 70,
  },
  {
    id: 't2',
    name: 'Giải Pickleball Open',
    sportId: 'pickleball',
    currentStage: 'Vòng 1/8',
    participantCount: 32,
    progressPercentage: 12,
  },
];

export const mockNotifications: NotificationMock[] = [
  {
    id: 'n1',
    type: 'tournament_invite',
    title: 'Lời mời tham gia giải đấu',
    body: 'Bạn được mời tham gia "Vietnam Open 2024" bởi Nguyễn Văn A.',
    createdAt: new Date().toISOString(), // Today
    isRead: false,
    tournamentId: 't3',
  },
  {
    id: 'n2',
    type: 'match_reminder',
    title: 'Nhắc lịch thi đấu',
    body: 'Trận đấu tiếp theo tại Sân 4 lúc 18:30. Đừng quên chuẩn bị dụng cụ nhé!',
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(), // Today earlier
    isRead: false,
    matchId: 'm4',
  },
  {
    id: 'n3',
    type: 'match_result',
    title: 'Kết quả trận đấu vừa chót',
    body: 'Trận đấu với Team Dragon đã kết thúc. Tỉ số 21 - 18. Chúc mừng bạn đã chiến thắng!',
    createdAt: new Date(Date.now() - 25 * 3600000).toISOString(), // Yesterday
    isRead: true,
    matchId: 'm5',
  },
  {
    id: 'n4',
    type: 'group_update',
    title: 'Cập nhật nhóm "Elite Smashers"',
    body: 'Trần Bình đã đăng một thông báo mới trong nhóm về buổi tập cuối tuần.',
    createdAt: new Date(Date.now() - 26 * 3600000).toISOString(),
    isRead: true,
    groupId: 'g1',
  },
  {
    id: 'n5',
    type: 'system_stats',
    title: 'Thống kê hàng tuần của bạn',
    body: 'Tuần này bạn đã tăng 15 điểm Elo và leo lên 3 bậc trên bảng xếp hạng khu vực.',
    createdAt: new Date(Date.now() - 48 * 3600000).toISOString(),
    isRead: true,
  },
];
