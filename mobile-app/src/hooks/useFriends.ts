import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { Friend } from '@/types/friend';
import { friendService } from '@/services/friendService';

export function useFriends() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [userFriendCode, setUserFriendCode] = useState<string>('...');
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Tải thông tin người dùng, danh sách bạn bè & lời mời kết bạn từ Supabase
  const loadData = useCallback(async () => {
    try {
      // 1. Tải thông tin mã bạn bè của user hiện tại từ Supabase
      const profile = await friendService.getCurrentUserProfile();
      if (profile?.friend_code) {
        setUserFriendCode(profile.friend_code);
      } else {
        setUserFriendCode('CHƯA ĐĂNG NHẬP');
      }

      // 2. Tải danh sách bạn bè thật từ Supabase DB
      const list = await friendService.getFriendsList();
      setFriends(list);

      // 3. Tải danh sách lời mời kết bạn đang chờ (Pending)
      const requests = await friendService.getPendingRequests();
      setPendingRequests(requests);
    } catch (error: any) {
      console.error('Lỗi khi tải dữ liệu bạn bè từ Supabase:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Làm mới danh sách khi vuốt
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  // Gửi lời mời kết bạn bằng mã qua Supabase
  const handleSendFriendRequest = async (code: string) => {
    try {
      const res = await friendService.sendFriendRequest(code);
      Alert.alert('Thành công', res.message, [{ text: 'Đã hiểu' }]);
      loadData();
      return true;
    } catch (err: any) {
      Alert.alert('Thông báo', err.message || 'Không thể gửi lời mời kết bạn.');
      return false;
    }
  };

  // Chấp nhận lời mời kết bạn (RPC accept_friend_request)
  const handleAcceptRequest = async (requestId: string, senderName: string) => {
    try {
      await friendService.acceptFriendRequest(requestId);
      Alert.alert('Thành công', `Bạn và ${senderName} đã trở thành bạn bè!`);
      loadData();
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể chấp nhận lời mời kết bạn.');
    }
  };

  // Từ chối lời mời kết bạn
  const handleRejectRequest = async (requestId: string, senderName: string) => {
    try {
      await friendService.rejectFriendRequest(requestId);
      Alert.alert('Đã từ chối', `Đã từ chối lời mời kết bạn của ${senderName}.`);
      loadData();
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể từ chối lời mời.');
    }
  };

  return {
    friends,
    pendingRequests,
    userFriendCode,
    loading,
    refreshing,
    handleRefresh,
    handleSendFriendRequest,
    handleAcceptRequest,
    handleRejectRequest,
  };
}
