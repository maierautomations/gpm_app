/**
 * Service Error Handling Utilities
 *
 * Provides standardized error handling for service layer operations.
 * This ensures consistent error handling across all services.
 */

import { logger } from './logger';

/**
 * Standard service result type
 * Use this for operations that can fail gracefully
 */
export type ServiceResult<T> = {
  data: T | null;
  error: ServiceError | null;
  isLoading?: boolean;
};

/**
 * Service Error class with additional context
 */
export class ServiceError extends Error {
  code: string;
  isNetworkError: boolean;
  isRetryable: boolean;
  originalError?: unknown;
  context?: Record<string, unknown>;

  constructor(
    message: string,
    options: {
      code?: string;
      isNetworkError?: boolean;
      isRetryable?: boolean;
      originalError?: unknown;
      context?: Record<string, unknown>;
    } = {}
  ) {
    super(message);
    this.name = 'ServiceError';
    this.code = options.code || 'UNKNOWN_ERROR';
    this.isNetworkError = options.isNetworkError || false;
    this.isRetryable = options.isRetryable || false;
    this.originalError = options.originalError;
    this.context = options.context;

    // Log the error immediately
    logger.error(`ServiceError [${this.code}]: ${message}`, {
      code: this.code,
      isNetworkError: this.isNetworkError,
      isRetryable: this.isRetryable,
      context: this.context,
      originalError: this.originalError,
    });
  }
}

/**
 * Common error codes
 */
export const ERROR_CODES = {
  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
  NO_CONNECTION: 'NO_CONNECTION',

  // Database errors
  DATABASE_ERROR: 'DATABASE_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  PERMISSION_DENIED: 'PERMISSION_DENIED',

  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',

  // Business logic errors
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  OPERATION_FAILED: 'OPERATION_FAILED',

  // Unknown
  UNKNOWN: 'UNKNOWN_ERROR',
} as const;

/**
 * User-friendly error messages (German)
 */
export const ERROR_MESSAGES: Record<string, string> = {
  [ERROR_CODES.NETWORK_ERROR]: 'Netzwerkfehler. Bitte überprüfen Sie Ihre Internetverbindung.',
  [ERROR_CODES.TIMEOUT]: 'Die Anfrage hat zu lange gedauert. Bitte versuchen Sie es erneut.',
  [ERROR_CODES.NO_CONNECTION]: 'Keine Internetverbindung. Bitte überprüfen Sie Ihr Netzwerk.',
  [ERROR_CODES.DATABASE_ERROR]:
    'Datenbankfehler. Bitte versuchen Sie es später erneut.',
  [ERROR_CODES.NOT_FOUND]: 'Die angeforderten Daten wurden nicht gefunden.',
  [ERROR_CODES.PERMISSION_DENIED]: 'Sie haben keine Berechtigung für diese Aktion.',
  [ERROR_CODES.VALIDATION_ERROR]: 'Ungültige Eingabe. Bitte überprüfen Sie Ihre Daten.',
  [ERROR_CODES.INVALID_INPUT]: 'Die eingegebenen Daten sind nicht gültig.',
  [ERROR_CODES.ALREADY_EXISTS]: 'Dieser Eintrag existiert bereits.',
  [ERROR_CODES.OPERATION_FAILED]: 'Die Operation ist fehlgeschlagen. Bitte versuchen Sie es erneut.',
  [ERROR_CODES.UNKNOWN]: 'Ein unbekannter Fehler ist aufgetreten.',
};

/**
 * Get user-friendly error message
 */
export function getUserFriendlyMessage(error: ServiceError | Error): string {
  if (error instanceof ServiceError) {
    return ERROR_MESSAGES[error.code] || ERROR_MESSAGES[ERROR_CODES.UNKNOWN];
  }
  return ERROR_MESSAGES[ERROR_CODES.UNKNOWN];
}

/**
 * Create a success result
 */
export function createSuccessResult<T>(data: T): ServiceResult<T> {
  return {
    data,
    error: null,
    isLoading: false,
  };
}

/**
 * Create an error result
 */
export function createErrorResult<T>(error: ServiceError): ServiceResult<T> {
  return {
    data: null,
    error,
    isLoading: false,
  };
}

/**
 * Handle Supabase errors and convert to ServiceError
 */
export function handleSupabaseError(error: unknown, context?: Record<string, unknown>): ServiceError {
  const errorObj = error as { code?: string; message?: string; details?: string };

  // Supabase specific error codes
  if (errorObj.code === 'PGRST116') {
    return new ServiceError('Daten nicht gefunden', {
      code: ERROR_CODES.NOT_FOUND,
      isRetryable: false,
      originalError: error,
      context,
    });
  }

  if (errorObj.code === '42501') {
    return new ServiceError('Keine Berechtigung für diese Aktion', {
      code: ERROR_CODES.PERMISSION_DENIED,
      isRetryable: false,
      originalError: error,
      context,
    });
  }

  // Network errors
  if (
    errorObj.message?.includes('fetch') ||
    errorObj.message?.includes('network') ||
    errorObj.message?.includes('timeout')
  ) {
    return new ServiceError('Netzwerkfehler', {
      code: ERROR_CODES.NETWORK_ERROR,
      isNetworkError: true,
      isRetryable: true,
      originalError: error,
      context,
    });
  }

  // Default database error
  return new ServiceError(errorObj.message || 'Datenbankfehler', {
    code: ERROR_CODES.DATABASE_ERROR,
    isRetryable: true,
    originalError: error,
    context,
  });
}

/**
 * Retry logic wrapper
 * Retries a function up to maxRetries times with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    delayMs?: number;
    backoffMultiplier?: number;
    shouldRetry?: (error: unknown) => boolean;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    delayMs = 1000,
    backoffMultiplier = 2,
    shouldRetry = (error) =>
      error instanceof ServiceError && error.isRetryable,
  } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry if it's the last attempt or if we shouldn't retry this error
      if (attempt === maxRetries || !shouldRetry(error)) {
        throw error;
      }

      // Wait before retrying (exponential backoff)
      const delay = delayMs * Math.pow(backoffMultiplier, attempt);
      logger.log(`Retrying after ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Safe async operation wrapper
 * Catches errors and returns ServiceResult
 */
export async function safeAsync<T>(
  fn: () => Promise<T>,
  errorContext?: Record<string, unknown>
): Promise<ServiceResult<T>> {
  try {
    const data = await fn();
    return createSuccessResult(data);
  } catch (error) {
    const serviceError =
      error instanceof ServiceError
        ? error
        : handleSupabaseError(error, errorContext);
    return createErrorResult(serviceError);
  }
}