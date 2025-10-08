import { useEffect, useRef } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { logger } from '../../utils/logger';

/**
 * Custom hook for managing Supabase real-time subscriptions with automatic cleanup
 *
 * This hook ensures that all subscriptions are properly unsubscribed when the component unmounts,
 * preventing memory leaks. It also handles subscription errors and provides lifecycle logging.
 *
 * @example
 * ```typescript
 * // In a component:
 * useSupabaseSubscription(() => {
 *   return MenuService.subscribeToMenuUpdates(() => {
 *     loadMenuItems();
 *   });
 * }, [loadMenuItems]);
 * ```
 *
 * @param subscriptionFactory - Function that returns a Supabase subscription
 * @param dependencies - Dependencies array (like useEffect)
 * @param options - Optional configuration
 */
export function useSupabaseSubscription(
  subscriptionFactory: () => RealtimeChannel,
  dependencies: React.DependencyList = [],
  options?: {
    /** Custom name for debugging logs */
    name?: string;
    /** Callback when subscription is established */
    onSubscribed?: () => void;
    /** Callback when subscription encounters an error */
    onError?: (error: Error) => void;
  }
) {
  const subscriptionRef = useRef<RealtimeChannel | null>(null);
  const isCleaningUpRef = useRef(false);

  useEffect(() => {
    // Reset cleanup flag
    isCleaningUpRef.current = false;

    try {
      // Create subscription
      const subscription = subscriptionFactory();
      subscriptionRef.current = subscription;

      logger.debug(
        `Supabase subscription established${options?.name ? `: ${options.name}` : ''}`
      );

      // Call onSubscribed callback if provided
      if (options?.onSubscribed) {
        options.onSubscribed();
      }
    } catch (error) {
      logger.error(
        `Error establishing Supabase subscription${options?.name ? ` (${options.name})` : ''}:`,
        error
      );

      // Call onError callback if provided
      if (options?.onError && error instanceof Error) {
        options.onError(error);
      }
    }

    // Cleanup function
    return () => {
      if (isCleaningUpRef.current) {
        return; // Prevent double cleanup
      }

      isCleaningUpRef.current = true;

      if (subscriptionRef.current) {
        try {
          subscriptionRef.current.unsubscribe();
          logger.debug(
            `Supabase subscription cleaned up${options?.name ? `: ${options.name}` : ''}`
          );
        } catch (error) {
          logger.error(
            `Error cleaning up Supabase subscription${options?.name ? ` (${options.name})` : ''}:`,
            error
          );
        } finally {
          subscriptionRef.current = null;
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);
}

/**
 * Alternative hook that returns subscription status and manual controls
 *
 * Use this when you need more control over the subscription lifecycle.
 *
 * @example
 * ```typescript
 * const { isSubscribed, resubscribe, unsubscribe } = useSupabaseSubscriptionWithControls(
 *   () => MenuService.subscribeToMenuUpdates(handleUpdate),
 *   [handleUpdate]
 * );
 *
 * // Manually resubscribe if needed
 * const handleRefresh = () => {
 *   unsubscribe();
 *   resubscribe();
 * };
 * ```
 */
export function useSupabaseSubscriptionWithControls(
  subscriptionFactory: () => RealtimeChannel,
  dependencies: React.DependencyList = [],
  options?: {
    name?: string;
    onSubscribed?: () => void;
    onError?: (error: Error) => void;
  }
) {
  const subscriptionRef = useRef<RealtimeChannel | null>(null);
  const isSubscribedRef = useRef(false);

  const unsubscribe = () => {
    if (subscriptionRef.current) {
      try {
        subscriptionRef.current.unsubscribe();
        isSubscribedRef.current = false;
        logger.debug(
          `Manually unsubscribed${options?.name ? `: ${options.name}` : ''}`
        );
      } catch (error) {
        logger.error(
          `Error during manual unsubscribe${options?.name ? ` (${options.name})` : ''}:`,
          error
        );
      } finally {
        subscriptionRef.current = null;
      }
    }
  };

  const resubscribe = () => {
    unsubscribe();

    try {
      const subscription = subscriptionFactory();
      subscriptionRef.current = subscription;
      isSubscribedRef.current = true;

      logger.debug(
        `Manually resubscribed${options?.name ? `: ${options.name}` : ''}`
      );

      if (options?.onSubscribed) {
        options.onSubscribed();
      }
    } catch (error) {
      logger.error(
        `Error during manual resubscribe${options?.name ? ` (${options.name})` : ''}:`,
        error
      );

      if (options?.onError && error instanceof Error) {
        options.onError(error);
      }
    }
  };

  useEffect(() => {
    resubscribe();

    // Cleanup on unmount
    return () => {
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  return {
    isSubscribed: isSubscribedRef.current,
    resubscribe,
    unsubscribe,
  };
}

export default useSupabaseSubscription;
