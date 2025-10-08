/**
 * Feature Flags Configuration
 *
 * Centralized feature flag definitions for the app. Flags can be controlled via:
 * 1. PostHog remote flags (production)
 * 2. Local overrides (development/testing)
 * 3. Environment variables (CI/CD)
 *
 * Usage:
 * ```typescript
 * import { useFeatureFlag } from '../hooks/useFeatureFlag';
 *
 * function MyComponent() {
 *   const showLoyalty = useFeatureFlag('loyalty_system_enabled');
 *
 *   if (showLoyalty) {
 *     return <LoyaltyUI />;
 *   }
 *   return null;
 * }
 * ```
 */

/**
 * Available feature flags in the app
 */
export enum FeatureFlag {
  // v2 Features (Currently Disabled)
  LOYALTY_SYSTEM_ENABLED = 'loyalty_system_enabled',
  QR_SCANNER_ENABLED = 'qr_scanner_enabled',
  GOOGLE_MAPS_ENABLED = 'google_maps_enabled',
  FULL_I18N_ENABLED = 'full_i18n_enabled',

  // AI/Chat Features
  RAG_ENABLED = 'rag_enabled',
  CHAT_STREAMING_ENABLED = 'chat_streaming_enabled',
  CHAT_CONTEXT_CACHING = 'chat_context_caching',

  // Experimental Features
  OFFLINE_MODE = 'offline_mode',
  DARK_MODE = 'dark_mode',
  ANALYTICS_ENABLED = 'analytics_enabled',

  // Performance Features
  IMAGE_CACHING = 'image_caching',
  LAZY_LOADING = 'lazy_loading',

  // Beta Features
  BETA_FEATURES = 'beta_features',
}

/**
 * Default values for feature flags (used as fallback)
 *
 * These are used when:
 * - PostHog is not available
 * - Network is offline
 * - Flag is not configured in PostHog
 */
export const DEFAULT_FEATURE_FLAGS: Record<FeatureFlag, boolean> = {
  // v2 Features - Default OFF (deferred to v2)
  [FeatureFlag.LOYALTY_SYSTEM_ENABLED]: false,
  [FeatureFlag.QR_SCANNER_ENABLED]: false,
  [FeatureFlag.GOOGLE_MAPS_ENABLED]: false,
  [FeatureFlag.FULL_I18N_ENABLED]: false,

  // AI Features - Default OFF (experimental)
  [FeatureFlag.RAG_ENABLED]: false,
  [FeatureFlag.CHAT_STREAMING_ENABLED]: false,
  [FeatureFlag.CHAT_CONTEXT_CACHING]: false,

  // Experimental - Default OFF
  [FeatureFlag.OFFLINE_MODE]: false,
  [FeatureFlag.DARK_MODE]: false,
  [FeatureFlag.ANALYTICS_ENABLED]: true, // Analytics ON by default

  // Performance - Default ON (stable)
  [FeatureFlag.IMAGE_CACHING]: true,
  [FeatureFlag.LAZY_LOADING]: true,

  // Beta - Default OFF
  [FeatureFlag.BETA_FEATURES]: false,
};

/**
 * Local overrides for development/testing
 *
 * Set to `null` to use PostHog/default values
 * Set to `true/false` to force a specific value
 *
 * Example:
 * ```typescript
 * LOCAL_FEATURE_FLAG_OVERRIDES[FeatureFlag.RAG_ENABLED] = true; // Force RAG on
 * ```
 */
export const LOCAL_FEATURE_FLAG_OVERRIDES: Partial<Record<FeatureFlag, boolean | null>> = {
  // Example: Force loyalty system on for development
  // [FeatureFlag.LOYALTY_SYSTEM_ENABLED]: true,

  // Example: Force RAG on for testing
  // [FeatureFlag.RAG_ENABLED]: true,

  // By default, all overrides are null (use PostHog/defaults)
};

/**
 * Feature flag metadata for documentation
 */
