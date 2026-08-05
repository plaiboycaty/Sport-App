import { Friend } from '../types';

export const CURRENT_USER_FRIEND_CODE = 'SPT-9921';

export const MOCK_FRIENDS: Friend[] = [
  {
    id: '1',
    name: 'Minh Quân',
    avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    skillLevel: 'Bán chuyên',
    isOnline: true,
    friendCode: 'SPT-1042',
  },
  {
    id: '2',
    name: 'Thu Trang',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    skillLevel: 'Chuyên nghiệp',
    isOnline: false,
    friendCode: 'SPT-8831',
  },
  {
    id: '3',
    name: 'Hoàng Long',
    avatarUrl: undefined, // Sẽ hiển thị Avatar dạng viết tắt (HL)
    skillLevel: 'Người mới',
    isOnline: true,
    friendCode: 'SPT-5592',
  },
  {
    id: '4',
    name: 'Tuấn Anh',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    skillLevel: 'Xuất sắc',
    isOnline: true,
    friendCode: 'SPT-3310',
  },
  {
    id: '5',
    name: 'Phương Linh',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    skillLevel: 'Bán chuyên',
    isOnline: false,
    friendCode: 'SPT-7729',
  },
  {
    id: '6',
    name: 'Bảo Nam',
    avatarUrl: undefined, // Avatar dạng viết tắt (BN)
    skillLevel: 'Người mới',
    isOnline: false,
    friendCode: 'SPT-6614',
  },
  {
    id: '7',
    name: 'Khánh Vy',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    skillLevel: 'Chuyên nghiệp',
    isOnline: true,
    friendCode: 'SPT-4490',
  },
  {
    id: '8',
    name: 'Gia Huy',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    skillLevel: 'Bán chuyên',
    isOnline: true,
    friendCode: 'SPT-9012',
  },
];
