import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Group, SuggestedGroup } from '@/types/group';
import { useGroups } from '@/hooks/useGroups';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/types/navigation';
import CreateGroupButton from './CreateGroupButton';
import GroupCard from './GroupCard';
import SuggestedGroupCard from './SuggestedGroupCard';
import CreateGroupModal from './CreateGroupModal';

export const GroupsTabContent: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  // Sử dụng Hook kết nối Supabase
  const {
    myGroups,
    suggestedGroups,
    loading,
    refreshing,
    loadData,
    handleRefresh,
    handleJoinSuggestedGroup,
    handleCreateGroup,
  } = useGroups();

  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);

  // Tự động tải lại dữ liệu từ Supabase mỗi khi màn hình nhóm được focus / hiển thị lại
  useFocusEffect(
    useCallback(() => {
      loadData(false);
    }, [loadData])
  );

  // Mở màn hình Tạo Nhóm Mới (CreateGroupScreen)
  const handleOpenCreateGroupScreen = () => {
    navigation.navigate('CreateGroup');
  };

  // Xử lý tạo nhóm nhanh từ Modal
  const handleModalCreateGroup = async (newGroupData: any) => {
    await handleCreateGroup({
      name: newGroupData.name,
      sportName: newGroupData.sportType,
      description: newGroupData.description,
    });
  };

  // Xử lý bấm xem chi tiết nhóm của tôi -> Mở GroupDetailScreen
  const handleGroupPress = (group: Group) => {
    navigation.navigate('GroupDetail', {
      groupId: group.id,
      groupName: group.name,
    });
  };

  // Xử lý bấm vào gợi ý nhóm
  const handleSuggestedGroupPress = (suggested: SuggestedGroup) => {
    Alert.alert(
      'Tham gia nhóm',
      `Bạn có muốn tham gia nhóm "${suggested.name}" (${suggested.sportType}) không?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Tham gia ngay',
          onPress: () => handleJoinSuggestedGroup(suggested),
        },
      ]
    );
  };

  // Xử lý bấm "Xem tất cả"
  const handleViewAllGroups = () => {
    Alert.alert('Danh sách nhóm', `Bạn hiện đang tham gia ${myGroups.length} nhóm thể thao.`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0061AF" />
        <Text style={styles.loadingText}>Đang tải danh sách nhóm từ Supabase...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom + 80, 100) }]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={['#0061AF']}
          tintColor="#0061AF"
        />
      }
    >
      {/* Nút Tạo nhóm mới */}
      <CreateGroupButton onPress={handleOpenCreateGroupScreen} />

      {/* DANH SÁCH NHÓM CỦA TÔI (My Groups Section) */}
      <View style={styles.sectionHeaderContainer}>
        <Text style={styles.sectionTitle}>
          NHÓM CỦA BẠN ({myGroups.length})
        </Text>
        {myGroups.length > 0 && (
          <TouchableOpacity onPress={handleViewAllGroups} activeOpacity={0.7}>
            <Text style={styles.viewAllText}>Xem tất cả</Text>
          </TouchableOpacity>
        )}
      </View>

      {myGroups.length > 0 ? (
        myGroups.map((group) => (
          <GroupCard key={group.id} group={group} onPress={handleGroupPress} />
        ))
      ) : (
        <View style={styles.emptyGroupCard}>
          <Ionicons name="people-circle-outline" size={42} color="#9CA3AF" />
          <Text style={styles.emptyGroupText}>
            Bạn chưa tham gia nhóm thể thao nào.
          </Text>
          <Text style={styles.emptyGroupSubText}>
            Tạo nhóm mới hoặc chọn một nhóm gợi ý bên dưới để kết nối cùng đồng đội!
          </Text>
        </View>
      )}

      {/* GỢI Ý THAM GIA (Suggested Groups Section) */}
      {suggestedGroups.length > 0 && (
        <>
          <View style={[styles.sectionHeaderContainer, { marginTop: 16 }]}>
            <Text style={styles.sectionTitle}>GỢI Ý THAM GIA ({suggestedGroups.length})</Text>
          </View>

          <View style={styles.gridContainer}>
            {suggestedGroups.map((suggested, index) => (
              <View
                key={suggested.id}
                style={[
                  styles.gridItem,
                  index % 2 === 0 ? { paddingRight: 6 } : { paddingLeft: 6 },
                ]}
              >
                <SuggestedGroupCard
                  group={suggested}
                  onPress={handleSuggestedGroupPress}
                  onJoin={handleJoinSuggestedGroup}
                />
              </View>
            ))}
          </View>
        </>
      )}

      {/* Modal Tạo Nhóm Nhanh */}
      <CreateGroupModal
        visible={isCreateModalVisible}
        onClose={() => setIsCreateModalVisible(false)}
        onSubmit={handleModalCreateGroup}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FBF9F5',
  },
  scrollContent: {
    paddingBottom: 24,
  },

  /* Loading */
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#FBF9F5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },

  /* Section Header */
  sectionHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
    letterSpacing: 0.5,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0061AF',
  },

  /* Empty state */
  emptyGroupCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  emptyGroupText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
    marginTop: 8,
    textAlign: 'center',
  },
  emptyGroupSubText: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
    lineHeight: 18,
  },

  /* 2 Column Grid Container */
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingBottom: 0,
  },
  gridItem: {
    width: '50%',
    marginBottom: 12,
  },
});

export default GroupsTabContent;
