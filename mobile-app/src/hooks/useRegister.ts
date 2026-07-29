import { useState } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { authService } from '@/services/authService';
import { AuthStackParamList } from '@/types';
import { registerSchema } from '@/utils/validators';
import { authStateModifiers } from '@/context/AuthContext';

type RegisterNavigationProp = StackNavigationProp<AuthStackParamList, 'Register'>;

export function useRegister() {
  const navigation = useNavigation<RegisterNavigationProp>();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const onNavigateToLogin = () => {
    navigation.navigate('Login');
  };

  const handleRegister = async () => {
    setErrorMessage('');

    // Validate form inputs using Zod schema
    const validationResult = registerSchema.safeParse({
      fullName,
      email,
      password,
    });

    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0]?.message;
      setErrorMessage(firstError || 'Dữ liệu nhập không hợp lệ.');
      return;
    }

    setLoading(true);
    // Bật cờ để chặn AuthContext chuyển sang MainTab
    authStateModifiers.isRegistering = true;

    try {
      await authService.signUpWithEmail({ email, password, fullName });

      // Đăng xuất ngay để huỷ session tự động của Supabase, giữ người dùng ở lại luồng Auth
      await authService.signOut();

      Alert.alert(
        'Đăng ký thành công 🎉',
        'Tài khoản của bạn đã được khởi tạo. Bạn có thể đăng nhập ngay!',
        [{
          text: 'Đăng nhập', onPress: () => {
            // Tắt cờ khi người dùng đã bấm OK
            authStateModifiers.isRegistering = false;
            onNavigateToLogin();
          }
        }]
      );
    } catch (err: any) {
      authStateModifiers.isRegistering = false;
      setErrorMessage(err.message || 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await authService.signInWithGoogle();
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Đăng nhập Google thất bại');
    } finally {
      setLoading(false);
    }
  };

  return {
    fullName,
    setFullName,
    email,
    setEmail,
    password,
    setPassword,
    loading,
    errorMessage,
    handleRegister,
    handleGoogleLogin,
    onNavigateToLogin,
  };
}
