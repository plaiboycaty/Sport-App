import { useState } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { authService } from '@/services/authService';
import { AuthStackParamList } from '@/types';
import { loginSchema } from '@/utils/validators';

type LoginNavigationProp = StackNavigationProp<AuthStackParamList, 'Login'>;

export function useLogin() {
  const navigation = useNavigation<LoginNavigationProp>();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const onNavigateToRegister = () => {
    navigation.navigate('Register');
  };

  const onForgotPassword = () => {
    Alert.alert('Thông báo', 'Tính năng khôi phục mật khẩu đã được gửi tới Email của bạn.');
  };

  const handleLogin = async () => {
    setErrorMessage('');

    // Validate input using Zod
    const validationResult = loginSchema.safeParse({
      email,
      password,
    });

    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0]?.message;
      setErrorMessage(firstError || 'Thông tin đăng nhập không hợp lệ.');
      return;
    }

    setLoading(true);
    try {
      await authService.signInWithEmail({ email, password });
    } catch (err: any) {
      setErrorMessage(err.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
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
    email,
    setEmail,
    password,
    setPassword,
    loading,
    errorMessage,
    handleLogin,
    handleGoogleLogin,
    onNavigateToRegister,
    onForgotPassword,
  };
}
