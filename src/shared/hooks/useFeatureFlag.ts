/**
 * Feature Flag React Hooks
 *
 * Easy-to-use React hooks for feature flags in components.
 *
 * @example
 * ```typescript
 * import { useFeatureFlag } from '../hooks/useFeatureFlag';
 * import { FeatureFlag } from '../config/featureFlags';
 *
 * function MyComponent() {
 *   const showLoyalty = useFeatureFlag(FeatureFlag.LOYALTY_SYSTEM_ENABLED);
 *
 *   if (showLoyalty) {
 *     return <LoyaltyScreen />;
 *   }
 *   return <PlaceholderScreen />;
 * }
 * ```
 */

import { useState, useEffect } from 'react';
import { FeatureFlag } from '../../config/featureFlags';
import FeatureFlagService from '../../services/featureFlagService';
import { logger } from '../../utils/logger';

/**
 * Hook to check if a feature flag is enabled
 *
 * This hook will automatically update when feature flags are reloaded.
 *
 * @param flag - The feature flag to check
 * @param defaultValue - Optional default value if flag is not set
 * @returns Whether the feature is enabled
 *
 * @example
 * ```typescript
 * function RagChatFeature() {
 *   const isRagEnabled = useFeatureFlag(FeatureFlag.RAG_ENABLED);
 *
 *   return (
 *     <View>
 *       <Text>RAG Status: {isRagEnabled ? 'Enabled' : 'Disabled'}</Text>
 *     </View>
 *   );
 * }
 * ```
 */
export function useFeatureFlag(
  flag: FeatureFlag,
  defaultValue?: boolean
): boolean {
  const [isEnabled, setIsEnabled] = useState(() =>
    FeatureFlagService.isEnabled(flag, defaultValue)
  );

  useEffect(() => {
    // Initial check
    const enabled = FeatureFlagService.isEnabled(flag, defaultValue);
    setIsEnabled(enabled);

    // Optional: Set up interval to check for flag changes
    // This is useful if flags are updated remotely
    const interval = setInterval(() => {
      const currentValue = FeatureFlagService.isEnabled(flag, defaultValue);
      if (currentValue !== isEnabled) {
        setIsEnabled(currentValue);
        logger.debug(`Feature flag "${flag}" changed to: ${currentValue}`);
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [flag, defaultValue, isEnabled]);

  return isEnabled;
}

/**
 * Hook to get multiple feature flags at once
 *
 * @param flags - Array of feature flags to check
 * @returns Object with flag values
 *
 * @example
 * ```typescript
 * function FeatureGate() {
 *   const flags = useFeatureFlags([
 *     FeatureFlag.RAG_ENABLED,
 *     FeatureFlag.CHAT_STREAMING_ENABLED,
 *     FeatureFlag.DARK_MODE
 *   ]);
 *
 *   return (
 *     <View>
 *       <Text>RAG: {flags.rag_enabled ? 'ON' : 'OFF'}</Text>
 *       <Text>Streaming: {flags.chat_streaming_enabled ? 'ON' : 'OFF'}</Text>
 *       <Text>Dark Mode: {flags.dark_mode ? 'ON' : 'OFF'}</Text>
 *     </View>
 *   );
 * }
 * ```
 */
export function useFeatureFlags(
  flags: FeatureFlag[]
): Record<string, boolean> {
  const [flagValues, setFlagValues] = useState<Record<string, boolean>>(() => {
    const values: Record<string, boolean> = {};
    flags.forEach((flag) => {
      values[flag] = FeatureFlagService.isEnabled(flag);
    });
    return values;
  });

  useEffect(() => {
    // Update all flag values
    const updateFlags = () => {
      const values: Record<string, boolean> = {};
      flags.forEach((flag) => {
        values[flag] = FeatureFlagService.isEnabled(flag);
      });
      setFlagValues(values);
    };

    updateFlags();

    // Check for updates periodically
    const interval = setInterval(updateFlags, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [flags]);

  return flagValues;
}

/**
 * Hook to get all feature flags
 *
 * Useful for admin panels or debugging screens
 *
 * @returns Object with all flag values
 *
 * @example
 * ```typescript
 * function DebugScreen() {
 *   const allFlags = useAllFeatureFlags();
 *
 *   return (
 *     <ScrollView>
 *       {Object.entries(allFlags).map(([flag, enabled]) => (
 *         <Text key={flag}>{flag}: {enabled ? 'ON' : 'OFF'}</Text>
 *       ))}
 *     </ScrollView>
 *   );
 * }
 * ```
 */
export function useAllFeatureFlags(): Record<string, boolean> {
  const [allFlags, setAllFlags] = useState(() =>
    FeatureFlagService.getAllFlags()
  );

  useEffect(() => {
    const updateAllFlags = () => {
      setAllFlags(FeatureFlagService.getAllFlags());
    };

    updateAllFlags();

    // Check for updates periodically
    const interval = setInterval(updateAllFlags, 30000);

    return () => clearInterval(interval);
  }, []);

  return allFlags;
}

/**
 * Hook to get feature flag with payload data
 *
 * PostHog allows flags to have associated JSON data
 *
 * @param flag - Feature flag to check
 * @returns Tuple of [isEnabled, payload]
 *
 * @example
 * ```typescript
 * function ConfigurableFeature() {
 *   const [isEnabled, config] = useFeatureFlagWithPayload(
 *     FeatureFlag.BETA_FEATURES
 *   );
 *
 *   if (!isEnabled) return null;
 *
 *   return (
 *     <View>
 *       <Text>Beta Mode Active</Text>
 *       <Text>Config: {JSON.stringify(config)}</Text>
 *     </View>
 *   );
 * }
 * ```
 */
export function useFeatureFlagWithPayload(
  flag: FeatureFlag
): [boolean, any] {
  const isEnabled = useFeatureFlag(flag);
  const [payload, setPayload] = useState<any>(null);

  useEffect(() => {
    if (isEnabled) {
      const data = FeatureFlagService.getPayload(flag);
      setPayload(data);
    } else {
      setPayload(null);
    }
  }, [flag, isEnabled]);

  return [isEnabled, payload];
}

/**
 * Conditional rendering component based on feature flag
 *
 * @example
 * ```typescript
 * <FeatureGate flag={FeatureFlag.LOYALTY_SYSTEM_ENABLED}>
 *   <LoyaltyScreen />
 * </FeatureGate>
 * ```
 */
export function FeatureGate({
  flag,
  children,
  fallback = null,
}: {
  flag: FeatureFlag;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const isEnabled = useFeatureFlag(flag);

  if (isEnabled) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}

export default useFeatureFlag;
