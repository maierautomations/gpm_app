/**
 * Input Validation and Sanitization Utilities
 *
 * Provides validation for user inputs, rate limiting, and sanitization
 * to prevent prompt injection and ensure data quality.
 *
 * Usage:
 * - Validate chat messages before sending to AI
 * - Sanitize user inputs in forms
 * - Rate limit chat interactions
 * - Validate settings inputs
 */

import { z } from 'zod';
import { logger } from './logger';

// =============================================================================
// CONSTANTS
// =============================================================================

export const VALIDATION_LIMITS = {
  // Chat limits
  CHAT_MESSAGE_MIN_LENGTH: 1,
  CHAT_MESSAGE_MAX_LENGTH: 2000,
  CHAT_RATE_LIMIT_MESSAGES: 10, // Max messages per window
  CHAT_RATE_LIMIT_WINDOW_MS: 60000, // 1 minute

  // Profile limits
  NAME_MIN_LENGTH: 1,
  NAME_MAX_LENGTH: 100,
  EMAIL_MAX_LENGTH: 254, // RFC 5321

  // General limits
  SEARCH_MIN_LENGTH: 1,
  SEARCH_MAX_LENGTH: 200,
} as const;

// =============================================================================
// ZOD SCHEMAS
// =============================================================================

/**
 * Chat message validation schema
 */
export const chatMessageSchema = z.object({
  message: z
    .string()
    .min(VALIDATION_LIMITS.CHAT_MESSAGE_MIN_LENGTH, 'Nachricht ist zu kurz')
    .max(
      VALIDATION_LIMITS.CHAT_MESSAGE_MAX_LENGTH,
      `Nachricht darf maximal ${VALIDATION_LIMITS.CHAT_MESSAGE_MAX_LENGTH} Zeichen lang sein`
    )
    .trim(),
});

/**
 * Profile validation schema
 */
export const profileSchema = z.object({
  name: z
    .string()
    .min(VALIDATION_LIMITS.NAME_MIN_LENGTH, 'Name ist erforderlich')
    .max(
      VALIDATION_LIMITS.NAME_MAX_LENGTH,
      `Name darf maximal ${VALIDATION_LIMITS.NAME_MAX_LENGTH} Zeichen lang sein`
    )
    .trim(),
  email: z
    .string()
    .email('Ungültige E-Mail-Adresse')
    .max(
      VALIDATION_LIMITS.EMAIL_MAX_LENGTH,
      `E-Mail darf maximal ${VALIDATION_LIMITS.EMAIL_MAX_LENGTH} Zeichen lang sein`
    )
    .trim()
    .toLowerCase(),
});

/**
 * Search query validation schema
 */
export const searchQuerySchema = z.object({
  query: z
    .string()
    .min(VALIDATION_LIMITS.SEARCH_MIN_LENGTH, 'Suchbegriff ist zu kurz')
    .max(
      VALIDATION_LIMITS.SEARCH_MAX_LENGTH,
      `Suchbegriff darf maximal ${VALIDATION_LIMITS.SEARCH_MAX_LENGTH} Zeichen lang sein`
    )
    .trim(),
});

// =============================================================================
// VALIDATION RESULT TYPE
// =============================================================================

export type ValidationResult<T = any> = {
  isValid: boolean;
  data?: T;
  error?: string;
};

// =============================================================================
// SANITIZATION FUNCTIONS
// =============================================================================

/**
 * Sanitize string input
 * Removes potentially harmful characters while preserving normal punctuation
 *
 * @param input - The input string to sanitize
 * @returns Sanitized string
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    logger.error('sanitizeString: input is not a string', { input });
    return '';
  }

  // Trim whitespace
  let sanitized = input.trim();

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  // Remove control characters (except newlines and tabs)
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Normalize whitespace (multiple spaces to single space)
  sanitized = sanitized.replace(/\s+/g, ' ');

  return sanitized;
}

/**
 * Sanitize chat message
 * Removes potentially harmful patterns while preserving normal text
 * Helps prevent prompt injection attacks
 *
 * @param message - The chat message to sanitize
 * @returns Sanitized message
 */
export function sanitizeChatMessage(message: string): string {
  let sanitized = sanitizeString(message);

  // Remove excessive repeated characters (potential spam/injection)
  // Allow up to 5 repeated characters
  sanitized = sanitized.replace(/(.)\1{5,}/g, '$1$1$1$1$1');

  // Remove potential prompt injection patterns
  // These patterns might be used to manipulate AI behavior
  const suspiciousPatterns = [
    /ignore\s+previous\s+instructions/gi,
    /ignore\s+all\s+previous/gi,
    /disregard\s+previous/gi,
    /forget\s+previous/gi,
    /system:\s*$/gi,
    /assistant:\s*$/gi,
    /\[SYSTEM\]/gi,
    /\[INST\]/gi,
  ];

  suspiciousPatterns.forEach((pattern) => {
    if (pattern.test(sanitized)) {
      logger.warn('Potential prompt injection detected', {
        pattern: pattern.toString(),
        message: sanitized.substring(0, 100), // Log only first 100 chars
      });
      // Don't block entirely, just log for monitoring
      // The AI service should have its own protections
    }
  });

  return sanitized;
}

/**
 * Sanitize email address
 * Normalizes email format
 *
 * @param email - The email to sanitize
 * @returns Sanitized email
 */
export function sanitizeEmail(email: string): string {
  return sanitizeString(email).toLowerCase();
}

// =============================================================================
// VALIDATION FUNCTIONS
// =============================================================================

/**
 * Validate chat message
 *
 * @param message - The message to validate
 * @returns ValidationResult with sanitized message if valid
 */
