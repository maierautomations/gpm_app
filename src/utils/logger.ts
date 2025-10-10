/**
 * Logger utility for the application
 *
 * Provides environment-aware logging that only outputs in development mode.
 * In production, errors can be sent to error tracking services (e.g., Sentry).
 *
 * Usage:
 * ```typescript
 * import { logger } from '../utils/logger';
 *
 * logger.log('Info message', { data: 'value' });
 * logger.error('Error occurred', error);
 * logger.warn('Warning message');
 * ```
 */

import * as Sentry from '@sentry/react-native';

// __DEV__ is globally available in React Native, but we add a fallback for type safety
declare const __DEV__: boolean;

interface LoggerInterface {
  log: (message: string, ...args: any[]) => void;
  error: (message: string, error?: any) => void;
  warn: (message: string, ...args: any[]) => void;
  info: (message: string, ...args: any[]) => void;
  debug: (message: string, ...args: any[]) => void;
  setUser: (userId: string | null, email?: string, username?: string) => void;
  setContext: (key: string, context: Record<string, any>) => void;
}

class Logger implements LoggerInterface {
  /**
   * Log general information (development only)
   */
  log(message: string, ...args: any[]): void {
    if (__DEV__) {
      console.log(`[LOG] ${message}`, ...args);
    }
  }

  /**
   * Log informational messages (development only, breadcrumbs in production)
   */
  info(message: string, ...args: any[]): void {
    if (__DEV__) {
      console.info(`[INFO] ${message}`, ...args);
    } else {
      // In production: Add breadcrumb for context
      Sentry.addBreadcrumb({
        category: 'info',
        message,
        level: 'info',
        data: args.length > 0 ? { args } : undefined,
      });
    }
  }

  /**
   * Log errors (always logged, sent to Sentry in production)
   */
  error(message: string, error?: any): void {
    if (__DEV__) {
      console.error(`[ERROR] ${message}`, error);
    } else {
      // In production: Send error to Sentry
      if (error instanceof Error) {
        Sentry.captureException(error, {
          extra: { message },
        });
      } else {
        Sentry.captureMessage(message, {
          level: 'error',
          extra: { error },
        });
      }
    }
  }

  /**
   * Log warnings (development only, sent to Sentry in production)
   */
  warn(message: string, ...args: any[]): void {
    if (__DEV__) {
      console.warn(`[WARN] ${message}`, ...args);
    } else {
      // In production: Send warning to Sentry
      Sentry.captureMessage(message, {
        level: 'warning',
        extra: args.length > 0 ? { args } : undefined,
      });
    }
  }

  /**
   * Log debug information (development only)
   */
  debug(message: string, ...args: any[]): void {
    if (__DEV__) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }

  /**
   * Clear all console logs (useful for testing)
   */
  clear(): void {
    if (__DEV__) {
      console.clear();
    }
  }

  /**
   * Set user context for error tracking (helps identify which user had issues)
   */
  setUser(userId: string | null, email?: string, username?: string): void {
    if (!__DEV__) {
      Sentry.setUser(
        userId
          ? {
              id: userId,
              email,
              username,
            }
          : null
      );
    }
  }

  /**
   * Set custom context for error tracking (e.g., screen name, feature flags)
   */
  setContext(key: string, context: Record<string, any>): void {
    if (!__DEV__) {
      Sentry.setContext(key, context);
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Export type for testing/mocking
export type { LoggerInterface };