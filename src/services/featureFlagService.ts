/**
 * Feature Flag Service
 *
 * Integrates PostHog feature flags with local fallbacks.
 * Provides a unified interface for checking feature flags across the app.
 *
 * Architecture:
 * 1. PostHog (production) - Remote flags configured in PostHog dashboard
 * 2. Local overrides (development) - Force-enable flags for testing
 * 3. Default values - Fallback when PostHog is unavailable
 */

import posthog from 'posthog-js';
import {
  FeatureFlag,
  DEFAULT_FEATURE_FLAGS,
  LOCAL_FEATURE_FLAG_OVERRIDES,
  FEATURE_FLAG_CONFIG,
  checkFeatureDependencies,
} from '../config/featureFlags';
import { logger } from '../utils/logger';

/**
 * PostHog client instance
 */
let posthogClient: typeof posthog | null = null;
let isPostHogInitialized = false;

/**
 * Initialize PostHog client
 *
 * Call this once at app startup (App.tsx)
 */
export function initializePostHog() {
  if (isPostHogInitialized) {
    logger.warn('PostHog already initialized');
    return;
  }

  const apiKey = process.env.EXPO_PUBLIC_POSTHOG_API_KEY;
  const host = process.env.EXPO_PUBLIC_POSTHOG_HOST;

  if (!apiKey || !host) {
    logger.warn('PostHog credentials not configured. Feature flags will use defaults.');
    return;
  }

  try {
    posthog.init(apiKey, {
      api_host: host,
      autocapture: false, // Disable automatic event capture
      capture_pageview: false, // Disable automatic pageview tracking
      loaded: (ph) => {
        posthogClient = ph;
        isPostHogInitialized = true;
        logger.info('PostHog initialized successfully');

        if (FEATURE_FLAG_CONFIG.DEBUG_FLAGS) {
          logger.debug('PostHog feature flags loaded');
        }
      },
    });
  } catch (error) {
    logger.error('Failed to initialize PostHog:', error);
  }
}

/**
 * Identify user for feature flag targeting
 *
 * Call this after user logs in
 */
export function identifyUser(userId: string, properties?: Record<string, any>) {
  if (!posthogClient || !isPostHogInitialized) {
    logger.warn('PostHog not initialized. Cannot identify user.');
    return;
  }

  try {
    posthogClient.identify(userId, properties);
    logger.debug(`User identified: ${userId}`);
  } catch (error) {
    logger.error('Failed to identify user in PostHog:', error);
  }
}

/**
 * Reset user session (call on logout)
 */
export function resetUser() {
  if (!posthogClient || !isPostHogInitialized) {
    return;
  }

  try {
    posthogClient.reset();
    logger.debug('PostHog user session reset');
  } catch (error) {
    logger.error('Failed to reset PostHog session:', error);
  }
}

/**
 * Check if a feature flag is enabled
 *
 * Priority:
 * 1. Local override (if in development mode)
 * 2. PostHog remote flag
 * 3. Default value
 *
 * @param flag - Feature flag to check
 * @param defaultValue - Optional override for default value
 * @returns Whether the flag is enabled
 */
