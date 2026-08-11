import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/types/navigation';
import { Friend } from '@/types';
import { useFriends } from '@/hooks/useFriends';
import FriendCard from '@/components/friends/FriendCard';
import FriendCodeBanner from '@/components/friends/FriendCodeBanner';
import AddFriendModal from '@/components/friends/AddFriendModal';
import FriendRequestCard from '@/components/friends/FriendRequestCard';
import { GroupsTabContent } from '@/components/groups';


export default function FriendsListScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  // State quản lý tab hiện tại: 'friends' (Bạn bè) hoặc 'groups' (Nhóm)
  const [activeTab, setActiveTab] = useState<'friends' | 'groups'>('friends');

  // State tìm kiếm
  const [searchQuery, setSearchQuery] = useState('');

  // Hook kết nối Supabase
  const {
    friends,
    pendingRequests,
    userFriendCode,
    loading,
    refreshing,
    handleRefresh,
    handleSendFriendRequest,
    handleAcceptRequest,
    handleRejectRequest,
  } = useFriends();

  // State Modal thêm bạn
  const [isAddFriendModalVisible, setIsAddFriendModalVisible] = useState(false);

  // Lọc danh sách bạn bè theo từ khóa tìm kiếm
  const filteredFriends = useMemo(() => {
    if (!searchQuery.trim()) return friends;
    return friends.filter((friend) =>
      friend.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [friends, searchQuery]);

  // Hàm sao chép mã bạn bè
  const handleCopyCode = () => {
    Alert.alert(
      'Đã sao chép',
      `Mã bạn bè của bạn (${userFriendCode}) đã được lưu vào bộ nhớ tạm.`,
      [{ text: 'OK' }]
    );
  };

  // Hàm mở tính năng quét QR
  const handleScanQR = () => {
    navigation.navigate('QRScanner');
  };

  // Hàm gửi lời thách đấu
  const handleChallenge = (friend: Friend) => {
    Alert.alert(
      'Gửi lời thách đấu',
      `Bạn có muốn gửi lời thách đấu tới ${friend.name} không?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Thách đấu',
          onPress: () =>
            Alert.alert('Thành công', `Đã gửi lời thách đấu tới ${friend.name}!`),
        },
      ]
    );
  };

  // Xử lý gửi lời mời kết bạn qua mã
  const handleAddFriendByCode = async (rawCode: string) => {
    const success = await handleSendFriendRequest(rawCode);
    if (success) {
      setIsAddFriendModalVisible(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Header: Brand Name & Notification Bell */}
      <View style={styles.topHeader}>
        <Text style={styles.brandTitle}>SportSync</Text>
        <TouchableOpacity style={styles.notificationBtn} activeOpacity={0.7}>
          <Ionicons name="notifications-outline" size={24} color="#0061AF" />
          {pendingRequests.length > 0 && (
            <View style={styles.badgeNotification}>
              <Text style={styles.badgeNotificationText}>{pendingRequests.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Sub Tabs: Bạn bè / Nhóm */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'friends' && styles.tabItemActive]}
          onPress={() => setActiveTab('friends')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'friends' && styles.tabTextActive]}>
            Bạn bè {pendingRequests.length > 0 && `(${pendingRequests.length})`}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'groups' && styles.tabItemActive]}
          onPress={() => setActiveTab('groups')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'groups' && styles.tabTextActive]}>
            Nhóm
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'friends' ? (
        loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0061AF" />
            <Text style={styles.loadingText}>Đang tải danh sách bạn bè...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredFriends}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <FriendCard friend={item} onChallenge={handleChallenge} />
            )}
            contentContainerStyle={[styles.listContent, { paddingBottom: Math.max(insets.bottom + 80, 100) }]}
            showsVerticalScrollIndicator={false}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            ListHeaderComponent={
              <>
                {/* Banner Mã Bạn Bè */}
                <FriendCodeBanner
                  code={userFriendCode}
                  onCopy={handleCopyCode}
                  onScanQR={handleScanQR}
                />

                {/* Phần Lời mời kết bạn đang chờ (Pending Friend Requests) */}
                {pendingRequests.length > 0 && (
                  <View style={styles.pendingSection}>
                    <Text style={styles.pendingHeader}>
                      LỜI MỜI KẾT BẠN ĐANG CHỜ ({pendingRequests.length})
                    </Text>
                    {pendingRequests.map((req) => (
                      <FriendRequestCard
                        key={req.id}
                        request={req}
                        onAccept={handleAcceptRequest}
                        onReject={handleRejectRequest}
                      />
                    ))}
                  </View>
                )}

                {/* Thanh Tìm Kiếm */}
                <View style={styles.searchBar}>
                  <Ionicons name="search-outline" size={20} color="#9CA3AF" />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Tìm kiếm tên..."
                    placeholderTextColor="#9CA3AF"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                      <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Tiêu đề danh sách */}
                <Text style={styles.sectionHeader}>
                  DANH SÁCH BẠN BÈ ({filteredFriends.length})
                </Text>
              </>
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={48} color="#9CA3AF" />
                <Text style={styles.emptyText}>
                  {searchQuery
                    ? 'Không tìm thấy bạn bè phù hợp'
                    : 'Chưa có bạn bè nào. Bấm dấu (+) để kết bạn ngay!'}
                </Text>
              </View>
            }
          />
        )
      ) : (
        /* Tab Nhóm - Màn hình danh sách nhóm & gợi ý tham gia */
        <GroupsTabContent />
      )}

      {/* Nút FAB (Floating Action Button) Thêm Bạn (chỉ hiển thị ở Tab Bạn bè) */}
      {activeTab === 'friends' && (
        <TouchableOpacity
          style={[styles.fabButton, { bottom: Math.max(insets.bottom + 16, 24) }]}
          activeOpacity={0.85}
          onPress={() => setIsAddFriendModalVisible(true)}
        >
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      )}


      {/* Modal Thêm Bạn Bè */}
      <AddFriendModal
        visible={isAddFriendModalVisible}
        onClose={() => setIsAddFriendModalVisible(false)}
        onSubmit={handleAddFriendByCode}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FBF9F5',
  },

  /* Top Header */
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FBF9F5',
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0061AF',
    letterSpacing: -0.5,
  },
  notificationBtn: {
    padding: 6,
    position: 'relative',
  },
  badgeNotification: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#EF4444',
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeNotificationText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },

  /* Sub Tabs */
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FBF9F5',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: '#0061AF',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#0061AF',
    fontWeight: '700',
  },

  /* Content & List */
  listContent: {
    paddingBottom: 20,
  },

  /* Pending Section */
  pendingSection: {
    marginBottom: 10,
  },
  pendingHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0061AF',
    marginHorizontal: 16,
    marginBottom: 8,
    letterSpacing: 0.5,
  },

  /* Search Bar */
  searchBar: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#1F2937',
  },

  /* Section Header */
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
    marginHorizontal: 16,
    marginBottom: 10,
    letterSpacing: 0.5,
  },

  /* Loading State */
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },

  /* Empty State */
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  groupTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 12,
  },
  groupsTabContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Floating Action Button (FAB) */
  fabButton: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0061AF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0061AF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 6,
  },
});
