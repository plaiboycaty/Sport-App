import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';

export interface PendingRequestItem {
  id: string;
  sender: {
    id: string;
    full_name: string;
    avatar_url?: string | null;
    skill_level?: string | null;
    friend_code?: string;
  };
}

interface FriendRequestCardProps {
  request: PendingRequestItem;
  onAccept: (requestId: string, senderName: string) => void;
  onReject: (requestId: string, senderName: string) => void;
}

export default function FriendRequestCard({ request, onAccept, onReject }: FriendRequestCardProps) {
  const sender = request.sender;

  const getInitials = (name: string) => {
    const parts = (name || '').trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return (name || 'US').slice(0, 2).toUpperCase();
  };

  return (
    <View style={styles.card}>
      <View style={styles.leftSection}>
        {sender.avatar_url ? (
          <Image source={{ uri: sender.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarInitials}>
            <Text style={styles.initialsText}>{getInitials(sender.full_name)}</Text>
          </View>
        )}
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {sender.full_name}
          </Text>
          <Text style={styles.subtext}>Đã gửi cho bạn lời mời kết bạn</Text>
        </View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.rejectBtn}
          onPress={() => onReject(request.id, sender.full_name)}
          activeOpacity={0.8}
        >
          <Text style={styles.rejectBtnText}>Từ chối</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.acceptBtn}
          onPress={() => onAccept(request.id, sender.full_name)}
          activeOpacity={0.8}
        >
          <Text style={styles.acceptBtnText}>Đồng ý</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginHorizontal: 16,
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: '#0061AF',
    shadowColor: '#0061AF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  leftSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarInitials: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0284C7',
  },
  info: {
    marginLeft: 10,
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  subtext: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rejectBtn: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginRight: 6,
  },
  rejectBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  acceptBtn: {
    backgroundColor: '#0061AF',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  acceptBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
