# Standard Project Structure

Đây là cấu trúc project đã được chuẩn hóa lại để dùng cho một app mobile Expo + React Native + TypeScript + Supabase.

## Cấu trúc tổng thể

```txt
mobile-app/
├── assets/                     # Tài nguyên tĩnh & App icons hệ thống
│   ├── fonts/                  # Font chữ tùy chỉnh
│   ├── images/                 # Hình ảnh minh họa UI
│   ├── icon.png                # App icon
│   └── splash-icon.png         # Màn hình chờ (Splash Screen)
├── .env                        # SUPABASE_URL, SUPABASE_ANON_KEY
├── .gitignore
├── App.tsx                     # Entry point của ứng dụng
├── app.json                    # Cấu hình Expo
├── package.json
├── tsconfig.json
│
└── src/
    ├── components/             # Component tái sử dụng toàn app
    │   ├── common/             # Button, Input, Card, Avatar, Badge, Loading
    │   ├── modal/              # Modal, Dialog, BottomSheet content
    │   └── layout/             # Header, ScreenContainer, Wrapper
    │
    ├── constants/              # Hằng số dùng chung
    │   ├── colors.ts           # Bảng màu chuẩn
    │   ├── languages.ts        # Danh sách ngôn ngữ hỗ trợ (vi, en)
    │   ├── theme.ts            # Spacing, typography, radius, shadow
    │   └── queryKeys.ts        # Keys cho TanStack Query
    │
    ├── context/                # React Context
    │   ├── AuthContext.tsx     # Quản lý session / auth state
    │   ├── LanguageContext.tsx # Quản lý ngôn ngữ (đổi / lưu locale)
    │   └── ThemeContext.tsx    # Quản lý sáng / tối
    │
    ├── hooks/                  # Custom hooks dùng chung
    │   ├── useDebounce.ts      # Debounce cho search
    │   └── useRealtime.ts      # Realtime subscription
    │
    ├── locales/                # Quản lý đa ngôn ngữ (Lingui)
    │   ├── en/                 # Catalog tiếng Anh (messages.po / json)
    │   ├── vi/                 # Catalog tiếng Việt (messages.po / json)
    │   └── i18n.ts             # Khởi tạo Lingui setup & load catalog
    │
    ├── navigation/             # Điều hướng bằng React Navigation
    │   ├── AppNavigator.tsx    # Root navigator theo auth state
    │   ├── AuthStack.tsx       # Stack cho màn hình chưa đăng nhập
    │   ├── MainTab.tsx         # Bottom tabs chính
    │   ├── RootStack.tsx       # Stack tổng cho màn hình detail/modal
    │   └── types.ts            # Type cho route và screen props
    │
    ├── screens/                 # Màn hình chính của app
    │   ├── auth/               # Login, Register
    │   │   ├── LoginScreen.tsx
    │   │   └── RegisterScreen.tsx
    │   │
    │   ├── profile/            # Hồ sơ cá nhân
    │   │   ├── ProfileScreen.tsx
    │   │   ├── EditProfileScreen.tsx
    │   │   └── PlayerStatsScreen.tsx
    │   │
    │   ├── friends/            # Bạn bè và nhóm
    │   │   ├── FriendsListScreen.tsx
    │   │   ├── AddFriendScreen.tsx
    │   │   ├── GroupsScreen.tsx
    │   │   └── CreateGroupScreen.tsx
    │   │
    │   ├── rooms/              # Phòng chơi
    │   │   ├── RoomListScreen.tsx
    │   │   ├── CreateRoomScreen.tsx
    │   │   └── RoomDetailScreen.tsx
    │   │
    │   ├── tournaments/        # Giải đấu và bảng xếp hạng
    │   │   ├── TournamentListScreen.tsx
    │   │   ├── CreateTournamentScreen.tsx
    │   │   ├── TournamentDetailScreen.tsx
    │   │   └── TournamentStatsScreen.tsx
    │   │
    │   ├── matches/            # Trận đấu và live scoring
    │   │   └── MatchDetailScreen.tsx
    │   │
    │   └── notifications/      # Thông báo hệ thống
    │       └── NotificationScreen.tsx
    │
    ├── services/               # Tầng gọi Supabase và lưu trữ local
    │   ├── supabase.ts         # Khởi tạo Supabase client
    │   ├── authService.ts      # Login, Register, Logout
    │   ├── userService.ts      # Profiles, user_sports
    │   ├── friendService.ts    # Friend requests, friendships
    │   ├── roomService.ts      # Rooms, room members
    │   ├── tournamentService.ts# Tournaments, brackets, standings
    │   ├── matchService.ts     # Matches, score events
    │   └── storageService.ts   # MMKV / SecureStore / AsyncStorage
    │
    ├── types/                  # TypeScript definitions
    │   ├── database.types.ts   # Tự sinh từ Supabase
    │   └── index.ts            # Custom types cho frontend
    │
    └── utils/                  # Hàm hỗ trợ
        ├── formatters.ts       # Format ngày giờ, tỉ số
        └── validators.ts       # Validate form bằng Zod
```

## Quy ước chuẩn hóa

- Nên dùng số nhiều cho các nhóm chức năng có nhiều màn hình: `rooms`, `matches`, `tournaments`, `notifications`.
- `services/` chỉ nên chứa code làm việc với dữ liệu, Supabase, storage và các thao tác bên ngoài UI.
- `context/` dùng cho auth, theme, language hoặc các trạng thái cấp app.
- `locales/` kết hợp với `LanguageContext.tsx` dùng để quản lý đa ngôn ngữ (Tiếng Việt & Tiếng Anh) bằng Lingui.
- Giao diện nên dùng `StyleSheet` thuần, không phụ thuộc Tailwind.

## Cách tổ chức khi bắt đầu project mới

1. Tạo project Expo + TypeScript.
2. Tạo các folder theo cây trên trong `src/`.
3. Đặt `App.tsx` làm entry point, bọc các provider cần thiết.
4. Đưa Supabase client vào `services/supabase.ts`.
5. Đưa các màn hình chính vào `screen/` và dùng `navigation/` để quản lý luồng.
6. Tách component dùng lại vào `components/`.
7. Tách các hằng số, type, utility ra đúng thư mục riêng để tránh file phình to.