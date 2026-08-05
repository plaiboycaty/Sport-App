import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DUMMY_TOURNAMENTS } from '@/utils/tournamentMockData';
import TournamentCardItem from '@/components/tournaments/TournamentCardItem';

type NavigationProp = StackNavigationProp<RootStackParamList>;

const PRIMARY_COLOR = '#0061AF';

export default function TournamentsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [activeTab, setActiveTab] = useState('Tất cả');

  const tabs = ['Tất cả', 'Đang diễn ra', 'Sắp tới', 'Đã kết thúc'];

  const filteredTournaments = DUMMY_TOURNAMENTS.filter((t) => {
    if (activeTab === 'Tất cả') return true;
    return t.status === activeTab;
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerLogo}>SportSync</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tabButton,
                activeTab === tab && styles.tabButtonActive,
              ]}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab && styles.tabTextActive,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* List */}
      <ScrollView contentContainerStyle={styles.listContainer}>
        {filteredTournaments.map((tournament) => (
          <TournamentCardItem
            key={tournament.id}
            tournament={tournament}
            onPressDetails={() => {
              // Action for details
            }}
            onPressRegister={() => {
              // Action for register
            }}
          />
        ))}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateTournamentStep1')}
      >
        <Ionicons name="add" size={32} color="#FFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFBF7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerLogo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: PRIMARY_COLOR,
  },
  tabContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  tabScroll: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFF',
  },
  tabButtonActive: {
    backgroundColor: PRIMARY_COLOR,
    borderColor: PRIMARY_COLOR,
  },
  tabText: {
    color: '#757575',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#FFF',
  },
  listContainer: {
    padding: 16,
    gap: 16,
    paddingBottom: 80,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: PRIMARY_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
});