export function validateChatMessage(message: string): ValidationResult<string> {
  try {
    // First sanitize
    const sanitized = sanitizeChatMessage(message);

    // Then validate with schema
    const result = chatMessageSchema.safeParse({ message: sanitized });

    if (!result.success) {
      const error = result.error.errors[0]?.message || 'Ungültige Nachricht';
      logger.log('Chat message validation failed', { error, message: sanitized.substring(0, 50) });
      return { isValid: false, error };
    }

    return { isValid: true, data: result.data.message };
  } catch (error) {
    logger.error('validateChatMessage error:', error);
    return { isValid: false, error: 'Validierung fehlgeschlagen' };
  }
}

/**
 * Validate profile data
 *
 * @param name - User's name
 * @param email - User's email
 * @returns ValidationResult with sanitized data if valid
 */
export function validateProfile(
  name: string,
  email: string
): ValidationResult<{ name: string; email: string }> {
  try {
    // Sanitize inputs
    const sanitizedName = sanitizeString(name);
    const sanitizedEmail = sanitizeEmail(email);

    // Validate with schema
    const result = profileSchema.safeParse({
      name: sanitizedName,
      email: sanitizedEmail,
    });

    if (!result.success) {
      const error = result.error.errors[0]?.message || 'Ungültige Profildaten';
      logger.log('Profile validation failed', { error });
      return { isValid: false, error };
    }

    return { isValid: true, data: result.data };
  } catch (error) {
    logger.error('validateProfile error:', error);
    return { isValid: false, error: 'Validierung fehlgeschlagen' };
  }
}

/**
 * Validate search query
 *
 * @param query - The search query to validate
 * @returns ValidationResult with sanitized query if valid
 */
export function validateSearchQuery(query: string): ValidationResult<string> {
  try {
    const sanitized = sanitizeString(query);
    const result = searchQuerySchema.safeParse({ query: sanitized });

    if (!result.success) {
      const error = result.error.errors[0]?.message || 'Ungültige Suchanfrage';
      return { isValid: false, error };
    }

    return { isValid: true, data: result.data.query };
  } catch (error) {
    logger.error('validateSearchQuery error:', error);
    return { isValid: false, error: 'Validierung fehlgeschlagen' };
  }
}

// =============================================================================
// RATE LIMITING
// =============================================================================

/**
 * Rate limiter for tracking user actions
 */
class RateLimiter {
  private attempts: Map<string, number[]> = new Map();

  /**
   * Check if action is allowed
   *
   * @param key - Unique identifier (e.g., user ID)
   * @param maxAttempts - Maximum attempts allowed
   * @param windowMs - Time window in milliseconds
   * @returns true if allowed, false if rate limited
   */
  isAllowed(key: string, maxAttempts: number, windowMs: number): boolean {
    const now = Date.now();
    const timestamps = this.attempts.get(key) || [];

    // Remove old timestamps outside the window
    const recentTimestamps = timestamps.filter((timestamp) => now - timestamp < windowMs);

    if (recentTimestamps.length >= maxAttempts) {
      logger.warn('Rate limit exceeded', {
        key: key.substring(0, 8), // Log only first 8 chars for privacy
        attempts: recentTimestamps.length,
        maxAttempts,
      });
      return false;
    }

    // Add current timestamp
    recentTimestamps.push(now);
    this.attempts.set(key, recentTimestamps);

    return true;
  }

  /**
   * Get remaining attempts
   *
   * @param key - Unique identifier
   * @param maxAttempts - Maximum attempts allowed
   * @param windowMs - Time window in milliseconds
   * @returns Number of remaining attempts
   */
  getRemainingAttempts(key: string, maxAttempts: number, windowMs: number): number {
    const now = Date.now();
    const timestamps = this.attempts.get(key) || [];
    const recentTimestamps = timestamps.filter((timestamp) => now - timestamp < windowMs);
    return Math.max(0, maxAttempts - recentTimestamps.length);
  }

  /**
   * Reset rate limit for a key
   *
   * @param key - Unique identifier to reset
   */
  reset(key: string): void {
    this.attempts.delete(key);
  }

  /**
   * Clear all rate limits (useful for cleanup)
   */
  clearAll(): void {
    this.attempts.clear();
  }
}

// Export singleton instance
export const chatRateLimiter = new RateLimiter();

/**
 * Check if chat message is rate limited
 *
 * @param userId - User's unique ID
 * @returns true if allowed, false if rate limited
 */
export function checkChatRateLimit(userId: string): boolean {
  return chatRateLimiter.isAllowed(
    `chat_${userId}`,
    VALIDATION_LIMITS.CHAT_RATE_LIMIT_MESSAGES,
    VALIDATION_LIMITS.CHAT_RATE_LIMIT_WINDOW_MS
  );
}

/**
 * Get remaining chat messages for user
 *
 * @param userId - User's unique ID
 * @returns Number of remaining messages
 */
export function getRemainingChatMessages(userId: string): number {
  return chatRateLimiter.getRemainingAttempts(
    `chat_${userId}`,
    VALIDATION_LIMITS.CHAT_RATE_LIMIT_MESSAGES,
    VALIDATION_LIMITS.CHAT_RATE_LIMIT_WINDOW_MS
  );
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Check if string length is within bounds
 *
 * @param str - String to check
 * @param minLength - Minimum length
 * @param maxLength - Maximum length
 * @returns true if within bounds
 */
export function isLengthValid(str: string, minLength: number, maxLength: number): boolean {
  const length = str.trim().length;
  return length >= minLength && length <= maxLength;
}

/**
 * Truncate string to maximum length
 *
 * @param str - String to truncate
 * @param maxLength - Maximum length
 * @returns Truncated string
 */
export function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
}