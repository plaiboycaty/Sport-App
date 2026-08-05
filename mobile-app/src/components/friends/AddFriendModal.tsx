import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity } from 'react-native';
// Quản lý cửa sổ Modal nhập mã kết bạn & gửi lời mời.
interface AddFriendModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (code: string) => void;
}
export default function AddFriendModal({ visible, onClose, onSubmit }: AddFriendModalProps) {
  const [inputFriendCode, setInputFriendCode] = useState('');

  const handleSubmit = () => {
    onSubmit(inputFriendCode);
    setInputFriendCode('');
  };

  const handleClose = () => {
    setInputFriendCode('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Kết bạn qua mã</Text>
          <Text style={styles.modalSubtitle}>
            Nhập mã bạn bè để gửi lời mời. Người đó sẽ xuất hiện trong danh sách khi chấp nhận lời mời.
          </Text>

          <TextInput
            style={styles.modalInput}
            placeholder="Nhập mã bạn bè..."
            placeholderTextColor="#9CA3AF"
            value={inputFriendCode}
            onChangeText={setInputFriendCode}
            autoCapitalize="characters"
          />

          <View style={styles.modalButtonRow}>
            <TouchableOpacity
              style={[styles.modalBtn, styles.modalBtnCancel]}
              onPress={handleClose}
            >
              <Text style={styles.modalBtnCancelText}>Hủy</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalBtn, styles.modalBtnSubmit]}
              onPress={handleSubmit}
            >
              <Text style={styles.modalBtnSubmitText}>Gửi lời mời</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111827',
    marginBottom: 20,
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginLeft: 10,
  },
  modalBtnCancel: {
    backgroundColor: '#F3F4F6',
  },
  modalBtnCancelText: {
    color: '#4B5563',
    fontWeight: '600',
  },
  modalBtnSubmit: {
    backgroundColor: '#0061AF',
  },
  modalBtnSubmitText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
