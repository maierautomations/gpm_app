import AppNavigator from './src/navigation/AppNavigator';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useUserStore } from './src/stores/userStore';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export default function App() {
  const initialize = useUserStore((state) => state.initialize);

  useEffect(() => {
    initialize();
    Notifications.requestPermissionsAsync();
  }, [initialize]);

  return (
    <>
      <AppNavigator />
      <StatusBar style="auto" />
    </>
  );
}