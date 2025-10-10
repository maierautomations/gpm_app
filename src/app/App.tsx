import AppNavigator from './navigation/AppNavigator';
import { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useUserStore } from '../stores/userStore';
import notificationService from '../services/notifications/notificationService';
import FeatureFlagService from '../services/featureFlagService';
import * as Notifications from 'expo-notifications';
import { NavigationContainerRef } from '@react-navigation/native';
import ErrorBoundary from '../shared/components/ErrorBoundary';
import { ToastProvider } from '../shared/components';
import * as Sentry from '@sentry/react-native';

// Initialize Sentry for error monitoring
Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  environment: process.env.EXPO_PUBLIC_SENTRY_ENVIRONMENT || 'production',
  enableInExpoDevelopment: false, // Only active in production builds, not in Expo Go
  tracesSampleRate: 1.0, // Track 100% of transactions
});

function App() {
  const initialize = useUserStore((state) => state.initialize);
  const user = useUserStore((state) => state.user);
  const navigationRef = useRef<NavigationContainerRef<any>>(null);
  const notificationResponseListener = useRef<any>();

  useEffect(() => {
    // Initialize PostHog for feature flags and analytics
    FeatureFlagService.initialize();

    // Initialize user store
    initialize();

    // Initialize notification service when user is authenticated
    if (user?.id) {
      notificationService.initialize(user.id);

      // Identify user in PostHog for feature flag targeting
      FeatureFlagService.identifyUser(user.id, {
        email: user.email,
      });
    } else {
      // Reset PostHog on logout
      FeatureFlagService.resetUser();
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
    <ToastProvider>
      <ErrorBoundary>
        <AppNavigator navigationRef={navigationRef} />
        <StatusBar style="auto" />
      </ErrorBoundary>
    </ToastProvider>
  );
}
export default Sentry.wrap(App);