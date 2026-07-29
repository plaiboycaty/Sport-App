import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { authService } from '@/services/authService';
import { UserProfile } from '@/types/auth';
import { supabase } from '@/services/supabase';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const authStateModifiers = {
  isRegistering: false,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const userProfile = await authService.getUserProfile(userId);
      setProfile(userProfile);
    } catch (err) {
      console.error('Không thể lấy profile:', err);
    }
  };

  useEffect(() => {
    // 1. Khởi tạo session ban đầu
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!authStateModifiers.isRegistering) {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id);
        }
      }
      setLoading(false);
    });

    // 2. Lắng nghe sự thay đổi Auth State
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      // Chặn việc cập nhật session (tự động vào Trang chủ) nếu đang trong luồng Đăng ký
      if (authStateModifiers.isRegistering) {
        return;
      }

      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    setLoading(true);
    try {
      await authService.signOut();
      setSession(null);
      setUser(null);
      setProfile(null);
    } catch (error) {
      console.error('Lỗi khi đăng xuất:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchProfile(user.id);
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth phải được sử dụng bên trong AuthProvider');
  }
  return context;
};
