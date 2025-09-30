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

// Check if running in development mode
const __DEV__ = process.env.NODE_ENV === 'development' || __DEV__;

interface LoggerInterface {
  log: (message: string, ...args: any[]) => void;
  error: (message: string, error?: any) => void;
  warn: (message: string, ...args: any[]) => void;
  info: (message: string, ...args: any[]) => void;
  debug: (message: string, ...args: any[]) => void;
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
   * Log informational messages (development only)
   */
  info(message: string, ...args: any[]): void {
    if (__DEV__) {
      console.info(`[INFO] ${message}`, ...args);
    }
  }

  /**
   * Log errors (always logged, can be sent to tracking service)
   */
  error(message: string, error?: any): void {
    if (__DEV__) {
      console.error(`[ERROR] ${message}`, error);
    } else {
      // In production, send to error tracking service
      // Example: Sentry.captureException(error, { extra: { message } });
      console.error(`[ERROR] ${message}`, error);
    }
  }

  /**
   * Log warnings (development only)
   */
  warn(message: string, ...args: any[]): void {
    if (__DEV__) {
      console.warn(`[WARN] ${message}`, ...args);
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
}

// Export singleton instance
export const logger = new Logger();

// Export type for testing/mocking
export type { LoggerInterface };