import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Header from '../../components/common/Header';
import { colors } from '../../constants/colors';
import { mockUserProfile } from '../../utils';
import { supabase } from '../../services/supabase';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const user = mockUserProfile;

  const [toggles, setToggles] = useState({
    matchReminder: true,
    matchResult: true,
    tournamentInvite: false,
    systemUpdate: true,
    darkMode: false,
  });

  const handleToggle = (key: keyof typeof toggles) => {
    setToggles(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <View style={styles.container}>
      <Header title="Cài đặt & Thông báo" showBack />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
              <TouchableOpacity style={styles.editAvatarBtn}>
                <Ionicons name="pencil" size={12} color="#FFF" />
              </TouchableOpacity>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.name}>{user.fullName || 'Nguyễn Minh Quân'}</Text>
              <Text style={styles.email}>{user.email || 'quan.nguyen@sportsync.com'}</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.profileActions}>
            <TouchableOpacity style={styles.primaryBtn}>
              <Ionicons name="person-outline" size={16} color="#FFF" style={styles.btnIcon} />
              <Text style={styles.primaryBtnText}>Chỉnh sửa hồ sơ</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryBtn}>
              <Ionicons name="lock-closed-outline" size={16} color="#333" style={styles.btnIcon} />
              <Text style={styles.secondaryBtnText}>Đổi mật khẩu</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Notifications Group */}
        <Text style={styles.groupTitle}>THÔNG BÁO</Text>
        <View style={styles.settingGroup}>
          <SettingItem
            icon="calendar-outline"
            title="Nhắc lịch thi đấu"
            value={toggles.matchReminder}
            onToggle={() => handleToggle('matchReminder')}
          />
          <SettingItem
            icon="flag-outline"
            title="Kết quả trận đấu"
            value={toggles.matchResult}
            onToggle={() => handleToggle('matchResult')}
          />
          <SettingItem
            icon="trophy-outline"
            title="Lời mời tham gia giải"
            value={toggles.tournamentInvite}
            onToggle={() => handleToggle('tournamentInvite')}
          />
          <SettingItem
            icon="notifications-outline"
            title="Thông báo từ hệ thống"
            value={toggles.systemUpdate}
            onToggle={() => handleToggle('systemUpdate')}
            isLast
          />
        </View>

        {/* Options Group */}
        <Text style={styles.groupTitle}>TÙY CHỌN</Text>
        <View style={styles.settingGroup}>
          <SettingItem
            icon="moon-outline"
            title="Chế độ tối"
            value={toggles.darkMode}
            onToggle={() => handleToggle('darkMode')}
          />
          <TouchableOpacity style={[styles.settingItem, styles.lastItem]}>
            <View style={styles.settingLeft}>
              <View style={styles.iconContainer}>
                <Ionicons name="language-outline" size={20} color="#0061AF" />
              </View>
              <Text style={styles.settingText}>Ngôn ngữ</Text>
            </View>
            <View style={styles.languageContainer}>
              <Text style={styles.languageText}>Tiếng Việt</Text>
              <Ionicons name="chevron-forward" size={18} color="#999" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#D32F2F" style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>

        {/* App Version */}
        <Text style={styles.versionText}>SportSync Version 2.4.0</Text>
      </ScrollView>
    </View>
  );
}

function SettingItem({
  icon,
  title,
  value,
  onToggle,
  isLast = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  value: boolean;
  onToggle: () => void;
  isLast?: boolean;
}) {
  return (
    <View style={[styles.settingItem, isLast && styles.lastItem]}>
      <View style={styles.settingLeft}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={20} color="#0061AF" />
        </View>
        <Text style={styles.settingText}>{title}</Text>
      </View>
      <Switch
        trackColor={{ false: '#D1D5DB', true: '#0061AF' }}
        thumbColor="#FFFFFF"
        ios_backgroundColor="#D1D5DB"
        onValueChange={onToggle}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F8F3', // Tone nền kem nhạt theo Figma
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  editAvatarBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#0061AF',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFF',
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  email: {
    fontSize: 13,
    color: '#777',
  },
  profileActions: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: '#0061AF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  primaryBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
  secondaryBtn: {
    flex: 1,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  secondaryBtnText: {
    color: '#333',
    fontSize: 13,
    fontWeight: '600',
  },
  btnIcon: {
    marginRight: 6,
  },
  groupTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#888',
    letterSpacing: 0.5,
    marginBottom: 10,
    paddingLeft: 4,
  },
  settingGroup: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#EBF3FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  settingText: {
    fontSize: 15,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  languageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageText: {
    fontSize: 14,
    color: '#888',
    marginRight: 4,
  },
  logoutBtn: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#D32F2F',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  logoutText: {
    color: '#D32F2F',
    fontSize: 16,
    fontWeight: '700',
  },
  versionText: {
    textAlign: 'center',
    color: '#AAA',
    fontSize: 13,
  },
});