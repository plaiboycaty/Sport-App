import { supabase } from '@/services/supabase';
import { Friend } from '@/types/friend';
// đây giống như là 1 file để chứa các hàm xử lý dữ liệu với database, như api 
export const friendService = {
  /**
   * Lấy thông tin Profile của User hiện tại (bao gồm friend_code)
   */
  async getCurrentUserProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, friend_code, skill_level')
      .eq('id', user.id)
      .single();

    if (error) {
      console.warn('Lỗi lấy thông tin profile hiện tại:', error.message);
      return null;
    }
    return data;
  },

  /**
   * Lấy danh sách Bạn bè đã xác nhận từ Supabase (bảng friendships)
   */
  async getFriendsList(): Promise<Friend[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      // Chưa đăng nhập: trả về danh sách rỗng
      return [];
    }

    const { data, error } = await supabase
      .from('friendships')
      .select(`
        id,
        created_at,
        friend:profiles!friendships_friend_id_fkey(
          id,
          full_name,
          avatar_url,
          skill_level,
          friend_code
        )
      `)
      .eq('user_id', user.id);

    if (error) {
      console.error('Lỗi khi tải danh sách bạn bè từ Supabase:', error.message);
      return [];
    }

    if (!data || data.length === 0) {
      // Trả về mảng rỗng từ Supabase khi chưa có bạn bè
      return [];
    }

    // Chuyển đổi dữ liệu từ DB sang kiểu Friend interface
    return data.map((item: any) => {
      const p = item.friend;
      return {
        id: p.id,
        name: p.full_name || 'Người dùng',
        avatarUrl: p.avatar_url || undefined,
        skillLevel: p.skill_level || 'beginner',
        friendCode: p.friend_code,
        isOnline: false,
      };
    });
  },

  /**
   * Gửi lời mời kết bạn qua mã bạn bè (dựa trên bảng profiles & friend_requests)
   */
  async sendFriendRequest(friendCode: string): Promise<{ success: boolean; message: string }> {
    const cleanCode = friendCode.trim().toUpperCase();
    if (!cleanCode) {
      throw new Error('Vui lòng nhập mã bạn bè!');
    }

    const { data: { user } } = await supabase.auth.getUser();

    // 1. Tìm người dùng có mã friend_code này trong DB
    const { data: targetProfile, error: searchError } = await supabase // phần data: targetProfile chỉ là gán tên cho data là targetProfile thôi
      .from('profiles')
      .select('id, full_name, friend_code')
      .eq('friend_code', cleanCode)
      .single();

    if (searchError || !targetProfile) {
      throw new Error(`Không tìm thấy người dùng nào với mã "${cleanCode}"!`);
    }

    if (user && targetProfile.id === user.id) {
      throw new Error('Bạn không thể tự gửi lời mời kết bạn cho chính mình!');
    }

    if (!user) {
      // Nếu chưa đăng nhập (test mode), giả lập thành công
      return {
        success: true,
        message: `Đã gửi lời mời kết bạn đến ${targetProfile.full_name || cleanCode}.`,
      };
    }

    // 2. Kiểm tra xem đã là bạn bè chưa
    const { data: existingFriendship } = await supabase
      .from('friendships')
      .select('id')
      .eq('user_id', user.id)
      .eq('friend_id', targetProfile.id)
      .single();

    if (existingFriendship) {
      throw new Error(`Bạn và ${targetProfile.full_name} đã là bạn bè từ trước!`);
    }

    // 3. Kiểm tra xem đã có lời mời pending chưa
    const { data: existingRequest } = await supabase
      .from('friend_requests')
      .select('id, status')
      .eq('sender_id', user.id)
      .eq('receiver_id', targetProfile.id)
      .eq('status', 'pending')
      .single();

    if (existingRequest) {
      throw new Error(`Lời mời kết bạn đã được gửi tới ${targetProfile.full_name} trước đó. Đang chờ đồng ý!`);
    }

    // 4. Tạo bản ghi mới trong bảng friend_requests
    const { error: insertError } = await supabase
      .from('friend_requests')
      .insert({
        sender_id: user.id,
        receiver_id: targetProfile.id,
        status: 'pending',
      });

    if (insertError) {
      console.error('Lỗi insert friend_request:', insertError);
      throw new Error('Không thể gửi lời mời kết bạn. Vui lòng thử lại sau!');
    }

    return {
      success: true,
      message: `Lời mời kết bạn đã được gửi tới ${targetProfile.full_name} (${cleanCode}).`,
    };
  },

  /**
   * Lấy danh sách Lời mời kết bạn đang chờ (status = 'pending')
   */
  async getPendingRequests() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('friend_requests')
      .select(`
        id,
        created_at,
        sender:profiles!friend_requests_sender_id_fkey(
          id,
          full_name,
          avatar_url,
          skill_level,
          friend_code
        )
      `)
      .eq('receiver_id', user.id)
      .eq('status', 'pending');

    if (error) {
      console.error('Lỗi khi lấy lời mời kết bạn:', error.message);
      return [];
    }

    return (data || []).map((item: any) => {
      const senderObj = Array.isArray(item.sender) ? item.sender[0] : item.sender;
      return {
        id: item.id,
        created_at: item.created_at,
        sender: {
          id: senderObj?.id || '',
          full_name: senderObj?.full_name || 'Người dùng',
          avatar_url: senderObj?.avatar_url || null,
          skill_level: senderObj?.skill_level || 'beginner',
          friend_code: senderObj?.friend_code || '',
        },
      };
    });
  },

  /**
   * Chấp nhận lời mời kết bạn (Sử dụng hàm SQL RPC: public.accept_friend_request)
   */
  async acceptFriendRequest(requestId: string): Promise<void> {
    const { error } = await supabase.rpc('accept_friend_request', {
      request_id: requestId,
    });

    if (error) {
      console.error('Lỗi khi chấp nhận lời mời kết bạn:', error.message);
      throw new Error(error.message || 'Không thể chấp nhận lời mời kết bạn.');
    }
  },

  /**
   * Từ chối lời mời kết bạn
   */
  async rejectFriendRequest(requestId: string): Promise<void> {
    const { error } = await supabase
      .from('friend_requests')
      .update({ status: 'rejected', updated_at: new Date().toISOString() })
      .eq('id', requestId);

    if (error) {
      console.error('Lỗi khi từ chối lời mời kết bạn:', error.message);
      throw new Error(error.message || 'Không thể từ chối lời mời kết bạn.');
    }
  },

  /**
   * Hủy kết bạn (Sử dụng hàm SQL RPC: public.remove_friend)
   */
  async removeFriend(targetFriendId: string): Promise<void> {
    const { error } = await supabase.rpc('remove_friend', {
      target_friend_id: targetFriendId,
    });

    if (error) {
      console.error('Lỗi khi xóa bạn bè:', error.message);
      throw new Error(error.message || 'Không thể xóa bạn bè.');
    }
  },
};
