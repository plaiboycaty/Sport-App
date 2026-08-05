import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import Header from '../../components/common/Header';
import NotificationCard from '../../components/common/NotificationCard';
import { mockNotifications } from '../../utils/mockData';
import { colors } from '../../constants/colors';

export default function NotificationScreen() {
  const today = new Date();
  
  const notificationsToday = mockNotifications.filter(n => {
    const d = new Date(n.createdAt);
    return d.getDate() === today.getDate() && 
           d.getMonth() === today.getMonth() && 
           d.getFullYear() === today.getFullYear();
  });
  
  const notificationsEarlier = mockNotifications.filter(n => {
    const d = new Date(n.createdAt);
    return d.getDate() !== today.getDate() || 
           d.getMonth() !== today.getMonth() || 
           d.getFullYear() !== today.getFullYear();
  });

  const sections = [
    { title: 'HÔM NAY', data: notificationsToday },
    { title: 'TRƯỚC ĐÓ', data: notificationsEarlier }
  ].filter(section => section.data.length > 0);

  return (
    <View style={styles.container}>
      <Header title="Thông báo" showBack={true} />
      
      <FlatList
        data={sections}
        keyExtractor={(item) => item.title}
        renderItem={({ item }) => (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{item.title}</Text>
            {item.data.map(notification => (
              <NotificationCard key={notification.id} notification={notification} />
            ))}
          </View>
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
    backgroundColor: '#F8F9FA', // Chuyển sang màu xám nhạt giống thiết kế
  },
  listContainer: {
    padding: 16,
  },
  section: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 12,
    marginTop: 8,
    letterSpacing: 0.5,
  }
});