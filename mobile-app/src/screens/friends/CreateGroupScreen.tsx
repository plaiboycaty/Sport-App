import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/types/navigation';
import * as ImagePicker from 'expo-image-picker';
import { Friend } from '@/types/friend';
import { friendService } from '@/services/friendService';
import { groupService } from '@/services/groupService';
import { SportOption } from '@/types/group';

export default function CreateGroupScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  // Form State
  const [groupName, setGroupName] = useState('');
  const [selectedSport, setSelectedSport] = useState('Bóng đá');
  const [avatarUri, setAvatarUri] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Danh mục môn thể thao & Danh sách bạn bè từ Supabase
  const [sportsList, setSportsList] = useState<SportOption[]>([]);
  const [friendsList, setFriendsList] = useState<Friend[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Member Selection State
  const [searchMember, setSearchMember] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

  // Tải danh mục thể thao & danh sách bạn bè từ Supabase
  useEffect(() => {
    async function initData() {
      try {
        setLoadingData(true);
        const [sports, friends] = await Promise.all([
          groupService.getSports(),
          friendService.getFriendsList(),
        ]);
        setSportsList(sports);
        setFriendsList(friends);
        if (sports.length > 0) {
          setSelectedSport(sports[0].name);
        }
      } catch (err) {
        console.error('Lỗi khi tải dữ liệu khởi tạo tạo nhóm:', err);
      } finally {
        setLoadingData(false);
      }
    }

    initData();
  }, []);

  // Lọc danh sách bạn bè theo từ khóa tìm kiếm
  const filteredFriends = useMemo(() => {
    if (!searchMember.trim()) return friendsList;
    return friendsList.filter((friend) =>
      friend.name.toLowerCase().includes(searchMember.toLowerCase())
    );
  }, [friendsList, searchMember]);

  // Toggle chọn / bỏ chọn thành viên
  const toggleMemberSelection = (id: string) => {
    if (selectedMemberIds.includes(id)) {
      setSelectedMemberIds(selectedMemberIds.filter((item) => item !== id));
    } else {
      setSelectedMemberIds([...selectedMemberIds, id]);
    }
  };

  // Chọn ảnh nhóm
  const handlePickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Quyền truy cập', 'Vui lòng cho phép truy cập thư viện ảnh để tải logo nhóm.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  // Xử lý tạo nhóm lên Supabase
  const handleCreateGroup = async () => {
    const cleanName = groupName.trim();
    if (!cleanName) {
      Alert.alert('Thông báo', 'Vui lòng nhập tên nhóm!');
      return;
    }

    try {
      setIsSubmitting(true);
      const selectedSportObj = sportsList.find((s) => s.name === selectedSport);

      const createdGroup = await groupService.createGroup({
        name: cleanName,
        sportId: selectedSportObj?.id,
        sportName: selectedSport,
        avatarUrl: avatarUri,
        memberUserIds: selectedMemberIds,
      });

      Alert.alert(
        'Tạo nhóm thành công! 🎉',
        `Nhóm "${createdGroup.name}" đã được tạo thành công trên hệ thống.`,
        [
          {
            text: 'Xác nhận',
            onPress: () => {
              navigation.goBack();
            },
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể tạo nhóm. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Navigation Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#0061AF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tạo nhóm mới</Text>
      </View>

      {loadingData ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color="#0061AF" />
          <Text style={styles.loadingText}>Đang chuẩn bị thông tin...</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: 100 + (insets.bottom || 16) },
          ]}
        >
          {/* Avatar Upload Section */}
          <View style={styles.avatarSection}>
            <TouchableOpacity
              style={styles.avatarCircle}
              onPress={handlePickAvatar}
              activeOpacity={0.8}
            >
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.uploadedAvatar} />
              ) : (
                <View style={styles.uploadPlaceholder}>
                  <Ionicons name="camera-outline" size={32} color="#60A5FA" />
                  <Text style={styles.uploadText}>Tải ảnh lên</Text>
                </View>
              )}

              {/* Plus Badge */}
              <View style={styles.plusBadge}>
                <Ionicons name="add" size={16} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Card 1: Thông tin cơ bản */}
          <View style={styles.card}>
            {/* Tên nhóm */}
            <Text style={styles.fieldLabel}>Tên nhóm *</Text>
            <View style={styles.inputContainer}>
              <Ionicons
                name="people-outline"
                size={20}
                color="#9CA3AF"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.inputField}
                placeholder="Nhập tên nhóm..."
                placeholderTextColor="#9CA3AF"
                value={groupName}
                onChangeText={setGroupName}
              />
            </View>

            {/* Môn thể thao chính */}
            <Text style={styles.fieldLabel}>Môn thể thao chính</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.sportChipsScroll}
            >
              {sportsList.map((sport) => {
                const isSelected = selectedSport === sport.name;
                return (
                  <TouchableOpacity
                    key={sport.id}
                    style={[styles.sportChip, isSelected && styles.sportChipSelected]}
                    onPress={() => setSelectedSport(sport.name)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={(sport.icon || 'fitness-outline') as keyof typeof Ionicons.glyphMap}
                      size={16}
                      color={isSelected ? '#0061AF' : '#374151'}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={[
                        styles.sportChipText,
                        isSelected && styles.sportChipTextSelected,
                      ]}
                    >
                      {sport.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Card 2: Thêm thành viên từ bạn bè */}
          <View style={styles.card}>
            <View style={styles.memberHeaderRow}>
              <Text style={styles.cardTitle}>Thêm thành viên từ bạn bè</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{selectedMemberIds.length} đã chọn</Text>
              </View>
            </View>

            {/* Search bar */}
            <View style={styles.searchContainer}>
              <Ionicons
                name="search-outline"
                size={18}
                color="#9CA3AF"
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Tìm kiếm trong danh sách bạn bè..."
                placeholderTextColor="#9CA3AF"
                value={searchMember}
                onChangeText={setSearchMember}
              />
              {searchMember.length > 0 && (
                <TouchableOpacity onPress={() => setSearchMember('')}>
                  <Ionicons name="close-circle" size={16} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>

            {/* Member List */}
            {friendsList.length === 0 ? (
              <View style={styles.noFriendsContainer}>
                <Ionicons name="people-outline" size={32} color="#9CA3AF" />
                <Text style={styles.noFriendsText}>
                  Bạn chưa có bạn bè nào để thêm vào nhóm. Bạn có thể thêm sau khi tạo nhóm.
                </Text>
              </View>
            ) : (
              <View style={styles.memberList}>
                {filteredFriends.map((friend) => {
                  const isChecked = selectedMemberIds.includes(friend.id);
                  const initials = friend.name
                    .split(' ')
                    .map((n) => n[0])
                    .slice(-2)
                    .join('');

                  return (
                    <TouchableOpacity
                      key={friend.id}
                      style={styles.memberRow}
                      onPress={() => toggleMemberSelection(friend.id)}
                      activeOpacity={0.7}
                    >
                      {/* Avatar */}
                      {friend.avatarUrl ? (
                        <Image
                          source={{ uri: friend.avatarUrl }}
                          style={styles.memberAvatar}
                        />
                      ) : (
                        <View style={styles.memberInitialsAvatar}>
                          <Text style={styles.memberInitialsText}>{initials}</Text>
                        </View>
                      )}

                      {/* Info */}
                      <View style={{ flex: 1 }}>
                        <Text style={styles.memberName}>{friend.name}</Text>
                        {friend.skillLevel && (
                          <Text style={styles.memberSubtitle}>
                            Trình độ: {friend.skillLevel}
                          </Text>
                        )}
                      </View>

                      {/* Radio / Checkbox */}
                      <View
                        style={[styles.checkbox, isChecked && styles.checkboxChecked]}
                      >
                        {isChecked && (
                          <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        </ScrollView>
      )}

      {/* Bottom Sticky Primary Action Button */}
      <View
        style={[
          styles.bottomContainer,
          { paddingBottom: Math.max(insets.bottom + 12, 16) },
        ]}
      >
        <TouchableOpacity
          style={[styles.createBtn, isSubmitting && styles.createBtnDisabled]}
          onPress={handleCreateGroup}
          disabled={isSubmitting}
          activeOpacity={0.85}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.createBtnText}>Xác nhận</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  /* Header */
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
  },
  backBtn: {
    padding: 6,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0061AF',
  },

  loadingCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#6B7280',
  },

  scrollContent: {
    paddingBottom: 100,
  },

  /* Avatar upload section */
  avatarSection: {
    alignItems: 'center',
    marginVertical: 16,
  },
  avatarCircle: {
    position: 'relative',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#93C5FD',
    borderStyle: 'dashed',
    backgroundColor: '#E8F3FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadPlaceholder: {
    alignItems: 'center',
  },
  uploadText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 4,
  },
  uploadedAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  plusBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#0061AF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

  /* Card */
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    marginBottom: 14,
  },
  inputIcon: {
    marginRight: 8,
  },
  inputField: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
  },

  /* Sport Chips */
  sportChipsScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  sportChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sportChipSelected: {
    backgroundColor: '#E5F1FF',
    borderColor: '#0061AF',
  },
  sportChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  sportChipTextSelected: {
    color: '#0061AF',
    fontWeight: '700',
  },

  /* Card 2: Members */
  memberHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  countBadge: {
    backgroundColor: '#E5F1FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0061AF',
  },

  /* Search bar */
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    marginBottom: 14,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
  },

  /* Member list */
  memberList: {
    marginTop: 4,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  memberInitialsAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#38BDF8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberInitialsText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  memberName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  memberSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },

  noFriendsContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noFriendsText: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 16,
  },

  /* Checkbox / Radio */
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxChecked: {
    backgroundColor: '#0061AF',
    borderColor: '#0061AF',
  },

  /* Bottom sticky button */
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  createBtn: {
    backgroundColor: '#0061AF',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createBtnDisabled: {
    opacity: 0.7,
  },
  createBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
