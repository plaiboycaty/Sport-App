import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import Header from '../../components/common/Header';
import LiveMatchCard from '../../components/common/LiveMatchCard';
import { mockLiveMatches } from '../../utils/mockData';
import { colors } from '../../constants/colors';

export default function LiveMatchesScreen() {
  return (
    <View style={styles.container}>
      <Header title="Đang diễn ra" showBack={true} />
      
      <FlatList
        data={mockLiveMatches}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <LiveMatchCard match={item} isHorizontal={false} />
        )}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContainer: {
    padding: 16,
  }
});
