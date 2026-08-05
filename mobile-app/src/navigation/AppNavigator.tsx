import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import AuthStack from './AuthStack';
import MainTab from './MainTab';
import { RootStackParamList } from '@/types';
import { ActivityIndicator, View } from 'react-native';
import NotificationScreen from '@/screens/home/NotificationScreen';
import LiveMatchesScreen from '@/screens/home/LiveMatchesScreen';
import SettingsScreen from '@/screens/profile/SettingsScreen';
import StatsScreen from '@/screens/profile/StatsScreen';
import EditProfileScreen from '@/screens/profile/EditProfileScreen';
import CreateTournamentStep1Screen from '@/screens/tournaments/CreateTournamentStep1Screen'
import CreateTournamentStep2Screen from '@/screens/tournaments/CreateTournamentStep2Screen';


const Stack = createStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {session ? (
          <>
            <Stack.Screen name="Main" component={MainTab} />
            <Stack.Screen name="Notifications" component={NotificationScreen} />
            <Stack.Screen name="LiveMatches" component={LiveMatchesScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="Stats" component={StatsScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="CreateTournamentStep1" component={CreateTournamentStep1Screen} />
            <Stack.Screen name="CreateTournamentStep2" component={CreateTournamentStep2Screen} />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
