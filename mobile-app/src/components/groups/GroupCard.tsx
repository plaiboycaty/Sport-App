import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Group } from '@/types/group';

interface GroupCardProps {
  group: Group;
  onPress?: (group: Group) => void;
}

export const GroupCard: React.FC<GroupCardProps> = ({ group, onPress }) => {
  // Chọn icon phù hợp với môn thể thao
  const getIconName = (sportType?: string, customIcon?: string): keyof typeof Ionicons.glyphMap => {
    if (customIcon) return customIcon as keyof typeof Ionicons.glyphMap;
    if (!sportType) return 'fitness-outline';

    const lower = sportType.toLowerCase();
    if (lower.includes('bóng đá') || lower.includes('football')) return 'football-outline';
    if (lower.includes('cầu lông') || lower.includes('badminton') || lower.includes('tennis') || lower.includes('pickleball')) {
      return 'tennisball-outline';
    }
    if (lower.includes('bóng rổ') || lower.includes('basketball')) return 'basketball-outline';
    if (lower.includes('chạy') || lower.includes('run')) return 'walk-outline';
    if (lower.includes('bơi') || lower.includes('swim')) return 'water-outline';
    return 'fitness-outline';
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress && onPress(group)}
      activeOpacity={0.7}
    >
      {/* Group Avatar / Sport Icon */}
      <View style={styles.iconContainer}>
        {group.avatarUrl ? (
          <Image source={{ uri: group.avatarUrl }} style={styles.avatarImage} />
        ) : (
          <Ionicons
            name={getIconName(group.sportType, group.icon)}
            size={24}
            color="#0061AF"
          />
        )}
      </View>

      <View style={styles.infoContainer}>
        <View style={styles.nameRow}>
          <Text style={styles.groupName} numberOfLines={1}>
            {group.name}
          </Text>
          {group.role === 'owner' && (
            <View style={styles.ownerBadge}>
              <Text style={styles.ownerBadgeText}>Chủ nhóm</Text>
            </View>
          )}
        </View>
        <View style={styles.detailsRow}>
          <Ionicons name="people" size={14} color="#6B7280" style={styles.peopleIcon} />
          <Text style={styles.detailsText}>
            {group.memberCount} thành viên  •  {group.sportType}
          </Text>
        </View>
      </View>

      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFF3F8',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#E5F1FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  infoContainer: {
    flex: 1,
    marginRight: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    flexShrink: 1,
  },
  ownerBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  ownerBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0061AF',
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  peopleIcon: {
    marginRight: 4,
  },
  detailsText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
});

export default GroupCard;
