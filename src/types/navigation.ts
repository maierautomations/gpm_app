import { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Main: NavigatorScreenParams<TabParamList>;
  QRScanner?: undefined;
  PhotoGallery?: undefined;
};

export type TabParamList = {
  Home: undefined;
  Menu: undefined;
  Events: undefined;
  Chat: undefined;
  Profile: undefined;
};