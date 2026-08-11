import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// Quản lý thẻ Banner xanh dương hiển thị Mã bạn bè (SPT-9921), Nút Sao chép và Quét QR.
interface FriendCodeBannerProps {
  code: string;
  onCopy: () => void;
  onScanQR: () => void;
}

export default function FriendCodeBanner({ code, onCopy, onScanQR }: FriendCodeBannerProps) {
  return (
    <View style={styles.friendCodeCard}>
      <View style={styles.codeLeftSection}>
        <Text style={styles.codeLabel}>MÃ BẠN BÈ CỦA BẠN</Text>
        <View style={styles.codeRow}>
          <Text style={styles.codeText}>{code}</Text>
          <TouchableOpacity
            style={styles.copyButton}
            onPress={onCopy}
            activeOpacity={0.7}
          >
            <Ionicons name="copy-outline" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={styles.qrButton}
        onPress={onScanQR}
        activeOpacity={0.85}
      >
        <Ionicons name="qr-code-outline" size={18} color="#0061AF" />
        <Text style={styles.qrButtonText}>Quét QR</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  friendCodeCard: {
    backgroundColor: '#0061AF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#0061AF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  codeLeftSection: {
    flex: 1,
  },
  codeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.85)',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  codeText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  copyButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    padding: 6,
    marginLeft: 8,
  },
  qrButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  qrButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0061AF',
    marginLeft: 6,
  },
});
