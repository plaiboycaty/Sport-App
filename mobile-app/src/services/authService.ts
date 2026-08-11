import { supabase } from '@/services/supabase';
import { SignInCredentials, SignUpCredentials, UserProfile } from '@/types/auth';

export const authService = {
  /**
   * Đăng nhập với Email & Mật khẩu
   */
  async signInWithEmail({ email, password }: SignInCredentials) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password || '',
    });
    if (error) throw error;
    return data;
  },

  /**
   * Đăng ký tài khoản mới với Email, Mật khẩu & Họ tên
   * Gửi full_name qua options.data để Trigger SQL tự động lưu vào bảng profiles!
   */
  async signUpWithEmail({ email, password, fullName }: SignUpCredentials) {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: password || '',
      options: {
        data: {
          full_name: fullName.trim(),
        },
      },
    });
    if (error) throw error;
    return data;
  },

  /**
   * Đăng nhập bằng Google (OAuth)
   */
  async signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    if (error) throw error;
    return data;
  },

  /**
   * Đặt lại mật khẩu qua Email
   */
  async resetPassword(email: string) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email.trim());
    if (error) throw error;
    return data;
  },

  /**
   * Đăng xuất hệ thống
   */
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  /**
   * Lấy thông tin chi tiết Profile của user từ DB
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    let { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    // Xử lý lỗi lệch đồng hồ hệ thống (JWT issued at future - PGRST303)
    if (error && error.code === 'PGRST303') {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const retry = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      data = retry.data;
      error = retry.error;
    }
    
    if (error && error.code !== 'PGRST116') {
      console.error('Lỗi khi lấy thông tin profile:', error);
    }
    return data || null;
  }
};
