import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TournamentMockItem } from '@/utils/tournamentMockData';

const PRIMARY_COLOR = '#0061AF';

interface TournamentCardItemProps {
  tournament: TournamentMockItem;
  onPressDetails?: () => void;
  onPressRegister?: () => void;
}

export default function TournamentCardItem({
  tournament,
  onPressDetails,
  onPressRegister,
}: TournamentCardItemProps) {
  const renderBadge = () => {
    if (tournament.status === 'Đang diễn ra') {
      return (
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      );
    }
    if (tournament.status === 'Sắp tới') {
      return (
        <View style={[styles.badge, { backgroundColor: '#FBC02D' }]}>
          <Text style={styles.badgeText}>UPCOMING</Text>
        </View>
      );
    }
    if (tournament.status === 'Đã kết thúc') {
      return (
        <View style={[styles.badge, { backgroundColor: '#E0E0E0' }]}>
          <Text style={[styles.badgeText, { color: '#757575' }]}>
            FINISHED
          </Text>
        </View>
      );
    }
    return null;
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View style={styles.thumbnailPlaceholder}>
            <Ionicons name="trophy-outline" size={24} color="#FFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.tournamentName}>{tournament.name}</Text>
            <Text style={styles.tournamentSub}>
              {`${tournament.sport} • ${tournament.location}`}
            </Text>
          </View>
        </View>
        {renderBadge()}
      </View>

      {/* Content based on status */}
      {tournament.status === 'Đang diễn ra' && (
        <View style={styles.cardBody}>
          <View style={styles.progressRow}>
            <Text style={styles.progressText}>Tiến độ giải đấu</Text>
            <Text style={styles.progressText}>{`${tournament.progress}%`}</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${tournament.progress || 0}%` as any },
              ]}
            />
          </View>
          <View style={styles.cardFooter}>
            <View style={styles.avatars}>
              {tournament.participants?.map((p, i) => (
                <View key={i} style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>{p}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity style={styles.actionButton} onPress={onPressDetails}>
              <Text style={styles.actionButtonText}>Xem chi tiết</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {tournament.status === 'Sắp tới' && (
        <View style={styles.cardBody}>
          <View style={styles.gridStats}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Bắt đầu</Text>
              <Text style={styles.statValue}>{tournament.startDate}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Đội đăng ký</Text>
              <Text style={styles.statValue}>{tournament.teamsRegistered}</Text>
            </View>
          </View>
          <View style={styles.cardFooter}>
            <TouchableOpacity style={styles.actionButtonOutline} onPress={onPressRegister}>
              <Text style={styles.actionButtonOutlineText}>Đăng ký ngay</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={onPressDetails}>
              <Text style={styles.actionButtonText}>Xem chi tiết</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {tournament.status === 'Đã kết thúc' && (
        <View style={styles.cardBody}>
          <View style={styles.winnerBox}>
            <Ionicons name="trophy" size={16} color="#4CAF50" />
            <Text style={styles.winnerText}>{`Quán quân: ${tournament.winner}`}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  thumbnailPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tournamentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
  },
  tournamentSub: {
    fontSize: 14,
    color: '#757575',
    marginTop: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE5E5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E53935',
    marginRight: 4,
  },
  liveText: {
    color: '#E53935',
    fontSize: 10,
    fontWeight: 'bold',
  },
  cardBody: {},
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 12,
    color: '#757575',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    marginBottom: 16,
  },
  progressBarFill: {
    height: 6,
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 3,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  avatars: {
    flexDirection: 'row',
  },
  avatarCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: -8,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  avatarText: {
    fontSize: 10,
    color: PRIMARY_COLOR,
    fontWeight: 'bold',
  },
  actionButton: {
    backgroundColor: PRIMARY_COLOR,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  actionButtonOutline: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: PRIMARY_COLOR,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionButtonOutlineText: {
    color: PRIMARY_COLOR,
    fontWeight: 'bold',
  },
  gridStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#EEEEEE',
    paddingVertical: 12,
    marginBottom: 16,
  },
  statBox: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#EEEEEE',
  },
  winnerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F8E9',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  winnerText: {
    marginLeft: 8,
    color: '#2E7D32',
    fontWeight: '500',
  },
});
