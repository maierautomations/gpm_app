import { supabase } from '../../../services/supabase/client';
import { Database } from '../../../services/supabase/database.types';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { logger } from '../../../utils/logger';
import { ServiceCache, CACHE_TTL } from '../../../utils/serviceCache';

type AngebotskalenderWeek = Database['public']['Tables']['angebotskalender_weeks']['Row'];
type AngebotskalenderItem = Database['public']['Tables']['angebotskalender_items']['Row'];
type MenuItem = Database['public']['Tables']['menu_items']['Row'];

export interface WeeklyOffer {
  week: AngebotskalenderWeek;
  items: OfferItem[];
}

export interface OfferItem {
  id: string;
  menu_item?: MenuItem; // Optional for custom items
  custom_name?: string; // For combo items not in menu_items
  custom_description?: string; // Description for custom items
  special_price: string;
  original_price: string;
  savings: string;
  highlight_badge?: string;
  is_custom: boolean; // Flag to distinguish item types
}

export class OffersService {
  // Cache instance for weekly offers (changes weekly on Monday)
  private static offersCache = new ServiceCache<WeeklyOffer | null>(CACHE_TTL.UNTIL_MONDAY);
  private static allWeeksCache = new ServiceCache<AngebotskalenderWeek[]>(CACHE_TTL.UNTIL_MONDAY);

