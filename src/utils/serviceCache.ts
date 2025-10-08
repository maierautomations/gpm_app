import { logger } from './logger';

/**
 * ServiceCache - Generic TTL-based in-memory cache utility
 *
 * Purpose: Reduce redundant network requests by caching service responses
 * Use case: Menu items, events, offers, gallery photos that change infrequently
 *
 * Features:
 * - TTL-based expiration (time-to-live)
 * - Key-based invalidation
 * - Cache hit/miss logging for monitoring
 * - Memory-safe (Map-based, garbage collected)
 *
 * Usage:
 * ```typescript
 * const cache = new ServiceCache<MenuItem[]>(5 * 60 * 1000); // 5 minutes
 *
 * // Try to get from cache
 * const cached = cache.get('menu_items');
 * if (cached) return cached;
 *
 * // Cache miss - fetch and store
 * const data = await fetchFromDatabase();
 * cache.set('menu_items', data);
 *
 * // Invalidate when data changes
 * cache.invalidate('menu_items');
 * ```
 */
export class ServiceCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private maxSize: number;

  /**
   * @param ttl Time-to-live in milliseconds (e.g., 5 * 60 * 1000 for 5 minutes)
   * @param maxSize Maximum number of cached entries (default: 100)
   */
  constructor(
    private ttl: number,
    maxSize: number = 100
  ) {
    this.maxSize = maxSize;
  }

  /**
   * Get cached data if valid (not expired)
   * @param key Cache key
   * @returns Cached data or null if cache miss
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      logger.debug(`[Cache MISS] ${key} - not found`);
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > this.ttl) {
      logger.debug(`[Cache MISS] ${key} - expired (${Math.floor((Date.now() - entry.timestamp) / 1000)}s old)`);
      this.cache.delete(key);
      return null;
    }

    const ttlRemaining = this.ttl - (Date.now() - entry.timestamp);
    logger.debug(`[Cache HIT] ${key} - TTL remaining: ${Math.floor(ttlRemaining / 1000)}s`);
    return entry.data;
  }

  /**
   * Store data in cache
   * @param key Cache key
   * @param data Data to cache
   */
  set(key: string, data: T): void {
    // Enforce max size (LRU-style: remove oldest entry)
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
      logger.debug(`[Cache EVICT] ${firstKey} - max size reached`);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });

    logger.debug(`[Cache SET] ${key} - TTL: ${Math.floor(this.ttl / 1000)}s`);
  }

  /**
   * Invalidate (clear) cached data
   * @param key Cache key to invalidate (if omitted, clears all)
   */
  invalidate(key?: string): void {
    if (key) {
      const existed = this.cache.delete(key);
      if (existed) {
        logger.debug(`[Cache INVALIDATE] ${key}`);
      }
    } else {
      const size = this.cache.size;
      this.cache.clear();
      logger.debug(`[Cache CLEAR] Cleared ${size} entries`);
    }
  }

  /**
   * Check if cache has valid (non-expired) data
   * @param key Cache key
   * @returns true if cached and not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    const isExpired = Date.now() - entry.timestamp > this.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Get cache statistics for monitoring
   * @returns Cache stats
   */
  getStats(): CacheStats {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        expiredEntries++;
      } else {
        validEntries++;
      }
    }

    return {
      size: this.cache.size,
      validEntries,
      expiredEntries,
      maxSize: this.maxSize,
      ttl: this.ttl,
    };
  }

  /**
   * Manually clean up expired entries (garbage collection)
   * Normally not needed (Map is GC'd automatically)
   */
  cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug(`[Cache CLEANUP] Removed ${cleaned} expired entries`);
    }
  }
}

/**
 * Cache entry structure
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  size: number;
  validEntries: number;
  expiredEntries: number;
  maxSize: number;
  ttl: number;
}

/**
 * Cache configuration constants
 */
export const CACHE_TTL = {
  /** 2 minutes - for frequently changing data */
  SHORT: 2 * 60 * 1000,
  /** 5 minutes - for moderately changing data (menu items) */
  MEDIUM: 5 * 60 * 1000,
  /** 10 minutes - for stable data (categories) */
  LONG: 10 * 60 * 1000,
  /** 30 minutes - for rarely changing data (events) */
  VERY_LONG: 30 * 60 * 1000,
  /** 1 hour - for nearly static data (gallery photos) */
  HOUR: 60 * 60 * 1000,
  /** Until Monday midnight - for weekly offers */
  UNTIL_MONDAY: getMillisecondsUntilMonday(),
};

/**
 * Calculate milliseconds until next Monday at midnight
 */
function getMillisecondsUntilMonday(): number {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ...
  const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek; // Days until next Monday

  const nextMonday = new Date(now);
  nextMonday.setDate(now.getDate() + daysUntilMonday);
  nextMonday.setHours(0, 0, 0, 0);

  return nextMonday.getTime() - now.getTime();
}
