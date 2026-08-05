import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';

export default function NotificationCard({ notification }: { notification: any }) {
  const getIcon = () => {
    switch(notification.type) {
      case 'tournament_invite': return 'trophy-outline';
      case 'match_reminder': return 'calendar-outline';
      case 'match_result': return 'flag-outline';
      case 'group_update': return 'people-outline';
      case 'system_stats': return 'bar-chart-outline';
      default: return 'notifications-outline';
    }
  };

  return (
    <View style={[styles.container, !notification.isRead && styles.unreadCard]}>
      <View style={styles.iconContainer}>
        <Ionicons name={getIcon()} size={22} color={colors.primary || '#0056b3'} />
      </View>
      
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{notification.title}</Text>
          {/* Dấu chấm xanh cho thông báo chưa đọc */}
          {!notification.isRead && <View style={styles.unreadDot} />}
        </View>
        
        <Text style={styles.body}>{notification.body}</Text>

        {/* Cụm Avatar đặc thù cho thông báo kết quả trận đấu */}
        {notification.type === 'match_result' && (
          <View style={styles.avatarRow}>
            <Image source={{uri: 'https://i.pravatar.cc/100?img=11'}} style={[styles.avatar, { zIndex: 2 }]} />
            <Image source={{uri: 'https://i.pravatar.cc/100?img=12'}} style={[styles.avatar, { marginLeft: -8, zIndex: 1 }]} />
            <Text style={styles.avatarText}>Bạn và 1 người khác</Text>
          </View>
        )}

        <Text style={styles.time}>
          {notification.createdAt 
            ? new Date(notification.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
            : notification.timeStr} {/* Sử dụng chuỗi thời gian nếu có */}
        </Text>

        {/* Nút hành động cho lời mời tham gia giải */}
        {notification.type === 'tournament_invite' && (
          <View style={styles.actions}>
            <TouchableOpacity style={[styles.btn, styles.btnPrimary]}>
              <Text style={styles.btnPrimaryText}>Chấp nhận</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.btnSecondary]}>
              <Text style={styles.btnSecondaryText}>Từ chối</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  unreadCard: {
    borderColor: colors.primary || '#0056b3',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E6F0F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333333',
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary || '#0056b3',
    marginLeft: 8,
  },
  body: {
    fontSize: 14,
    color: '#4F4F4F',
    marginBottom: 10,
    lineHeight: 20,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  avatarText: {
    fontSize: 12,
    color: '#828282',
    marginLeft: 8,
  },
  time: {
    fontSize: 12,
    color: '#828282',
  },
  actions: {
    flexDirection: 'row',
    marginTop: 14,
    justifyContent: 'space-between',
  },
  btn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimary: {
    backgroundColor: colors.primary || '#0056b3',
    marginRight: 6,
  },
  btnSecondary: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D0D0D0',
    marginLeft: 6,
  },
  btnPrimaryText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  btnSecondaryText: {
    color: '#333333',
    fontWeight: '600',
    fontSize: 14,
  }
});