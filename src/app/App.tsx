import AppNavigator from './navigation/AppNavigator';
import { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useUserStore } from '../stores/userStore';
import notificationService from '../services/notifications/notificationService';
import * as Notifications from 'expo-notifications';
import { NavigationContainerRef } from '@react-navigation/native';

export default function App() {
  const initialize = useUserStore((state) => state.initialize);
  const user = useUserStore((state) => state.user);
  const navigationRef = useRef<NavigationContainerRef<any>>(null);
  const notificationResponseListener = useRef<any>();

  useEffect(() => {
    // Initialize user store
    initialize();

    // Initialize notification service when user is authenticated
    if (user?.id) {
      notificationService.initialize(user.id);
    }

    // Handle notification responses (when user taps notification)
    notificationResponseListener.current = Notifications.addNotificationResponseReceivedListener(
      response => {
        const data = response.notification.request.content.data;
        
        // Navigate based on notification type
        if (navigationRef.current && data) {
          switch (data.type) {
            case 'weekly_offer':
              // Navigate to menu screen with offers filter
              navigationRef.current.navigate('Menu', { showOffers: true });
              break;
            case 'event_reminder':
              // Navigate to events screen
              navigationRef.current.navigate('Events');
              break;
            case 'points_earned':
              // Navigate to profile screen
              navigationRef.current.navigate('Profile');
              break;
            default:
              // Navigate to home by default
              navigationRef.current.navigate('Home');
              break;
          }
        }
      }
    );

    return () => {
      // Cleanup notification listeners
      if (notificationResponseListener.current) {
        notificationResponseListener.current.remove();
      }
      notificationService.cleanup();
    };
  }, [initialize, user?.id]);

  return (
    <>
      <AppNavigator navigationRef={navigationRef} />
      <StatusBar style="auto" />
    </>
  );
}