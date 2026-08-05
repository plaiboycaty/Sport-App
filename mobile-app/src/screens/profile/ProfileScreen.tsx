import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/types';
import { mockUserProfile, mockPlayerStats, mockMatchHistory } from '../../utils';

type NavigationProp = StackNavigationProp<RootStackParamList>;

export default function ProfileScreen() {
  const navigation = useNavigation<NavigationProp>();
  const user = mockUserProfile;
  const stats = mockPlayerStats;

  return (
    <SafeAreaView style={styles.container}>
      {/* Custom Header: SportSync */}
      <View style={styles.header}>
        <Text style={styles.headerLogo}>SportSync</Text>
        <TouchableOpacity style={styles.notificationBtn} onPress={() => navigation.navigate('Settings')}>
          <Ionicons name="settings-outline" size={24} color="#0061AF" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Profile Info Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatarWrapper}>
            <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-sharp" size={12} color="#0061AF" />
            </View>
          </View>
          <Text style={styles.name}>{user.fullName}</Text>
          <View style={styles.tagPill}>
            <Text style={styles.tagText}>BÁN CHUYÊN</Text>
          </View>
        </View>

        {/* Friend Code Banner */}
        <View style={styles.friendCodeBanner}>
          <View style={styles.friendCodeLeft}>
            <Text style={styles.friendCodeLabel}>MÃ BẠN BÈ CỦA BẠN</Text>
            <View style={styles.friendCodeRow}>
              <Text style={styles.friendCodeValue}>{user.friendCode || 'SPT-9921'}</Text>
              <TouchableOpacity style={styles.copyBtn}>
                <Ionicons name="copy-outline" size={18} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity style={styles.qrBtn}>
            <Ionicons name="qr-code-outline" size={18} color="#0061AF" />
            <Text style={styles.qrText}>Quét QR</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Section */}
        <View style={styles.historyHeader}>
          <Text style={styles.sectionTitle}>THỐNG KÊ</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Stats')}>
            <Text style={styles.seeAllText}>Xem tất cả</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>TỔNG TRẬN</Text>
            <Text style={styles.statValue}>{stats.totalMatches || '128'}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>THẮNG</Text>
            <Text style={styles.statValue}>{stats.winPercentage || '68'}%</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>ELO</Text>
            <Text style={styles.statValue}>{stats.elo || '1450'}</Text>
          </View>
        </View>

        {/* Match History Section */}
        <View style={styles.historyHeader}>
          <Text style={styles.sectionTitle}>LỊCH SỬ THI ĐẤU</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>Xem tất cả</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.historySection}>
          {mockMatchHistory.slice(0, 3).map((match, index) => {
            const isWin = match.eloChange > 0;
            return (
              <View key={match.id || index} style={styles.historyCard}>
                <View style={[styles.historyIcon, isWin ? styles.iconWinBg : styles.iconLossBg]}>
                  <Ionicons
                    name={isWin ? 'trophy' : 'trending-down'}
                    size={22}
                    color={isWin ? '#0061AF' : '#C62828'}
                  />
                </View>

                <View style={styles.historyMiddle}>
                  <Text style={styles.historyTitle} numberOfLines={1}>{match.title}</Text>
                  <Text style={styles.historyDate}>{match.date}</Text>
                </View>

                <View style={styles.historyRight}>
                  <Text style={[styles.historyElo, isWin ? styles.textGreen : styles.textRed]}>
                    {isWin ? '+' : ''}{match.eloChange} Elo
                  </Text>
                  <Text style={styles.historyScore}>{match.score}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Bottom Cards Section */}
        <View style={styles.bottomCardsRow}>
          <TouchableOpacity style={[styles.bottomCard, styles.collectionCard]}>
            <Ionicons name="medal-outline" size={28} color="#0061AF" />
            <Text style={styles.collectionTitle}>Bộ sưu tập</Text>
            <Text style={styles.collectionSub}>12 huy chương</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.bottomCard, styles.groupCard]}>
            <Ionicons name="people" size={28} color="#666666" />
            <Text style={styles.groupTitle}>Nhóm</Text>
            <Text style={styles.groupSub}>Tham gia 3 Nhóm</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FBF8F1', // Chuyển sang nền sáng ngà (kem)
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerLogo: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#0061AF',
  },
  notificationBtn: {
    padding: 4,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  /* Profile Info */
  profileSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: '#FFFFFF',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0061AF',
  },
  name: {
    fontSize: 24,
    fontWeight: '800',
    color: '#222222', // Chữ tối màu
    marginBottom: 8,
  },
  tagPill: {
    backgroundColor: '#E6F0FA', // Nền xanh nhạt
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tagText: {
    color: '#0061AF',
    fontSize: 12,
    fontWeight: '700',
  },
  /* Friend Code Banner */
  friendCodeBanner: {
    backgroundColor: '#0061AF',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  friendCodeLeft: {
    flex: 1,
  },
  friendCodeLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  friendCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  friendCodeValue: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: 'bold',
    marginRight: 10,
  },
  copyBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 6,
    borderRadius: 8,
  },
  qrBtn: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
  },
  qrText: {
    color: '#0061AF',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 6,
  },
  /* Stats Section */
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#888888',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#F0EBE1', // Viền mỏng để nổi trên nền kem
  },
  statLabel: {
    fontSize: 11,
    color: '#888888',
    fontWeight: '600',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0061AF', // Chữ thống kê màu xanh
  },
  /* History Section */
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  seeAllText: {
    color: '#0061AF',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
  },
  historySection: {
    marginBottom: 16,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0EBE1',
  },
  historyIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconWinBg: {
    backgroundColor: '#E3F2FD',
  },
  iconLossBg: {
    backgroundColor: '#FFEBEE',
  },
  historyMiddle: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#222222',
    marginBottom: 4,
  },
  historyDate: {
    fontSize: 12,
    color: '#888888',
  },
  historyRight: {
    alignItems: 'flex-end',
  },
  historyElo: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  textGreen: {
    color: '#2E7D32',
  },
  textRed: {
    color: '#C62828',
  },
  historyScore: {
    fontSize: 13,
    color: '#888888',
    fontWeight: '500',
  },
  /* Bottom Cards */
  bottomCardsRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  bottomCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    minHeight: 120,
    justifyContent: 'flex-end',
  },
  collectionCard: {
    backgroundColor: '#E6F0FA', // Xanh nhạt
    marginRight: 8,
  },
  groupCard: {
    backgroundColor: '#E8E6E1', // Xám/kem nhạt theo figma
    marginLeft: 8,
  },
  collectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0061AF',
    marginTop: 12,
  },
  collectionSub: {
    fontSize: 13,
    color: '#0061AF',
    marginTop: 4,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#222222',
    marginTop: 12,
  },
  groupSub: {
    fontSize: 13,
    color: '#777777',
    marginTop: 4,
  },
});