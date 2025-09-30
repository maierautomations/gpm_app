/**
 * Network Status Detection
 *
 * Provides utilities to detect and monitor network connectivity.
 *
 * NOTE: This requires @react-native-community/netinfo to be installed.
 * To install: npm install @react-native-community/netinfo
 *
 * For now, this module provides stub implementations that assume online status.
 * Install the package when you need accurate network detection.
 */

// TODO: Uncomment when @react-native-community/netinfo is installed
// import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { logger } from './logger';

/**
 * Network status type
 */
export type NetworkStatus = {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string | null;
};

/**
 * Check if device is currently online
 * TODO: Implement with NetInfo when package is installed
 */
export async function isOnline(): Promise<boolean> {
  try {
    // Stub implementation - assumes online
    // TODO: Uncomment when NetInfo is installed
    // const state = await NetInfo.fetch();
    // return state.isConnected === true && state.isInternetReachable !== false;

    logger.log('NetworkStatus: Using stub implementation (assumes online)');
    return true;
  } catch (error) {
    logger.error('Error checking network status:', error);
    return true;
  }
}

/**
 * Get current network status
 * TODO: Implement with NetInfo when package is installed
 */
export async function getNetworkStatus(): Promise<NetworkStatus> {
  try {
    // Stub implementation
    // TODO: Uncomment when NetInfo is installed
    // const state = await NetInfo.fetch();
    // return {
    //   isConnected: state.isConnected || false,
    //   isInternetReachable: state.isInternetReachable,
    //   type: state.type,
    // };

    return {
      isConnected: true, // Stub: assume connected
      isInternetReachable: true,
      type: 'unknown',
    };
  } catch (error) {
    logger.error('Error fetching network status:', error);
    return {
      isConnected: true,
      isInternetReachable: null,
      type: null,
    };
  }
}

/**
 * Subscribe to network status changes
 * Returns unsubscribe function
 * TODO: Implement with NetInfo when package is installed
 */
export function subscribeToNetworkStatus(
  callback: (status: NetworkStatus) => void
): () => void {
  // Stub implementation - no-op unsubscribe
  // TODO: Uncomment when NetInfo is installed
  // const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
  //   callback({
  //     isConnected: state.isConnected || false,
  //     isInternetReachable: state.isInternetReachable,
  //     type: state.type,
  //   });
  // });
  // return unsubscribe;

  logger.log('NetworkStatus: subscribeToNetworkStatus stub (no-op)');
  return () => {}; // No-op unsubscribe
}

/**
 * Wait for network connection (with timeout)
 * TODO: Implement with NetInfo when package is installed
 */
export async function waitForConnection(timeoutMs: number = 5000): Promise<boolean> {
  // Stub implementation - immediately resolves as connected
  // TODO: Implement real waiting logic when NetInfo is installed
  logger.log('NetworkStatus: waitForConnection stub (assumes connected)');
  return Promise.resolve(true);
}