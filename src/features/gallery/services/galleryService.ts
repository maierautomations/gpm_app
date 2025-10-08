import { supabase } from '../../../services/supabase/client';
import { Database } from '../../../services/supabase/database.types';
import { logger } from '../../../utils/logger';
import { ServiceCache, CACHE_TTL } from '../../../utils/serviceCache';

type GalleryPhoto = Database['public']['Tables']['gallery_photos']['Row'];
type PhotoCategory = 'restaurant' | 'events' | 'eis';

export class GalleryService {
  // Cache instance for gallery photos (changes rarely - new photos added monthly)
  private static galleryCache = new ServiceCache<GalleryPhoto[]>(CACHE_TTL.HOUR); // 1 hour
  private static categoryCountsCache = new ServiceCache<Record<PhotoCategory, number>>(CACHE_TTL.HOUR);

  /**
   * Get featured photos for home screen preview
   */
  static async getFeaturedPhotos(): Promise<GalleryPhoto[]> {
    try {
      const cacheKey = 'featured_photos';

      // Check cache first
      const cached = this.galleryCache.get(cacheKey);
      if (cached) {
        return cached;
      }

      // Cache miss - fetch from Supabase
      const { data, error } = await supabase
        .from('gallery_photos')
        .select('*')
        .eq('is_featured', true)
        .order('display_order', { ascending: true })
        .limit(6);

      if (error) {
        logger.error('Error fetching featured photos:', error);
        return [];
      }

      const photos = data || [];

      // Store in cache
      this.galleryCache.set(cacheKey, photos);

      return photos;
    } catch (error) {
      logger.error('Error in getFeaturedPhotos:', error);
      return [];
    }
  }

  /**
   * Get all photos by category
   */
  static async getPhotosByCategory(category: PhotoCategory): Promise<GalleryPhoto[]> {
    try {
      const cacheKey = `photos_${category}`;

      // Check cache first
      const cached = this.galleryCache.get(cacheKey);
      if (cached) {
        return cached;
      }

      // Cache miss - fetch from Supabase
      const { data, error } = await supabase
        .from('gallery_photos')
        .select('*')
        .eq('category', category)
        .order('display_order', { ascending: true });

      if (error) {
        logger.error(`Error fetching photos for category ${category}:`, error);
        return [];
      }

      const photos = data || [];

      // Store in cache
      this.galleryCache.set(cacheKey, photos);

      return photos;
    } catch (error) {
      logger.error(`Error in getPhotosByCategory for ${category}:`, error);
      return [];
    }
  }

  /**
   * Get all photos grouped by category
   */
  static async getAllPhotos(): Promise<Record<PhotoCategory, GalleryPhoto[]>> {
    try {
      const { data, error } = await supabase
        .from('gallery_photos')
        .select('*')
        .order('category')
        .order('display_order', { ascending: true });

      if (error) {
        logger.error('Error fetching all photos:', error);
        return { restaurant: [], events: [], eis: [] };
      }

      // Group photos by category
      const groupedPhotos: Record<PhotoCategory, GalleryPhoto[]> = {
        restaurant: [],
        events: [],
        eis: []
      };

      data?.forEach(photo => {
        const category = photo.category as PhotoCategory;
        if (groupedPhotos[category]) {
          groupedPhotos[category].push(photo);
        }
      });

      return groupedPhotos;
    } catch (error) {
      logger.error('Error in getAllPhotos:', error);
      return { restaurant: [], events: [], eis: [] };
    }
  }

  /**
   * Get category counts for UI badges
   */
  static async getCategoryCounts(): Promise<Record<PhotoCategory, number>> {
    try {
      const cacheKey = 'category_counts';

      // Check cache first
      const cached = this.categoryCountsCache.get(cacheKey);
      if (cached) {
        return cached;
      }

      // Cache miss - fetch from Supabase
      const { data, error } = await supabase
        .from('gallery_photos')
        .select('category')
        .order('category');

      if (error) {
        logger.error('Error fetching category counts:', error);
        return { restaurant: 0, events: 0, eis: 0 };
      }

      const counts: Record<PhotoCategory, number> = {
        restaurant: 0,
        events: 0,
        eis: 0
      };

      data?.forEach(photo => {
        const category = photo.category as PhotoCategory;
        if (counts[category] !== undefined) {
          counts[category]++;
        }
      });

      // Store in cache
      this.categoryCountsCache.set(cacheKey, counts);

      return counts;
    } catch (error) {
      logger.error('Error in getCategoryCounts:', error);
      return { restaurant: 0, events: 0, eis: 0 };
    }
  }

  /**
   * Get display name for category
   */
  static getCategoryDisplayName(category: PhotoCategory): string {
    const names: Record<PhotoCategory, string> = {
      restaurant: 'Restaurant',
      events: 'Events',
      eis: 'Eis-Spezialitäten'
    };
    return names[category];
  }

  /**
   * Subscribe to photo changes for real-time updates
   */
  static subscribeToPhotos(callback: (photos: GalleryPhoto[]) => void) {
    const subscription = supabase
      .channel('gallery_photos_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'gallery_photos'
        },
        async () => {
          // Invalidate cache and reload featured photos when any photo changes
          this.invalidateCache();
          const photos = await this.getFeaturedPhotos();
          callback(photos);
        }
      )
      .subscribe();

    return subscription;
  }

  /**
   * Invalidate gallery cache (called by subscription or manual refresh)
   */
  static invalidateCache(): void {
    this.galleryCache.invalidate(); // Clear all gallery photos
    this.categoryCountsCache.invalidate(); // Clear category counts

    logger.info('[GalleryService] Cache invalidated');
  }

  /**
   * Get cache statistics for monitoring
   */
  static getCacheStats() {
    return {
      gallery: this.galleryCache.getStats(),
      categoryCounts: this.categoryCountsCache.getStats(),
    };
  }
}

export default GalleryService;