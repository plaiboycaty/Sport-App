import React, { useEffect, useRef } from 'react';
import { StyleSheet, Platform, Animated } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MainTabParamList } from '@/types';
import HomeScreen from '../screens/home/HomeScreen';
import FriendsListScreen from '../screens/friends/FriendsListScreen';
import TournamentsScreen from '../screens/tournaments/TournamentsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import { useIsFocused } from '@react-navigation/native';

const Tab = createBottomTabNavigator<MainTabParamList>();

const activeColor = '#0061AF';
const inactiveColor = '#4A4843';
const backgroundColor = '#FBF9F5';

function withTabTransition<T extends object>(WrappedComponent: React.ComponentType<T>) {
  return function AnimatedScreen(props: T) {
    const isFocused = useIsFocused();
    // Bắt đầu opacity = 1 để tránh màn trắng trên iOS khi animation chưa kịp chạy
    const slideAnim = useRef(new Animated.Value(30)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      if (isFocused) {
        slideAnim.setValue(30);
        fadeAnim.setValue(0);
        Animated.parallel([
          Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
            tension: 70,
            friction: 12,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            // Thêm delay nhỏ để iOS kịp render component trước khi fade
            delay: Platform.OS === 'ios' ? 50 : 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        // Khi mất focus, reset ngay để lần sau hiệu ứng mượt
        slideAnim.setValue(30);
        fadeAnim.setValue(0);
      }
    }, [isFocused]);

    return (
      <Animated.View
        style={{
          flex: 1,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        <WrappedComponent {...props} />
      </Animated.View>
    );
  };
}

const AnimatedHomeScreen = withTabTransition(HomeScreen);
const AnimatedFriendsListScreen = withTabTransition(FriendsListScreen);
const AnimatedTournamentsScreen = withTabTransition(TournamentsScreen);
const AnimatedProfileScreen = withTabTransition(ProfileScreen);


export default function MainTab() {
  const insets = useSafeAreaInsets();
  const bottomPadding = insets.bottom > 0 ? insets.bottom : (Platform.OS === 'ios' ? 20 : 8);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarStyle: [
          styles.tabBar,
          {
            height: 54 + bottomPadding,
            paddingBottom: bottomPadding,
          },
        ],
        tabBarIcon: ({ focused, color }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Friends') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Tournament') {
            iconName = focused ? 'trophy' : 'trophy-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={AnimatedHomeScreen}
        options={{ title: 'Trang chủ' }}
      />
      <Tab.Screen
        name="Friends"
        component={AnimatedFriendsListScreen}
        options={{ title: 'Bạn bè' }}
      />
      <Tab.Screen
        name="Tournament"
        component={AnimatedTournamentsScreen}
        options={{ title: 'Giải đấu' }}
      />
      <Tab.Screen
        name="Profile"
        component={AnimatedProfileScreen}
        options={{ title: 'Cá nhân' }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: backgroundColor,
    borderTopWidth: 1,
    borderTopColor: '#F0EBE3',
    paddingHorizontal: 14,
    paddingTop: 8,
    elevation: 0,
    shadowOpacity: 0,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
});


