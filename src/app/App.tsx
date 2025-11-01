import AppNavigator from './navigation/AppNavigator';
import { useEffect, useRef, useState, useCallback } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useUserStore } from '../stores/userStore';
import notificationService from '../services/notifications/notificationService';
import FeatureFlagService from '../services/featureFlagService';
import * as Notifications from 'expo-notifications';
import { NavigationContainerRef } from '@react-navigation/native';
import ErrorBoundary from '../shared/components/ErrorBoundary';
import { ToastProvider } from '../shared/components';
import * as Sentry from '@sentry/react-native';
import * as SplashScreen from 'expo-splash-screen';
import { perfMonitor } from '../utils/performanceMonitor';
import { deferToInteractive, deferToIdle } from '../utils/deferredInit';
import { logger } from '../utils/logger';

// Mark module load time (for performance measurement)
perfMonitor.mark('app_module_load');

// Prevent splash from auto-hiding
SplashScreen.preventAutoHideAsync().catch(error => {
  logger.warn('SplashScreen.preventAutoHideAsync failed:', error);
});

// DO NOT initialize Sentry here - moved to useEffect for deferred init

function App() {
  const [appIsReady, setAppIsReady] = useState(false);
  const initialize = useUserStore((state) => state.initialize);
  const navigationRef = useRef<NavigationContainerRef<any>>(null);
  const notificationResponseListener = useRef<any>();

  useEffect(() => {
    // Mark component mount for performance tracking
    perfMonitor.mark('app_component_mount');

    // PHASE 1: CRITICAL - Run immediately (blocks app readiness)
    async function initializeCriticalServices() {
      try {
        // Only auth is truly critical - user state affects entire app
        const user = await initialize(); // Returns User | null
        perfMonitor.mark('auth_complete');

        // Mark app as ready (splash can hide now)
        setAppIsReady(true);

        logger.debug('Critical services initialized (auth complete)');

        // PHASE 2: HIGH PRIORITY - Run after interactions (doesn't block UI)
        deferToInteractive(() => {
          // PostHog: Feature flags can use defaults until ready
          FeatureFlagService.initialize();

          // Notifications: Can register push token after app is interactive
          // Use user from initialize() return value, not Zustand state (fixes race condition)
          if (user?.id) {
            notificationService.initialize(user.id);
            FeatureFlagService.identifyUser(user.id, { email: user.email });
          }

          logger.debug('High priority services initialized (PostHog, notifications)');
        });

        // PHASE 3: LOW PRIORITY - Run after 1 second (truly non-critical)
        deferToIdle(() => {
          // Sentry: Static import, deferred initialization
          if (!__DEV__) {
            Sentry.init({
              dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
              environment: process.env.EXPO_PUBLIC_SENTRY_ENVIRONMENT || 'production',
              enableInExpoDevelopment: false,
              tracesSampleRate: 0, // Disable performance monitoring for now
            });

            logger.debug('Sentry initialized (deferred)');
          }
        });
      } catch (error) {
        logger.error('Critical initialization failed:', error);
        // Show app anyway, don't leave user stuck on splash
        setAppIsReady(true);
      }
    }

    initializeCriticalServices();

    // Notification listener - lightweight, set up immediately
    notificationResponseListener.current = Notifications.addNotificationResponseReceivedListener(
      response => {
        const data = response.notification.request.content.data;

        if (navigationRef.current && data) {
          switch (data.type) {
            case 'weekly_offer':
              navigationRef.current.navigate('Menu', { showOffers: true });
              break;
            case 'event_reminder':
              navigationRef.current.navigate('Events');
              break;
            default:
              navigationRef.current.navigate('Home');
              break;
          }
        }
      }
    );

    return () => {
      if (notificationResponseListener.current) {
        notificationResponseListener.current.remove();
      }
      notificationService.cleanup();
    };
  }, [initialize]); // Only initialize as dependency (user comes from return value)

  // Hide splash screen when layout is ready
  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      try {
        await SplashScreen.hideAsync();
        logger.debug('Splash screen hidden');
      } catch (error) {
        logger.warn('SplashScreen.hideAsync failed:', error);
      }
    }
  }, [appIsReady]);

  // Keep splash visible until ready
  if (!appIsReady) {
    return null;
  }

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <ToastProvider>
        <ErrorBoundary>
          <AppNavigator navigationRef={navigationRef} />
          <StatusBar style="auto" />
        </ErrorBoundary>
      </ToastProvider>
    </View>
  );
}

// Don't wrap with Sentry.wrap() - Sentry inits deferred now
export default App;
