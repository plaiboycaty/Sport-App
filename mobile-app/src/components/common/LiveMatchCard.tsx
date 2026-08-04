import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { colors } from '../../constants/colors';

export default function LiveMatchCard({ match, isHorizontal = true }: { match: any, isHorizontal?: boolean }) {
  return (
    <View style={[styles.container, isHorizontal ? styles.horizontal : styles.vertical]}>
      <View style={styles.header}>
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
        <Text style={styles.tournamentName} numberOfLines={1}>{match.tournamentName}</Text>
        <Text style={styles.setInfo}>Set {match.currentSet}</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.team}>
          <Image source={{ uri: match.homeTeam.avatarUrl }} style={styles.avatar} />
          <Text style={styles.playerName} numberOfLines={1}>{match.homeTeam.name}</Text>
        </View>

        <View style={styles.scoreContainer}>
          <Text style={styles.scoreText}>{match.homeTeam.score}</Text>
          <Text style={styles.scoreDivider}>-</Text>
          <Text style={styles.scoreText}>{match.awayTeam.score}</Text>
          <Text style={styles.locationText}>{match.location}</Text>
        </View>

        <View style={styles.team}>
          <Image source={{ uri: match.awayTeam.avatarUrl }} style={styles.avatar} />
          <Text style={styles.playerName} numberOfLines={1}>{match.awayTeam.name}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.primary,
    marginBottom: 16,
  },
  horizontal: {
    width: 320,
    marginRight: 16,
    marginBottom: 0,
  },
  vertical: {
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
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
    backgroundColor: colors.live,
    marginRight: 4,
  },
  liveText: {
    color: colors.live,
    fontSize: 10,
    fontWeight: 'bold',
  },
  tournamentName: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    color: colors.textSecondary,
    paddingHorizontal: 8,
  },
  setInfo: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  team: {
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginBottom: 8,
    backgroundColor: '#eee',
  },
  playerName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    flex: 1,
  },
  scoreText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
  },
  scoreDivider: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textSecondary,
    marginHorizontal: 8,
  },
  locationText: {
    width: '100%',
    textAlign: 'center',
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 4,
  }
});