  /**
   * Get the currently active week's offers
   */
  static async getCurrentWeekOffers(): Promise<WeeklyOffer | null> {
    try {
      const cacheKey = 'current_week_offers';

      // Check cache first
      const cached = this.offersCache.get(cacheKey);
      if (cached !== null) {
        return cached;
      }

      // Cache miss - fetch from Supabase
      const { data, error } = await supabase
        .from('angebotskalender_weeks')
        .select(`
          *,
          angebotskalender_items (
            *,
            menu_item:menu_items (*)
          )
        `)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        logger.error('Error fetching current offers:', error);
        return null;
      }

      // Transform the data for easier consumption
      type OfferItemRow = AngebotskalenderItem & {
        menu_item?: MenuItem;
      };

      const items: OfferItem[] = data.angebotskalender_items?.map((item: OfferItemRow) => {
        const isCustom = !item.menu_item_id || !item.menu_item;
        const originalPrice = isCustom ? item.base_price : item.menu_item?.price;
        
        return {
          id: item.id,
          menu_item: item.menu_item,
          custom_name: item.custom_name,
          custom_description: item.custom_description,
          special_price: item.special_price,
          original_price: originalPrice || '0',
          savings: this.calculateSavings(originalPrice, item.special_price),
          highlight_badge: item.highlight_badge,
          is_custom: isCustom
        };
      }) || [];

      const weeklyOffer = {
        week: {
          id: data.id,
          week_number: data.week_number,
          week_theme: data.week_theme,
          description: data.description,
          banner_image_url: data.banner_image_url,
          is_active: data.is_active,
          start_date: data.start_date,
          end_date: data.end_date,
          created_at: data.created_at
        },
        items
      };

      // Store in cache (until Monday)
      this.offersCache.set(cacheKey, weeklyOffer);

      return weeklyOffer;
    } catch (error) {
      logger.error('OffersService.getCurrentWeekOffers error:', error);
      return null;
    }
  }

  /**
   * Get offers for a specific week number
   */
  static async getOffersByWeek(weekNumber: number): Promise<WeeklyOffer | null> {
    try {
      const cacheKey = `offers_week_${weekNumber}`;

      // Check cache first
      const cached = this.offersCache.get(cacheKey);
      if (cached !== null) {
        return cached;
      }

      // Cache miss - fetch from Supabase
      const { data, error } = await supabase
        .from('angebotskalender_weeks')
        .select(`
          *,
          angebotskalender_items (
            *,
            menu_item:menu_items (*)
          )
        `)
        .eq('week_number', weekNumber)
        .single();

      if (error || !data) {
        logger.error('Error fetching week offers:', error);
        return null;
      }

      // Transform the data
      type OfferItemRow = AngebotskalenderItem & {
        menu_item?: MenuItem;
      };

      const items: OfferItem[] = data.angebotskalender_items?.map((item: OfferItemRow) => {
        const isCustom = !item.menu_item_id || !item.menu_item;
        const originalPrice = isCustom ? item.base_price : item.menu_item?.price;
        
        return {
          id: item.id,
          menu_item: item.menu_item,
          custom_name: item.custom_name,
          custom_description: item.custom_description,
          special_price: item.special_price,
          original_price: originalPrice || '0',
          savings: this.calculateSavings(originalPrice, item.special_price),
          highlight_badge: item.highlight_badge,
          is_custom: isCustom
        };
      }) || [];

      const weeklyOffer = {
        week: {
          id: data.id,
          week_number: data.week_number,
          week_theme: data.week_theme,
          description: data.description,
          banner_image_url: data.banner_image_url,
          is_active: data.is_active,
          start_date: data.start_date,
          end_date: data.end_date,
          created_at: data.created_at
        },
        items
      };

      // Store in cache (until Monday)
      this.offersCache.set(cacheKey, weeklyOffer);

      return weeklyOffer;
    } catch (error) {
      logger.error('OffersService.getOffersByWeek error:', error);
      return null;
    }
  }

  /**
   * Get all weeks overview (for planning/calendar view)
   */
  static async getAllWeeks(): Promise<AngebotskalenderWeek[]> {
    try {
      const cacheKey = 'all_weeks';

      // Check cache first
      const cached = this.allWeeksCache.get(cacheKey);
      if (cached) {
        return cached;
      }

      // Cache miss - fetch from Supabase
      const { data, error } = await supabase
        .from('angebotskalender_weeks')
        .select('*')
        .order('week_number', { ascending: true });

      if (error) {
        logger.error('Error fetching all weeks:', error);
        return [];
      }

      const weeks = data || [];

      // Store in cache (until Monday)
      this.allWeeksCache.set(cacheKey, weeks);

      return weeks;
    } catch (error) {
      logger.error('OffersService.getAllWeeks error:', error);
      return [];
    }
  }

  /**
   * Format price for display
   */
  static formatPrice(price: string | number): string {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return `€${numPrice.toFixed(2)}`;
  }

  /**
   * Get display name for an offer item
   */
  static getItemDisplayName(item: OfferItem): string {
    return item.is_custom ? (item.custom_name || 'Special Offer') : (item.menu_item?.name || 'Unknown Item');
  }

  /**
   * Get display description for an offer item
   */
  static getItemDisplayDescription(item: OfferItem): string | undefined {
    return item.is_custom ? item.custom_description : item.menu_item?.description;
  }

  /**
   * Calculate savings between original and special price
   */
  static calculateSavings(originalPrice: string | number, specialPrice: string | number): string {
    const original = typeof originalPrice === 'string' ? parseFloat(originalPrice) : originalPrice;
    const special = typeof specialPrice === 'string' ? parseFloat(specialPrice) : specialPrice;
    const savings = original - special;
    return savings.toFixed(2);
  }

  /**
   * Calculate savings percentage
   */
  static calculateSavingsPercentage(originalPrice: string | number, specialPrice: string | number): number {
    const original = typeof originalPrice === 'string' ? parseFloat(originalPrice) : originalPrice;
    const special = typeof specialPrice === 'string' ? parseFloat(specialPrice) : specialPrice;
    
    if (original === 0) return 0;
    
    const percentage = ((original - special) / original) * 100;
    return Math.round(percentage);
  }

  /**
   * Subscribe to offer updates
   */
  static subscribeToOfferUpdates(callback: (payload: RealtimePostgresChangesPayload<WeeklyOffer>) => void) {
    return supabase
      .channel('offer-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'angebotskalender_weeks',
        },
        callback
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'angebotskalender_items',
        },
        callback
      )
      .subscribe();
  }

  /**
   * Invalidate offers cache (called by subscription or manual refresh)
   * Use this when weekly offers are rotated or updated
   */
  static invalidateCache(): void {
    this.offersCache.invalidate(); // Clear all offers
    this.allWeeksCache.invalidate(); // Clear all weeks

    logger.info('[OffersService] Cache invalidated');
  }

  /**
   * Get cache statistics for monitoring
   */
  static getCacheStats() {
    return {
      offers: this.offersCache.getStats(),
      allWeeks: this.allWeeksCache.getStats(),
    };
  }
}

export default OffersService;