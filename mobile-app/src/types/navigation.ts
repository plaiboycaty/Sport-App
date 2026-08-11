import { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Friends: undefined;
  Profile: undefined;
  Tournament: undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  Notifications: undefined;
  LiveMatches: undefined;
  Settings: undefined;
  Stats: undefined;
  EditProfile: undefined;
  CreateTournamentStep1: undefined;
  CreateTournamentStep2: undefined;
  QRScanner: undefined;
  CreateGroup: undefined;
  GroupDetail: { groupId?: string; groupName?: string };
};

