import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/types';
import { colors } from '../../constants/colors';

type NavigationProp = StackNavigationProp<RootStackParamList>;

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  showNotification?: boolean;
  rightComponent?: React.ReactNode;
}

export default function Header({ title = 'SportSync', showBack = false, showNotification = false, rightComponent }: HeaderProps) {
  const navigation = useNavigation<NavigationProp>();

  return (
    <View style={styles.container}>
      {/* Bên trái: nút back (nếu có) */}
      {showBack ? (
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
      ) : null}

      {/* Tiêu đề */}
      <Text style={styles.title}>{title}</Text>

      {/* Bên phải */}
      {showNotification ? (
        <TouchableOpacity
          style={styles.notifBtn}
          onPress={() => navigation.navigate('Notifications')}
        >
          <Ionicons name="notifications-outline" size={24} color={colors.primary} />
          <View style={styles.badge} />
        </TouchableOpacity>
      ) : rightComponent ? (
        rightComponent
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
    backgroundColor: colors.background,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  backBtn: {
    width: 35,
    height: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  notifBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.danger,
  },
});
