/**
 * Test Component for Supabase Subscription Cleanup
 *
 * This component is used to manually test that subscriptions are properly
 * cleaned up when components unmount. It should NOT be included in production builds.
 *
 * Usage:
 * 1. Import this component into any screen temporarily
 * 2. Navigate to the screen and watch the console logs
 * 3. Navigate away from the screen
 * 4. Verify you see "Subscription cleaned up" in logs
 * 5. Remove the component after testing
 *
 * @example
 * // In MenuScreen.tsx (temporarily for testing):
 * import SubscriptionCleanupTest from '../../../shared/hooks/__tests__/SubscriptionCleanupTest';
 *
 * function MenuScreen() {
 *   return (
 *     <>
 *       <SubscriptionCleanupTest />
 *       {// ... rest of screen}
 *     </>
 *   );
 * }
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSupabaseSubscription } from '../useSupabaseSubscription';
import MenuService from '../../../features/menu/services/menuService';
import EventsService from '../../../features/events/services/eventsService';
import { logger } from '../../../utils/logger';

export default function SubscriptionCleanupTest() {
  const [testMode, setTestMode] = useState<'manual' | 'hook' | 'none'>('none');
  const [updateCount, setUpdateCount] = useState(0);

  // Test 1: Manual cleanup pattern
  useEffect(() => {
    if (testMode !== 'manual') return;

    logger.log('🧪 TEST: Setting up manual subscription...');

    const subscription = MenuService.subscribeToMenuUpdates(() => {
      logger.log('🧪 TEST: Manual subscription received update');
      setUpdateCount((prev) => prev + 1);
    });

    return () => {
      logger.log('🧪 TEST: ✅ Manual subscription cleaned up!');
      subscription.unsubscribe();
    };
  }, [testMode]);

  // Test 2: Custom hook pattern
  useSupabaseSubscription(
    () => {
      if (testMode !== 'hook') {
        // Return a dummy subscription that won't actually connect
        return {
          unsubscribe: () => {},
        } as any;
      }

      logger.log('🧪 TEST: Setting up hook subscription...');

      return EventsService.subscribeToEventUpdates(() => {
        logger.log('🧪 TEST: Hook subscription received update');
        setUpdateCount((prev) => prev + 1);
      });
    },
    [testMode],
    {
      name: 'TestHookSubscription',
      onSubscribed: () => {
        logger.log('🧪 TEST: Hook subscription established');
      },
      onError: (error) => {
        logger.error('🧪 TEST: Hook subscription error:', error);
      },
    }
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🧪 Subscription Cleanup Test</Text>
        <Text style={styles.subtitle}>Check console for logs</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, testMode === 'manual' && styles.activeButton]}
          onPress={() => {
            setTestMode('manual');
            setUpdateCount(0);
          }}
        >
          <Text style={[styles.buttonText, testMode === 'manual' && styles.activeButtonText]}>
            Test Manual Cleanup
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, testMode === 'hook' && styles.activeButton]}
          onPress={() => {
            setTestMode('hook');
            setUpdateCount(0);
          }}
        >
          <Text style={[styles.buttonText, testMode === 'hook' && styles.activeButtonText]}>
            Test Hook Cleanup
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.stopButton]}
          onPress={() => {
            setTestMode('none');
            setUpdateCount(0);
            logger.log('🧪 TEST: Stopped all subscriptions');
          }}
        >
          <Text style={styles.stopButtonText}>Stop Test</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.status}>
        <Text style={styles.statusText}>Status: {testMode === 'none' ? 'Inactive' : 'Active'}</Text>
        <Text style={styles.statusText}>Updates Received: {updateCount}</Text>
        {testMode !== 'none' && (
          <Text style={styles.instruction}>
            Navigate away from this screen to test cleanup
          </Text>
        )}
      </View>

      <View style={styles.instructions}>
        <Text style={styles.instructionTitle}>How to Test:</Text>
        <Text style={styles.instructionStep}>1. Tap "Test Manual Cleanup" or "Test Hook Cleanup"</Text>
        <Text style={styles.instructionStep}>2. Watch console for "Setting up..." log</Text>
        <Text style={styles.instructionStep}>3. Navigate away from this screen</Text>
        <Text style={styles.instructionStep}>4. Check console for "✅ cleaned up!" log</Text>
        <Text style={styles.instructionStep}>5. ✅ Success if cleanup log appears!</Text>
      </View>

      <View style={styles.warning}>
        <Text style={styles.warningText}>⚠️ Remove this component before production build</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff3cd',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ffc107',
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  buttonContainer: {
    gap: 8,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  activeButton: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  activeButtonText: {
    color: 'white',
  },
  stopButton: {
    backgroundColor: '#dc3545',
    borderColor: '#dc3545',
  },
  stopButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
  },
  status: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 6,
    marginBottom: 16,
  },
  statusText: {
    fontSize: 13,
    color: '#495057',
    marginBottom: 4,
  },
  instruction: {
    fontSize: 12,
    color: '#007bff',
    fontWeight: '600',
    marginTop: 8,
    fontStyle: 'italic',
  },
  instructions: {
    backgroundColor: '#e7f3ff',
    padding: 12,
    borderRadius: 6,
    marginBottom: 12,
  },
  instructionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  instructionStep: {
    fontSize: 12,
    color: '#495057',
    marginBottom: 4,
    paddingLeft: 8,
  },
  warning: {
    backgroundColor: '#f8d7da',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#dc3545',
  },
  warningText: {
    fontSize: 11,
    color: '#721c24',
    textAlign: 'center',
    fontWeight: '600',
  },
});
