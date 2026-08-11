import React, { useState, useMemo, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Friend } from '@/types/friend';
import { friendService } from '@/services/friendService';

interface AddGroupMemberModalProps {
  visible: boolean;
  onClose: () => void;
  existingMemberUserIds: string[];
  onAddMembers: (selectedFriendIds: string[]) => Promise<void>;
}

export const AddGroupMemberModal: React.FC<AddGroupMemberModalProps> = ({
  visible,
  onClose,
  existingMemberUserIds,
  onAddMembers,
}) => {
  const insets = useSafeAreaInsets();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Tải danh sách bạn bè khi mở modal
  useEffect(() => {
    if (visible) {
      setSelectedIds([]);
      setSearchQuery('');
      loadFriends();
    }
  }, [visible]);

  const loadFriends = async () => {
    try {
      setLoading(true);
      const list = await friendService.getFriendsList();
      setFriends(list);
    } catch (e) {
      console.error('Lỗi khi tải danh sách bạn bè:', e);
    } finally {
      setLoading(false);
    }
  };

  // Lọc các bạn bè chưa có trong nhóm và khớp từ khóa tìm kiếm
  const availableFriends = useMemo(() => {
    return friends.filter((f) => !existingMemberUserIds.includes(f.id));
  }, [friends, existingMemberUserIds]);

  const filteredFriends = useMemo(() => {
    if (!searchQuery.trim()) return availableFriends;
    return availableFriends.filter((f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [availableFriends, searchQuery]);

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleConfirm = async () => {
    if (selectedIds.length === 0) {
      Alert.alert('Thông báo', 'Vui lòng chọn ít nhất một bạn bè để thêm.');
      return;
    }

    try {
      setSubmitting(true);
      await onAddMembers(selectedIds);
      onClose();
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể thêm thành viên vào nhóm.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.modalContainer,
            { paddingBottom: Math.max(insets.bottom + 16, 24) },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Thêm bạn vào nhóm</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Search bar */}
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={18} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm kiếm bạn bè..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={16} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>

          {/* Content */}
          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color="#0061AF" />
              <Text style={styles.loadingText}>Đang tải danh sách bạn bè...</Text>
            </View>
          ) : availableFriends.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="people-outline" size={40} color="#9CA3AF" />
              <Text style={styles.emptyText}>
                Tất cả bạn bè của bạn đã có trong nhóm hoặc bạn chưa có bạn bè mới.
              </Text>
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: 320 }}
            >
              {filteredFriends.map((friend) => {
                const isChecked = selectedIds.includes(friend.id);
                const initials = friend.name
                  .split(' ')
                  .map((n) => n[0])
                  .slice(-2)
                  .join('');

                return (
                  <TouchableOpacity
                    key={friend.id}
                    style={styles.friendRow}
                    onPress={() => toggleSelect(friend.id)}
                    activeOpacity={0.7}
                  >
                    {friend.avatarUrl ? (
                      <Image
                        source={{ uri: friend.avatarUrl }}
                        style={styles.friendAvatar}
                      />
                    ) : (
                      <View style={styles.friendInitials}>
                        <Text style={styles.friendInitialsText}>{initials}</Text>
                      </View>
                    )}

                    <View style={{ flex: 1 }}>
                      <Text style={styles.friendName}>{friend.name}</Text>
                      {friend.skillLevel && (
                        <Text style={styles.friendSubtitle}>
                          Trình độ: {friend.skillLevel}
                        </Text>
                      )}
                    </View>

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
            </ScrollView>
          )}

          {/* Submit button */}
          {availableFriends.length > 0 && (
            <TouchableOpacity
              style={[
                styles.submitBtn,
                (selectedIds.length === 0 || submitting) && styles.submitBtnDisabled,
              ]}
              onPress={handleConfirm}
              disabled={selectedIds.length === 0 || submitting}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>
                  Thêm {selectedIds.length > 0 ? `(${selectedIds.length})` : ''} vào nhóm
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  closeBtn: {
    padding: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#1F2937',
  },
  loadingBox: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 13,
    color: '#6B7280',
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
  },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  friendAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  friendInitials: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#38BDF8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  friendInitialsText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  friendName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  friendSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
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
  submitBtn: {
    backgroundColor: '#0061AF',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default AddGroupMemberModal;
