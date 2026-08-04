import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Header from '../../components/common/Header';
import { colors } from '../../constants/colors';
import { mockUserProfile } from '../../utils';

const SPORTS_OPTIONS = [
  { key: 'badminton', label: 'Cầu lông', icon: 'tennisball-outline' },
  { key: 'football', label: 'Bóng đá', icon: 'football-outline' },
  { key: 'basketball', label: 'Bóng rổ', icon: 'basketball-outline' },
  { key: 'volleyball', label: 'Bóng chuyền', icon: 'baseball-outline' },
  { key: 'tennis', label: 'Tennis', icon: 'tennisball-outline' },
  { key: 'tabletennis', label: 'Bóng bàn', icon: 'ellipse-outline' },
];

const SKILL_LEVELS = [
  { key: 'beginner', label: 'Mới bắt đầu' },
  { key: 'intermediate', label: 'Trung bình' },
  { key: 'advanced', label: 'Nâng cao' },
  { key: 'professional', label: 'Chuyên nghiệp' },
] as const;

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const [fullName, setFullName] = useState(mockUserProfile.fullName);
  const [email, setEmail] = useState(mockUserProfile.email);
  const [selectedSports, setSelectedSports] = useState<string[]>(mockUserProfile.favoriteSports);
  const [skillLevel, setSkillLevel] = useState<string>(mockUserProfile.skillLevel);

  const toggleSport = (key: string) => {
    setSelectedSports(prev =>
      prev.includes(key) ? prev.filter(s => s !== key) : [...prev, key]
    );
  };

  const handleSave = () => {
    Alert.alert('Thành công', 'Hồ sơ đã được cập nhật!', [
      { text: 'OK', onPress: () => navigation.goBack() }
    ]);
  };

  return (
    <View style={styles.container}>
      <Header title="Sửa hồ sơ" showBack />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            <Image source={{ uri: mockUserProfile.avatarUrl }} style={styles.avatar} />
            <TouchableOpacity style={styles.cameraBtn}>
              <Ionicons name="camera" size={16} color="#FFF" />
            </TouchableOpacity>
          </View>
          <Text style={styles.avatarHint}>Nhấn để đổi ảnh đại diện</Text>
        </View>

        {/* Form Section */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Họ và tên</Text>
          <TextInput
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
            placeholder="Nhập họ và tên"
            placeholderTextColor="#BBB"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, styles.inputDisabled]}
            value={email}
            editable={false}
          />
          <Text style={styles.inputHint}>Email không thể thay đổi</Text>
        </View>

        {/* Sport Selection */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Môn thể thao yêu thích</Text>
          <View style={styles.sportsGrid}>
            {SPORTS_OPTIONS.map(sport => {
              const isSelected = selectedSports.includes(sport.key);
              return (
                <TouchableOpacity
                  key={sport.key}
                  style={[styles.sportPill, isSelected && styles.sportPillSelected]}
                  onPress={() => toggleSport(sport.key)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={sport.icon as any}
                    size={18}
                    color={isSelected ? '#FFF' : colors.primary}
                  />
                  <Text style={[styles.sportPillText, isSelected && styles.sportPillTextSelected]}>
                    {sport.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Skill Level */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Trình độ</Text>
          <View style={styles.skillContainer}>
            {SKILL_LEVELS.map(level => {
              const isSelected = skillLevel === level.key;
              return (
                <TouchableOpacity
                  key={level.key}
                  style={[styles.skillPill, isSelected && styles.skillPillSelected]}
                  onPress={() => setSkillLevel(level.key)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.skillPillText, isSelected && styles.skillPillTextSelected]}>
                    {level.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
          <Text style={styles.saveBtnText}>Lưu thay đổi</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  cameraBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.background,
  },
  avatarHint: {
    fontSize: 13,
    color: '#888',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.primary,
    borderWidth: 1,
    borderColor: '#F0EBE3',
  },
  inputDisabled: {
    backgroundColor: '#F5F5F5',
    color: '#999',
  },
  inputHint: {
    fontSize: 12,
    color: '#AAA',
    marginTop: 6,
    paddingLeft: 4,
  },
  sportsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  sportPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
  },
  sportPillSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  sportPillText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 6,
  },
  sportPillTextSelected: {
    color: '#FFF',
  },
  skillContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  skillPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
  },
  skillPillSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  skillPillText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  skillPillTextSelected: {
    color: '#FFF',
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
