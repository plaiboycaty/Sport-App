import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SuggestedGroup } from '@/types/group';

interface SuggestedGroupCardProps {
  group: SuggestedGroup;
  onPress?: (group: SuggestedGroup) => void;
  onJoin?: (group: SuggestedGroup) => void;
}

export const SuggestedGroupCard: React.FC<SuggestedGroupCardProps> = ({
  group,
  onPress,
  onJoin,
}) => {
  const getIconName = (iconName?: string): keyof typeof Ionicons.glyphMap => {
    return (iconName || 'fitness-outline') as keyof typeof Ionicons.glyphMap;
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress && onPress(group)}
      activeOpacity={0.8}
    >
      {/* Title */}
      <Text style={styles.title} numberOfLines={2}>
        {group.name}
      </Text>

      {/* Watermark / Subtle Background Icon */}
      <View style={styles.watermarkContainer}>
        <Ionicons
          name={getIconName(group.icon)}
          size={56}
          color="#BFE0FF"
          style={styles.watermarkIcon}
        />
      </View>

      {/* Bottom info section */}
      <View style={styles.bottomSection}>
        <View style={styles.badgeContainer}>
          {group.tag ? (
            <View style={styles.tagBadge}>
              <Text style={styles.tagText}>{group.tag}</Text>
            </View>
          ) : (
            <View style={styles.sportBadge}>
              <Text style={styles.sportBadgeText}>{group.sportType}</Text>
            </View>
          )}
          {group.memberCount !== undefined && group.memberCount > 0 && (
            <Text style={styles.memberCountText}>
              {group.memberCount} thành viên
            </Text>
          )}
        </View>

        {onJoin && (
          <TouchableOpacity
            style={styles.joinBtn}
            onPress={() => onJoin(group)}
            activeOpacity={0.7}
          >
            <Text style={styles.joinBtnText}>Tham gia</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#E6F2FF',
    borderRadius: 16,
    padding: 14,
    minHeight: 124,
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0061AF',
    lineHeight: 20,
    zIndex: 2,
    paddingRight: 10,
    marginBottom: 8,
  },
  watermarkContainer: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    opacity: 0.8,
    zIndex: 1,
  },
  watermarkIcon: {
    transform: [{ rotate: '-10deg' }],
  },
  bottomSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tagBadge: {
    backgroundColor: '#0061AF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  tagText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  sportBadge: {
    backgroundColor: '#CCE3FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  sportBadgeText: {
    color: '#0061AF',
    fontSize: 11,
    fontWeight: '600',
  },
  memberCountText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#4B5563',
  },
  joinBtn: {
    backgroundColor: '#0061AF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  joinBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});

export default SuggestedGroupCard;
