import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  Platform,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';

interface EditGroupModalProps {
  visible: boolean;
  onClose: () => void;
  initialName?: string;
  initialSportType?: string;
  initialAvatar?: string;
  onSave?: (data: { name: string; sportType: string; avatarUrl?: string }) => void;
}

const SPORT_OPTIONS = [
  { id: 'football', name: 'Bóng đá', icon: 'football-outline' },
  { id: 'basketball', name: 'Bóng rổ', icon: 'basketball-outline' },
  { id: 'tennis', name: 'Tennis', icon: 'tennisball-outline' },
  { id: 'badminton', name: 'Cầu lông', icon: 'tennisball-outline' },
  { id: 'pickleball', name: 'Pickleball', icon: 'tennisball-outline' },
  { id: 'running', name: 'Chạy bộ', icon: 'walk-outline' },
  { id: 'gym', name: 'Gym & Fitness', icon: 'fitness-outline' },
  { id: 'swimming', name: 'Bơi lội', icon: 'water-outline' },
];

export const EditGroupModal: React.FC<EditGroupModalProps> = ({
  visible,
  onClose,
  initialName = 'Team Cầu lông Tech',
  initialSportType = 'Cầu lông',
  initialAvatar,
  onSave,
}) => {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState(initialName);
  const [sportType, setSportType] = useState(initialSportType);
  const [avatarUri, setAvatarUri] = useState<string | undefined>(initialAvatar);

  useEffect(() => {
    if (visible) {
      setName(initialName);
      setSportType(initialSportType);
      setAvatarUri(initialAvatar);
    }
  }, [visible, initialName, initialSportType, initialAvatar]);

  // Chọn ảnh từ thư viện
  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Quyền truy cập', 'Cần cấp quyền truy cập thư viện ảnh để thay đổi logo nhóm.');
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

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Thông báo', 'Tên nhóm không được để trống!');
      return;
    }
    if (onSave) {
      onSave({
        name: name.trim(),
        sportType,
        avatarUrl: avatarUri,
      });
    }
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.modalContainer, { paddingBottom: Math.max(insets.bottom + 16, 24) }]}>

              {/* Drag Handle Top Bar */}
              <View style={styles.dragHandle} />

              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.headerTitle}>Chỉnh sửa nhóm</Text>
                <TouchableOpacity onPress={handleSave} style={styles.saveHeaderBtn}>
                  <Text style={styles.saveHeaderText}>Lưu</Text>
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Group Avatar Edit Section */}
                <View style={styles.avatarSection}>
                  <TouchableOpacity
                    style={styles.avatarWrapper}
                    onPress={handlePickImage}
                    activeOpacity={0.8}
                  >
                    {avatarUri ? (
                      <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                    ) : (
                      <View style={styles.avatarPlaceholder}>
                        <Ionicons name="tennisball-outline" size={42} color="#60A5FA" />
                      </View>
                    )}
                    {/* Pencil Edit Badge */}
                    <View style={styles.editBadge}>
                      <Ionicons name="pencil" size={14} color="#FFFFFF" />
                    </View>
                  </TouchableOpacity>
                  <Text style={styles.avatarHintText}>Chạm để thay đổi ảnh</Text>
                </View>

                {/* TÊN NHÓM */}
                <Text style={styles.sectionLabel}>TÊN NHÓM</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.textInput}
                    value={name}
                    onChangeText={setName}
                    placeholder="Nhập tên nhóm..."
                    placeholderTextColor="#9CA3AF"
                  />
                  {name.length > 0 && (
                    <TouchableOpacity onPress={() => setName('')} style={styles.clearBtn}>
                      <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                    </TouchableOpacity>
                  )}
                </View>

                {/* MÔN THỂ THAO CHÍNH */}
                <Text style={styles.sectionLabel}>MÔN THỂ THAO CHÍNH</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.chipsScrollContainer}
                >
                  {SPORT_OPTIONS.map((item) => {
                    const isSelected = sportType === item.name;
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[styles.chip, isSelected && styles.chipSelected]}
                        onPress={() => setSportType(item.name)}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name={item.icon as keyof typeof Ionicons.glyphMap}
                          size={16}
                          color={isSelected ? '#0061AF' : '#4B5563'}
                          style={{ marginRight: 6 }}
                        />
                        <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                          {item.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* Bottom Action Button */}
                <TouchableOpacity
                  style={styles.bottomSaveBtn}
                  onPress={handleSave}
                  activeOpacity={0.85}
                >
                  <Text style={styles.bottomSaveBtnText}>Lưu thay đổi</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: '85%',
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  saveHeaderBtn: {
    position: 'absolute',
    right: 0,
    padding: 4,
  },
  saveHeaderText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0061AF',
  },

  /* Avatar section */
  avatarSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarWrapper: {
    position: 'relative',
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 8,
  },
  avatarImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: '#0061AF',
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarHintText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },

  /* Section label & inputs */
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    marginBottom: 8,
    marginTop: 12,
    letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 8,
    marginBottom: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  clearBtn: {
    padding: 4,
  },

  /* Sport Chips */
  chipsScrollContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 6,
    marginBottom: 24,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipSelected: {
    backgroundColor: '#E5F1FF',
    borderColor: '#0061AF',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  chipTextSelected: {
    color: '#0061AF',
    fontWeight: '700',
  },

  /* Bottom save button */
  bottomSaveBtn: {
    backgroundColor: '#0061AF',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 12,
  },
  bottomSaveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default EditGroupModal;
