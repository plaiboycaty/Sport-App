import React, { useState } from 'react';
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
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface CreateGroupModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (newGroup: { name: string; sportType: string; description?: string }) => void;
}

const SPORT_OPTIONS = [
  'Cầu lông',
  'Bóng đá',
  'Pickleball',
  'Tennis',
  'Chạy bộ',
  'Gym & Fitness',
  'Bơi lội',
  'Bóng rổ',
];

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  visible,
  onClose,
  onSubmit,
}) => {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [sportType, setSportType] = useState('Cầu lông');
  const [description, setDescription] = useState('');

  const handleCreate = () => {
    if (!name.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập tên nhóm!');
      return;
    }

    onSubmit({
      name: name.trim(),
      sportType,
      description: description.trim(),
    });

    // Reset form
    setName('');
    setDescription('');
    setSportType('Cầu lông');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.modalContainer, { paddingBottom: Math.max(insets.bottom + 16, 24) }]}>

              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title}>Tạo nhóm mới</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Tên nhóm */}
                <Text style={styles.label}>Tên nhóm *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ví dụ: Team Cầu lông Tech..."
                  placeholderTextColor="#9CA3AF"
                  value={name}
                  onChangeText={setName}
                />

                {/* Chọn Môn Thể Thao */}
                <Text style={styles.label}>Môn thể thao</Text>
                <View style={styles.sportChipsContainer}>
                  {SPORT_OPTIONS.map((sport) => {
                    const isSelected = sportType === sport;
                    return (
                      <TouchableOpacity
                        key={sport}
                        style={[styles.sportChip, isSelected && styles.sportChipSelected]}
                        onPress={() => setSportType(sport)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.sportChipText,
                            isSelected && styles.sportChipTextSelected,
                          ]}
                        >
                          {sport}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Mô tả nhóm */}
                <Text style={styles.label}>Mô tả (tùy chọn)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Nhập thông tin sân bãi, lịch đánh cố định..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={3}
                  value={description}
                  onChangeText={setDescription}
                />

                {/* Submit button */}
                <TouchableOpacity
                  style={styles.submitBtn}
                  onPress={handleCreate}
                  activeOpacity={0.85}
                >
                  <Text style={styles.submitBtnText}>Tạo nhóm ngay</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  closeBtn: {
    padding: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1F2937',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  sportChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  sportChip: {
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  sportChipSelected: {
    backgroundColor: '#E5F1FF',
    borderColor: '#0061AF',
  },
  sportChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  sportChipTextSelected: {
    color: '#0061AF',
    fontWeight: '700',
  },
  submitBtn: {
    backgroundColor: '#0061AF',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 8,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default CreateGroupModal;
