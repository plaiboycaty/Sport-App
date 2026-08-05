import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Friend } from '../../types';
// Quản lý giao diện từng thẻ bạn bè (Avatar, Online Status, Tên, Badge trình độ và Nút Thách đấu).
interface FriendCardProps {
  friend: Friend;
  onChallenge: (friend: Friend) => void;
}

export default function FriendCard({ friend, onChallenge }: FriendCardProps) {
  // Lấy chữ cái đầu làm Avatar fallback
  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Render màu badge và nhãn hiển thị cho trình độ
  const renderSkillBadge = (level: Friend['skillLevel']) => {
    let badgeStyle = styles.badgeNovice;
    let textStyle = styles.badgeTextNovice;
    let label = 'Người mới';

    if (level === 'Bán chuyên' || level === 'intermediate') {
      badgeStyle = styles.badgeSemiPro;
      textStyle = styles.badgeTextSemiPro;
      label = 'Bán chuyên';
    } else if (level === 'Chuyên nghiệp' || level === 'professional') {
      badgeStyle = styles.badgePro;
      textStyle = styles.badgeTextPro;
      label = 'Chuyên nghiệp';
    } else if (level === 'Xuất sắc' || level === 'advanced') {
      badgeStyle = styles.badgeExpert;
      textStyle = styles.badgeTextExpert;
      label = 'Xuất sắc';
    }

    return (
      <View style={[styles.badgeBase, badgeStyle]}>
        <Text style={[styles.badgeTextBase, textStyle]}>{label}</Text>
      </View>
    );
  };

  return (
    <View style={styles.friendCard}>
      {/* Avatar + Status Indicator */}
      <View style={styles.avatarContainer}>
        {friend.avatarUrl ? (
          <Image source={{ uri: friend.avatarUrl }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatarInitials}>
            <Text style={styles.avatarInitialsText}>{getInitials(friend.name)}</Text>
          </View>
        )}
        {friend.isOnline && <View style={styles.onlineIndicator} />}
      </View>

      {/* Thông tin tên & trình độ */}
      <View style={styles.friendInfo}>
        <Text style={styles.friendName} numberOfLines={1}>
          {friend.name}
        </Text>
        <View style={styles.skillRow}>
          <Text style={styles.skillLabel}>Trình độ: </Text>
          {renderSkillBadge(friend.skillLevel)}
        </View>
      </View>

      {/* Nút Thách đấu */}
      <TouchableOpacity
        style={styles.challengeButton}
        activeOpacity={0.8}
        onPress={() => onChallenge(friend)}
      >
        <Text style={styles.challengeButtonText}>Thách đấu</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  friendCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginHorizontal: 16,
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  avatarContainer: {
    position: 'relative',
    width: 48,
    height: 48,
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarInitials: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitialsText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0284C7',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  friendInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  skillRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skillLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  badgeBase: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeTextBase: {
    fontSize: 11,
    fontWeight: '600',
  },
  badgeSemiPro: {
    backgroundColor: '#FEF3C7',
  },
  badgeTextSemiPro: {
    color: '#D97706',
  },
  badgePro: {
    backgroundColor: '#DCFCE7',
  },
  badgeTextPro: {
    color: '#15803D',
  },
  badgeExpert: {
    backgroundColor: '#FEE2E2',
  },
  badgeTextExpert: {
    color: '#DC2626',
  },
  badgeNovice: {
    backgroundColor: '#F3F4F6',
  },
  badgeTextNovice: {
    color: '#4B5563',
  },
  challengeButton: {
    backgroundColor: '#0061AF',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  challengeButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