export function isFeatureEnabled(
  flag: FeatureFlag,
  defaultValue?: boolean
): boolean {
  // 1. Check local overrides (development only)
  if (FEATURE_FLAG_CONFIG.ALLOW_LOCAL_OVERRIDES) {
    const override = LOCAL_FEATURE_FLAG_OVERRIDES[flag];
    if (override !== undefined && override !== null) {
      if (FEATURE_FLAG_CONFIG.DEBUG_FLAGS) {
        logger.debug(`Feature flag "${flag}" using local override: ${override}`);
      }
      return override;
    }
  }

  // 2. Check PostHog remote flags
  if (posthogClient && isPostHogInitialized && FEATURE_FLAG_CONFIG.USE_POSTHOG) {
    try {
      const isEnabled = posthogClient.isFeatureEnabled(flag);

      if (isEnabled !== undefined) {
        if (FEATURE_FLAG_CONFIG.DEBUG_FLAGS) {
          logger.debug(`Feature flag "${flag}" from PostHog: ${isEnabled}`);
        }

        // Check dependencies
        if (isEnabled) {
          const allFlags = getAllFlags();
          if (!checkFeatureDependencies(flag, allFlags)) {
            logger.warn(
              `Feature flag "${flag}" dependencies not met. Returning false.`
            );
            return false;
          }
        }

        return isEnabled;
      }
    } catch (error) {
      logger.error(`Error checking PostHog feature flag "${flag}":`, error);
    }
  }

  // 3. Use default value
  const fallback = defaultValue !== undefined ? defaultValue : DEFAULT_FEATURE_FLAGS[flag];

  if (FEATURE_FLAG_CONFIG.DEBUG_FLAGS) {
    logger.debug(`Feature flag "${flag}" using default: ${fallback}`);
  }

  return fallback;
}

/**
 * Get all feature flag values
 *
 * Useful for debugging or admin panels
 */
export function getAllFlags(): Record<string, boolean> {
  const flags: Record<string, boolean> = {};

  Object.values(FeatureFlag).forEach((flag) => {
    flags[flag] = isFeatureEnabled(flag);
  });

  return flags;
}

/**
 * Get feature flag value with payload
 *
 * PostHog allows flags to have associated data (JSON payloads)
 */
export function getFeatureFlagPayload(flag: FeatureFlag): any {
  if (!posthogClient || !isPostHogInitialized) {
    return null;
  }

  try {
    return posthogClient.getFeatureFlagPayload(flag);
  } catch (error) {
    logger.error(`Error getting feature flag payload for "${flag}":`, error);
    return null;
  }
}

/**
 * Track an event in PostHog (analytics)
 *
 * @param eventName - Name of the event
 * @param properties - Event properties
 */
export function trackEvent(eventName: string, properties?: Record<string, any>) {
  if (!isFeatureEnabled(FeatureFlag.ANALYTICS_ENABLED)) {
    return; // Analytics disabled
  }

  if (!posthogClient || !isPostHogInitialized) {
    logger.warn('PostHog not initialized. Cannot track event.');
    return;
  }

  try {
    posthogClient.capture(eventName, properties);

    if (FEATURE_FLAG_CONFIG.DEBUG_FLAGS) {
      logger.debug(`Event tracked: ${eventName}`, properties);
    }
  } catch (error) {
    logger.error(`Failed to track event "${eventName}":`, error);
  }
}

/**
 * Reload feature flags from PostHog
 *
 * Useful after changing flags in PostHog dashboard
 */
export async function reloadFeatureFlags(): Promise<void> {
  if (!posthogClient || !isPostHogInitialized) {
    logger.warn('PostHog not initialized. Cannot reload flags.');
    return;
  }

  try {
    await posthogClient.reloadFeatureFlags();
    logger.info('Feature flags reloaded from PostHog');
  } catch (error) {
    logger.error('Failed to reload feature flags:', error);
  }
}

/**
 * Check PostHog initialization status
 */
export function isPostHogReady(): boolean {
  return isPostHogInitialized && posthogClient !== null;
}

/**
 * Get PostHog client instance (for advanced usage)
 *
 * @returns PostHog client or null if not initialized
 */
export function getPostHogClient(): typeof posthog | null {
  return posthogClient;
}

// Export singleton service
export const FeatureFlagService = {
  initialize: initializePostHog,
  identifyUser,
  resetUser,
  isEnabled: isFeatureEnabled,
  getAllFlags,
  getPayload: getFeatureFlagPayload,
  trackEvent,
  reload: reloadFeatureFlags,
  isReady: isPostHogReady,
  getClient: getPostHogClient,
};

export default FeatureFlagService;
