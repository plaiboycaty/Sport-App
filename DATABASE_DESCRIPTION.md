# Sport Sync - Database Description

## 1. Tổng quan

Ứng dụng sử dụng Supabase Postgres làm backend dữ liệu trung tâm. Schema hiện tại được thiết kế xoay quanh các nhóm bảng sau.

## 2. Người dùng và hồ sơ

- `profiles`: thông tin tài khoản người dùng.
- `user_sports`: liên kết người dùng với các môn thể thao yêu thích.

## 3. Kết bạn

- `friend_requests`: lưu lời mời kết bạn và trạng thái xử lý.
- `friendships`: lưu quan hệ bạn bè đã được xác nhận.

## 4. Nhóm

- `groups`: thông tin nhóm thể thao.
- `group_members`: thành viên của từng nhóm.

## 5. Phòng chơi và trận đấu

- `rooms`: phòng chơi.
- `room_members`: thành viên trong phòng.
- `matches`: thông tin trận đấu.
- `match_players`: người chơi tham gia trận đấu.
- `match_results`: kết quả trận đấu.
- `score_events`: các sự kiện ghi điểm.

## 6. Giải đấu

- `tournaments`: thông tin giải đấu.
- `tournament_participants`: danh sách tham gia.
- `tournament_rounds`: các vòng đấu.
- `tournament_organizers`: người tổ chức.

## 7. Thông báo

- `notifications`: thông báo gửi tới người dùng.
- `notification_preferences`: tuỳ chọn nhận thông báo.

## 8. View và RPC

- View hỗ trợ thống kê và hiển thị dữ liệu tổng hợp như `player_stats` và `tournament_standings`.
- RPC functions hỗ trợ các thao tác nghiệp vụ như chấp nhận lời mời kết bạn, xóa bạn bè, tạo bảng đấu, và hoàn tất trận đấu.
