# Sport Sync - Project Description

## 1. Tổng quan dự án

Sport Sync là một ứng dụng mobile dành cho cộng đồng chơi thể thao, tập trung vào việc kết nối người dùng, quản lý bạn bè, nhóm, phòng chơi, trận đấu và giải đấu. Ứng dụng hỗ trợ luồng đăng ký, đăng nhập, quản lý hồ sơ cá nhân, gửi và nhận lời mời kết bạn, đồng thời tổ chức các hoạt động thể thao theo từng nhóm hoặc từng phòng chơi.

## 2. Mục tiêu sản phẩm

- Tạo một ứng dụng mobile để người dùng thể thao dễ dàng tìm kiếm, kết nối và tương tác với nhau.
- Quản lý danh sách bạn bè, lời mời kết bạn, nhóm thể thao và hoạt động thi đấu.
- Hỗ trợ người dùng tạo hoặc tham gia phòng chơi, trận đấu và giải đấu.
- Cung cấp trải nghiệm đa ngôn ngữ và lưu trạng thái đăng nhập an toàn trên thiết bị.

## 3. Tính năng chính

### 3.1 Xác thực tài khoản

- Đăng ký tài khoản mới.
- Đăng nhập / đăng xuất.
- Khôi phục và duy trì phiên đăng nhập.

### 3.2 Hồ sơ cá nhân

- Xem và cập nhật thông tin người dùng.
- Hiển thị môn thể thao yêu thích và mức kỹ năng.
- Tạo mã bạn bè để người khác tìm kiếm nhanh.

### 3.3 Kết bạn

- Tìm người dùng qua friend code.
- Gửi lời mời kết bạn.
- Nhận, chấp nhận, từ chối hoặc thu hồi lời mời.
- Xem danh sách bạn bè và trạng thái quan hệ.

### 3.4 Nhóm và phòng chơi

- Tạo và quản lý nhóm thể thao.
- Tham gia nhóm theo môn thể thao.
- Tạo phòng chơi để sắp xếp hoạt động hoặc trận đấu.

### 3.5 Trận đấu và giải đấu

- Theo dõi thông tin trận đấu.
- Lưu kết quả, đội chơi, điểm số và người tham gia.
- Tổ chức giải đấu và theo dõi vòng đấu.

### 3.6 Thông báo và trạng thái cục bộ

- Quản lý thông báo trong app.
- Lưu thiết lập thiết bị và tùy chọn người dùng cục bộ.


## 4. Lưu trữ dữ liệu cục bộ

Ứng dụng có nhiều lớp lưu trữ cục bộ:

- **Supabase session**: lưu token đăng nhập bằng SecureStore.
- **App persisted state**: lưu trạng thái ứng dụng bằng AsyncStorage.
- **Device/account storage**: dùng MMKV để lưu dữ liệu theo thiết bị và theo tài khoản.

## 5. Định hướng triển khai cho project mới

Khi dựng project mới cùng đề tài, có thể giữ nguyên các điểm sau:

- Kiến trúc app mobile bằng Expo + React Native + TypeScript.
- Backend Supabase với schema và RPC tương tự.
- Cơ chế auth, friend request, profile, group, room, match, tournament.
- Đa ngôn ngữ Việt/Anh.

Các điểm thay đổi so với dự án gốc:

- Không dùng Tailwind / Uniwind.
- Viết giao diện bằng `StyleSheet` thuần của React Native.
- Có thể tổ chức lại component UI để dễ bảo trì hơn nếu cần.
