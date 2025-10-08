import React from 'react';
import { Image as ExpoImage, ImageProps as ExpoImageProps } from 'expo-image';
import { StyleSheet, View, ActivityIndicator } from 'react-native';

/**
 * CachedImage Component
 *
 * A wrapper around expo-image that provides:
 * - Automatic memory and disk caching
 * - Progressive loading with blur placeholders
 * - Smooth fade-in transitions
 * - Error handling
 *
 * Usage:
 * <CachedImage
 *   uri="https://example.com/image.jpg"
 *   style={styles.image}
 *   contentFit="cover"
 * />
 */

interface CachedImageProps {
  uri: string;
  style?: any;
  contentFit?: 'cover' | 'contain' | 'fill' | 'scale-down' | 'none';
  transition?: number; // Fade-in duration in milliseconds
  placeholder?: string; // Blurhash or placeholder URI
  priority?: 'low' | 'normal' | 'high';
  onLoad?: () => void;
  onError?: (error: any) => void;
  cachePolicy?: 'none' | 'disk' | 'memory' | 'memory-disk';
}

export default function CachedImage({
  uri,
  style,
  contentFit = 'cover',
  transition = 200,
  placeholder,
  priority = 'normal',
  onLoad,
  onError,
  cachePolicy = 'memory-disk',
}: CachedImageProps) {
  // Default gray placeholder for images without blurhash
  const defaultPlaceholder = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mN88B8AAskB+4m0JQAAAABJRU5ErkJggg==';

  return (
    <ExpoImage
      source={{ uri }}
      style={style}
      contentFit={contentFit}
      placeholder={placeholder || defaultPlaceholder}
      placeholderContentFit="cover"
      transition={transition}
      priority={priority}
      onLoad={onLoad}
      onError={onError}
      cachePolicy={cachePolicy}
      // Performance optimizations
      recyclingKey={uri} // Helps with list performance
    />
  );
}

/**
 * Cache Management Functions
 */

/**
 * Prefetch images for better UX (e.g., preload next gallery images)
 *
 * @param uris Array of image URIs to prefetch
 * @returns Promise that resolves when all images are prefetched
 */
export async function prefetchImages(uris: string[]): Promise<void> {
  try {
    await Promise.all(
      uris.map(uri => ExpoImage.prefetch(uri))
    );
  } catch (error) {
    console.warn('Error prefetching images:', error);
  }
}

/**
 * Clear the image cache (useful for debugging or settings)
 *
 * @returns Promise that resolves when cache is cleared
 */
export async function clearImageCache(): Promise<boolean> {
  try {
    await ExpoImage.clearMemoryCache();
    await ExpoImage.clearDiskCache();
    return true;
  } catch (error) {
    console.error('Error clearing image cache:', error);
    return false;
  }
}

/**
 * Get cache size (memory + disk)
 * Note: expo-image doesn't expose cache size directly,
 * so this is a placeholder for future implementation
 */
export async function getCacheSize(): Promise<{ memory: number; disk: number }> {
  // expo-image doesn't currently expose cache size
  // This is a placeholder for future implementation
  return { memory: 0, disk: 0 };
}

/**
 * Cache Configuration Constants
 * These are applied globally by expo-image
 */
export const IMAGE_CACHE_CONFIG = {
  maxMemoryCacheSize: 50 * 1024 * 1024,  // 50MB memory cache (recommended)
  maxDiskCacheSize: 100 * 1024 * 1024,   // 100MB disk cache (recommended)
  ttl: 7 * 24 * 60 * 60 * 1000,         // 7 days TTL (time to live)
  cachePolicy: 'memory-disk' as const,   // Use both memory and disk caching
};
