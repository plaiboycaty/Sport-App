# Sport Sync - Tech Stack Description

## 1. Tổng quan công nghệ

Đây là dự án mobile dùng Expo và React Native, viết bằng TypeScript, kết hợp Supabase làm backend dữ liệu và xác thực. Phiên bản project mới giữ nguyên các công nghệ lõi này nhưng thay toàn bộ Tailwind/Uniwind bằng React Native StyleSheet.

## 2. Frontend

- Expo
- React Native
- React
- TypeScript
- React Navigation
- TanStack React Query
- Lingui cho đa ngôn ngữ
- Zod cho validate dữ liệu
- React Native Reanimated
- Gesture Handler
- Bottom Sheet

## 3. Lưu trữ và state

- MMKV để lưu trữ local theo thiết bị và tài khoản.
- AsyncStorage để persist state toàn cục của ứng dụng.
- SecureStore để lưu session đăng nhập và dữ liệu nhạy cảm.

## 4. Backend

- Supabase
- PostgreSQL
- Supabase Auth
- Supabase RPC functions

## 5. Giao diện

- **Không dùng Tailwind / Uniwind**
- Dùng **React Native StyleSheet** làm chuẩn chính để định nghĩa layout, màu sắc, typography và component styling.

## 6. Các điểm triển khai đáng chú ý

- Duy trì luồng data-fetching qua React Query.
- Duy trì kiểu lưu session an toàn qua SecureStore.
