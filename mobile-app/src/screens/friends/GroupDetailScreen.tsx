import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/types/navigation';
import { GroupDetailData, GroupMemberItem } from '@/types/group';
import { groupService, getSportIconByName } from '@/services/groupService';
import EditGroupModal from '@/components/groups/EditGroupModal';
import AddGroupMemberModal from '@/components/groups/AddGroupMemberModal';

export default function GroupDetailScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'GroupDetail'>>();

  // Route Params
  const { groupId, groupName: initialGroupName } = route.params || {};

  // Screen State
  const [data, setData] = useState<GroupDetailData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState<boolean>(false);
  const [isAddMemberModalVisible, setIsAddMemberModalVisible] = useState<boolean>(false);

  // Tải chi tiết nhóm từ Supabase
  const loadGroupDetail = useCallback(async () => {
    if (!groupId) {
      setLoading(false);
      return;
    }

    try {
      const detail = await groupService.getGroupDetail(groupId);
      setData(detail);
    } catch (err: any) {
      console.error('Lỗi khi tải chi tiết nhóm Supabase:', err);
      Alert.alert('Thông báo', err.message || 'Không thể tải thông tin nhóm.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [groupId]);

  useEffect(() => {
    loadGroupDetail();
  }, [loadGroupDetail]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadGroupDetail();
  }, [loadGroupDetail]);

  // Xử lý rời nhóm
  const handleLeaveGroup = () => {
    if (!groupId || !data) return;

    Alert.alert(
      'Xác nhận rời nhóm',
      `Bạn có chắc chắn muốn rời khỏi nhóm "${data.group.name}" không?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Rời nhóm',
          style: 'destructive',
          onPress: async () => {
            try {
              await groupService.leaveGroup(groupId);
              Alert.alert('Đã rời nhóm', `Bạn đã rời khỏi nhóm ${data.group.name}.`, [
                {
                  text: 'OK',
                  onPress: () => navigation.goBack(),
                },
              ]);
            } catch (err: any) {
              Alert.alert('Lỗi', err.message || 'Không thể rời nhóm.');
            }
          },
        },
      ]
    );
  };

  // Xử lý xóa nhóm (dành cho chủ nhóm)
  const handleDeleteGroup = () => {
    if (!groupId || !data) return;

    Alert.alert(
      'Xác nhận giải tán nhóm',
      `Bạn có chắc chắn muốn giải tán nhóm "${data.group.name}" không? Thao tác này không thể hoàn tác.`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Giải tán nhóm',
          style: 'destructive',
          onPress: async () => {
            try {
              await groupService.deleteGroup(groupId);
              Alert.alert('Đã giải tán nhóm 🎉', `Nhóm "${data.group.name}" đã được giải tán thành công.`, [
                {
                  text: 'OK',
                  onPress: () => navigation.goBack(),
                },
              ]);
            } catch (err: any) {
              Alert.alert('Lỗi', err.message || 'Không thể xóa nhóm.');
            }
          },
        },
      ]
    );
  };

  // Xử lý thêm bạn bè vào nhóm từ Modal
  const handleAddMembersSubmit = async (selectedFriendIds: string[]) => {
    if (!groupId) return;
    await groupService.addMembers(groupId, selectedFriendIds);
    Alert.alert('Thành công', `Đã thêm ${selectedFriendIds.length} thành viên vào nhóm!`);
    loadGroupDetail();
  };

  // Action Menu khi bấm vào một thành viên
  const handleMemberAction = (member: GroupMemberItem) => {
    if (!data || !groupId) return;

    const isMemberOwner = member.role === 'TRƯỞNG NHÓM';
    const buttons: any[] = [];

    // Nếu người dùng hiện tại là chủ nhóm và thành viên được chọn không phải chủ nhóm -> Có quyền xóa
    if (data.isOwner && !isMemberOwner) {
      buttons.push({
        text: 'Gỡ khỏi nhóm',
        style: 'destructive',
        onPress: () => {
          Alert.alert(
            'Xác nhận gỡ',
            `Bạn có chắc muốn gỡ ${member.name} khỏi nhóm không?`,
            [
              { text: 'Hủy', style: 'cancel' },
              {
                text: 'Gỡ thành viên',
                style: 'destructive',
                onPress: async () => {
                  try {
                    await groupService.removeMember(groupId, member.userId);
                    Alert.alert('Thành công', `Đã gỡ ${member.name} khỏi nhóm.`);
                    loadGroupDetail();
                  } catch (e: any) {
                    Alert.alert('Lỗi', e.message || 'Không thể gỡ thành viên.');
                  }
                },
              },
            ]
          );
        },
      });
    }

    buttons.push({
      text: 'Xem mã bạn bè',
      onPress: () => {
        Alert.alert('Mã bạn bè', `${member.name}: ${member.friendCode || 'Chưa cập nhật'}`);
      },
    });

    buttons.push({ text: 'Đóng', style: 'cancel' });

    Alert.alert(member.name, `Trình độ: ${member.skillLevel || 'Chưa rõ'}`, buttons);
  };

  // Lưu thông tin chỉnh sửa nhóm từ Modal
  const handleSaveEditGroup = async (updatedData: {
    name: string;
    sportType: string;
    avatarUrl?: string;
  }) => {
    if (!groupId) return;

    try {
      await groupService.updateGroup(groupId, {
        name: updatedData.name,
        sportName: updatedData.sportType,
        avatarUrl: updatedData.avatarUrl,
      });

      Alert.alert('Thành công', 'Đã cập nhật thông tin nhóm!');
      loadGroupDetail();
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể cập nhật thông tin nhóm.');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingCenter, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#0061AF" />
        <Text style={styles.loadingText}>Đang tải thông tin nhóm từ Supabase...</Text>
      </View>
    );
  }

  const group = data?.group;
  const members = data?.members || [];
  const isOwner = data?.isOwner || false;

  const currentGroupName = group?.name || initialGroupName || 'Chi tiết nhóm';
  const currentSportType = group?.sportType || 'Thể thao';
  const currentAvatar = group?.avatarUrl;

  const existingUserIds = members.map((m) => m.userId);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header Bar */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#0061AF" />
        </TouchableOpacity>

        <Text style={styles.headerTitle} numberOfLines={1}>
          {currentGroupName}
        </Text>

        {isOwner ? (
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => setIsEditModalVisible(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="pencil" size={22} color="#0061AF" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 36 }} />
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + 24, 40) },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#0061AF']}
            tintColor="#0061AF"
          />
        }
      >
        {/* Top Header Card */}
        <View style={styles.topCard}>
          {currentAvatar ? (
            <Image source={{ uri: currentAvatar }} style={styles.groupAvatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons
                name={(group?.icon || getSportIconByName(currentSportType)) as keyof typeof Ionicons.glyphMap}
                size={44}
                color="#0061AF"
              />
            </View>
          )}

          <Text style={styles.groupNameText}>{currentGroupName}</Text>

          <View style={styles.badgesRow}>
            <View style={styles.sportBadge}>
              <Text style={styles.sportBadgeText}>{currentSportType}</Text>
            </View>

            <View style={styles.memberCountRow}>
              <Ionicons name="people" size={14} color="#6B7280" style={{ marginRight: 4 }} />
              <Text style={styles.memberCountText}>{members.length} thành viên</Text>
            </View>
          </View>
        </View>

        {/* Section: Thành viên */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Thành viên ({members.length})</Text>
        </View>

        <View style={styles.membersCard}>
          {/* Nút Thêm thành viên */}
          <TouchableOpacity
            style={styles.addMemberRow}
            onPress={() => setIsAddMemberModalVisible(true)}
            activeOpacity={0.7}
          >
            <View style={styles.addIconCircle}>
              <Ionicons name="add" size={20} color="#0061AF" />
            </View>
            <Text style={styles.addMemberText}>Thêm thành viên từ bạn bè</Text>
          </TouchableOpacity>

          {/* Danh sách thành viên */}
          {members.map((item) => {
            const initials = item.name
              .split(' ')
              .map((n) => n[0])
              .slice(-2)
              .join('');

            return (
              <View key={item.id} style={styles.memberRow}>
                {item.avatarUrl ? (
                  <Image source={{ uri: item.avatarUrl }} style={styles.memberAvatar} />
                ) : (
                  <View style={styles.memberInitialsAvatar}>
                    <Text style={styles.memberInitialsText}>{initials}</Text>
                  </View>
                )}

                <View style={styles.memberInfo}>
                  <View style={styles.memberNameRow}>
                    <Text style={styles.memberName}>{item.name}</Text>
                    {item.role === 'TRƯỞNG NHÓM' && (
                      <View style={styles.leaderBadge}>
                        <Text style={styles.leaderBadgeText}>TRƯỞNG NHÓM</Text>
                      </View>
                    )}
                  </View>
                  {item.skillLevel && (
                    <Text style={styles.memberSkillText}>
                      Trình độ: {item.skillLevel}
                    </Text>
                  )}
                </View>

                <TouchableOpacity
                  style={styles.moreActionBtn}
                  onPress={() => handleMemberAction(item)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="ellipsis-horizontal" size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {/* Action Button: Rời nhóm (nếu là Member) hoặc Xóa nhóm (nếu là Owner) */}
        {isOwner ? (
          <TouchableOpacity
            style={styles.deleteGroupBtn}
            onPress={handleDeleteGroup}
            activeOpacity={0.8}
          >
            <Ionicons name="trash-outline" size={20} color="#DC2626" style={{ marginRight: 8 }} />
            <Text style={styles.deleteGroupText}>Giải tán nhóm</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.leaveGroupBtn}
            onPress={handleLeaveGroup}
            activeOpacity={0.8}
          >
            <Ionicons name="log-out-outline" size={20} color="#DC2626" style={{ marginRight: 8 }} />
            <Text style={styles.leaveGroupText}>Rời nhóm</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Modal Chỉnh sửa nhóm */}
      <EditGroupModal
        visible={isEditModalVisible}
        onClose={() => setIsEditModalVisible(false)}
        initialName={currentGroupName}
        initialSportType={currentSportType}
        initialAvatar={currentAvatar || undefined}
        onSave={handleSaveEditGroup}
      />

      {/* Modal Thêm Bạn Bè Vào Nhóm */}
      <AddGroupMemberModal
        visible={isAddMemberModalVisible}
        onClose={() => setIsAddMemberModalVisible(false)}
        existingMemberUserIds={existingUserIds}
        onAddMembers={handleAddMembersSubmit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingCenter: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },

  /* Header */
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
  },
  headerBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0061AF',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },

  scrollContent: {
    paddingBottom: 40,
  },

  /* Top Header Card */
  topCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  groupAvatarImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 14,
  },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#E5F1FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 2,
    borderColor: '#BFDBFE',
  },
  groupNameText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 10,
    textAlign: 'center',
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sportBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sportBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  memberCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberCountText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },

  /* Section Title */
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },

  /* Members Card */
  membersCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  addMemberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  addIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E5F1FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  addMemberText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0061AF',
  },

  /* Member rows */
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  memberInitialsAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberInitialsText: {
    color: '#475569',
    fontSize: 16,
    fontWeight: '700',
  },
  memberInfo: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  memberSkillText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  leaderBadge: {
    backgroundColor: '#0061AF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  leaderBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  moreActionBtn: {
    padding: 6,
  },

  /* Leave Group Button */
  leaveGroupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 14,
    paddingVertical: 14,
    marginHorizontal: 16,
  },
  leaveGroupText: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: '700',
  },

  /* Delete Group Button */
  deleteGroupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 14,
    paddingVertical: 14,
    marginHorizontal: 16,
  },
  deleteGroupText: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: '700',
  },
});
