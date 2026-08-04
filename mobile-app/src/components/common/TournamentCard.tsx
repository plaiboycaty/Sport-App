import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';

export default function TournamentCard({ tournament }: { tournament: any }) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.info}>
          <Text style={styles.name}>{tournament.name}</Text>
          <Text style={styles.stage}>
            {tournament.currentStage} • {tournament.participantCount} người tham gia
          </Text>
        </View>
        <Ionicons name="trophy-outline" size={24} color={colors.primary} />
      </View>
      
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>Tiến độ giải đấu</Text>
        <Text style={styles.progressValue}>{tournament.progressPercentage}%</Text>
      </View>
      
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${tournament.progressPercentage}%` }]} />
      </View>

      <View style={styles.footer}>
        <View style={styles.avatars}>
          <View style={[styles.avatarMock, { zIndex: 3 }]} />
          <View style={[styles.avatarMock, { zIndex: 2, marginLeft: -12 }]} />
          <View style={[styles.avatarMock, { zIndex: 1, marginLeft: -12 }]} />
        </View>
        
        <TouchableOpacity style={styles.detailsBtn}>
          <Text style={styles.detailsText}>Chi tiết</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  stage: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  progressValue: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  avatars: {
    flexDirection: 'row',
  },
  avatarMock: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ccc',
    borderWidth: 2,
    borderColor: colors.card,
  },
  detailsBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  detailsText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
});
