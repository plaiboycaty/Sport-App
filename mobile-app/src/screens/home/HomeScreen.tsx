import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/types';
import Header from '../../components/common/Header';
import LiveMatchCard from '../../components/common/LiveMatchCard';
import TournamentCard from '../../components/common/TournamentCard';
import { mockLiveMatches, mockTournaments } from '../../utils/mockData';
import { colors } from '../../constants/colors';
import { Ionicons } from '@expo/vector-icons';

type NavigationProp = StackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();

  return (
    <View style={styles.container}>
      <Header title="SportSync" showNotification={true} />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* HÀNH ĐỘNG NHANH */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>HÀNH ĐỘNG NHANH</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.actionBtn}>
              <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
              <Text style={styles.actionText}>Tạo phòng đấu</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn}>
              <Ionicons name="qr-code-outline" size={24} color={colors.primary} />
              <Text style={styles.actionText}>Quét mã</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ĐANG DIỄN RA */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>ĐANG DIỄN RA</Text>
            <TouchableOpacity onPress={() => navigation.navigate('LiveMatches')}>
              <Text style={styles.seeAll}>Tất cả</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {mockLiveMatches.map((match) => (
              <LiveMatchCard key={match.id} match={match} isHorizontal={true} />
            ))}
          </ScrollView>
        </View>

        {/* GIẢI ĐẤU CỦA BẠN */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>GIẢI ĐẤU CỦA BẠN</Text>
          {mockTournaments.map((tournament) => (
            <TournamentCard key={tournament.id} tournament={tournament} />
          ))}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.background 
  },
  scrollContent: {
    paddingBottom: 24,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    paddingVertical: 14,
    borderRadius: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  horizontalScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  }
});