export const FEATURE_FLAG_METADATA: Record<FeatureFlag, {
  name: string;
  description: string;
  version: string;
  status: 'stable' | 'beta' | 'experimental' | 'deprecated';
  dependencies?: FeatureFlag[];
}> = {
  [FeatureFlag.LOYALTY_SYSTEM_ENABLED]: {
    name: 'Loyalty System',
    description: 'QR code scanning and points redemption system',
    version: 'v2.0',
    status: 'experimental',
    dependencies: [FeatureFlag.QR_SCANNER_ENABLED],
  },
  [FeatureFlag.QR_SCANNER_ENABLED]: {
    name: 'QR Scanner',
    description: 'QR code scanning functionality',
    version: 'v2.0',
    status: 'experimental',
  },
  [FeatureFlag.GOOGLE_MAPS_ENABLED]: {
    name: 'Google Maps Integration',
    description: 'Interactive maps for restaurant and event locations',
    version: 'v2.0',
    status: 'experimental',
  },
  [FeatureFlag.FULL_I18N_ENABLED]: {
    name: 'Full Internationalization',
    description: 'Complete German/English translations for all screens',
    version: 'v2.0',
    status: 'experimental',
  },
  [FeatureFlag.RAG_ENABLED]: {
    name: 'RAG (Retrieval Augmented Generation)',
    description: 'Vector-based context retrieval for AI chat',
    version: 'v2.0',
    status: 'experimental',
  },
  [FeatureFlag.CHAT_STREAMING_ENABLED]: {
    name: 'Chat Streaming',
    description: 'Real-time streaming responses in chat',
    version: 'v2.0',
    status: 'beta',
  },
  [FeatureFlag.CHAT_CONTEXT_CACHING]: {
    name: 'Chat Context Caching',
    description: 'Cache chat context to reduce API calls',
    version: 'v2.0',
    status: 'beta',
  },
  [FeatureFlag.OFFLINE_MODE]: {
    name: 'Offline Mode',
    description: 'Enhanced offline functionality with data persistence',
    version: 'v2.0',
    status: 'experimental',
  },
  [FeatureFlag.DARK_MODE]: {
    name: 'Dark Mode',
    description: 'Dark color scheme for the app',
    version: 'v2.0',
    status: 'experimental',
  },
  [FeatureFlag.ANALYTICS_ENABLED]: {
    name: 'Analytics',
    description: 'PostHog analytics and event tracking',
    version: 'v1.0',
    status: 'stable',
  },
  [FeatureFlag.IMAGE_CACHING]: {
    name: 'Image Caching',
    description: 'Cache images for faster loading',
    version: 'v2.0',
    status: 'stable',
  },
  [FeatureFlag.LAZY_LOADING]: {
    name: 'Lazy Loading',
    description: 'Load content on demand to improve performance',
    version: 'v2.0',
    status: 'stable',
  },
  [FeatureFlag.BETA_FEATURES]: {
    name: 'Beta Features',
    description: 'Enable all beta features for testing',
    version: 'v2.0',
    status: 'beta',
  },
};

/**
 * Check if a feature flag has dependencies that must be enabled
 */
export function checkFeatureDependencies(flag: FeatureFlag, flags: Record<string, boolean>): boolean {
  const metadata = FEATURE_FLAG_METADATA[flag];

  if (!metadata.dependencies || metadata.dependencies.length === 0) {
    return true; // No dependencies
  }

  // Check if all dependencies are enabled
  return metadata.dependencies.every(dep => flags[dep] === true);
}

/**
 * Get all feature flags with their current values
 * Useful for debugging/admin panels
 */
export function getAllFeatureFlags(): typeof FEATURE_FLAG_METADATA {
  return FEATURE_FLAG_METADATA;
}

/**
 * Environment-based configuration
 */
export const FEATURE_FLAG_CONFIG = {
  // Enable PostHog in production only
  USE_POSTHOG: process.env.NODE_ENV === 'production',

  // Enable local overrides in development
  ALLOW_LOCAL_OVERRIDES: __DEV__,

  // Log flag changes in development
  DEBUG_FLAGS: __DEV__,
};
