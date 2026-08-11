import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { Group, SuggestedGroup, SportOption, CreateGroupInput } from '@/types/group';
import { groupService } from '@/services/groupService';

export function useGroups() {
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [suggestedGroups, setSuggestedGroups] = useState<SuggestedGroup[]>([]);
  const [sports, setSports] = useState<SportOption[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Tải danh sách nhóm của tôi, nhóm gợi ý và danh mục môn thể thao từ Supabase
  const loadData = useCallback(async (showLoadingSpinner = false) => {
    if (showLoadingSpinner) {
      setLoading(true);
    }
    try {
      const [groupsList, suggestedList, sportsList] = await Promise.all([
        groupService.getMyGroups(),
        groupService.getSuggestedGroups(),
        groupService.getSports(),
      ]);

      setMyGroups(groupsList);
      setSuggestedGroups(suggestedList);
      setSports(sportsList);
    } catch (error: any) {
      console.error('Lỗi khi tải dữ liệu Group từ Supabase:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData(true);
  }, [loadData]);

  // Làm mới khi vuốt xuống
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadData(false);
  }, [loadData]);

  // Tham gia nhóm gợi ý
  const handleJoinSuggestedGroup = async (group: SuggestedGroup) => {
    try {
      await groupService.joinGroup(group.id);
      Alert.alert('Thành công', `Bạn đã tham gia nhóm "${group.name}"!`);
      loadData(false);
      return true;
    } catch (err: any) {
      Alert.alert('Thông báo', err.message || 'Không thể tham gia nhóm.');
      return false;
    }
  };

  // Tạo nhóm mới
  const handleCreateGroup = async (input: CreateGroupInput) => {
    try {
      const created = await groupService.createGroup(input);
      Alert.alert('Thành công', `Nhóm "${created.name}" đã được tạo thành công!`);
      loadData(false);
      return created;
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể tạo nhóm mới.');
      return null;
    }
  };

  // Rời nhóm
  const handleLeaveGroup = async (groupId: string, groupName: string) => {
    try {
      await groupService.leaveGroup(groupId);
      Alert.alert('Đã rời nhóm', `Bạn đã rời khỏi nhóm "${groupName}".`);
      loadData(false);
      return true;
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể rời nhóm.');
      return false;
    }
  };

  // Xóa nhóm
  const handleDeleteGroup = async (groupId: string, groupName: string) => {
    try {
      await groupService.deleteGroup(groupId);
      Alert.alert('Đã xóa nhóm', `Nhóm "${groupName}" đã được xóa thành công.`);
      loadData(false);
      return true;
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể xóa nhóm.');
      return false;
    }
  };

  return {
    myGroups,
    suggestedGroups,
    sports,
    loading,
    refreshing,
    loadData,
    handleRefresh,
    handleJoinSuggestedGroup,
    handleCreateGroup,
    handleLeaveGroup,
    handleDeleteGroup,
  };
}
