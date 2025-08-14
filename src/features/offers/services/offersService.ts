import { supabase } from '../../../services/supabase/client';
import { Database } from '../../../services/supabase/database.types';

type AngebotskalenderWeek = Database['public']['Tables']['angebotskalender_weeks']['Row'];
type AngebotskalenderItem = Database['public']['Tables']['angebotskalender_items']['Row'];
type MenuItem = Database['public']['Tables']['menu_items']['Row'];

export interface WeeklyOffer {
  week: AngebotskalenderWeek;
  items: OfferItem[];
}

export interface OfferItem {
  id: string;
  menu_item: MenuItem;
  special_price: string;
  original_price: string;
  savings: string;
  highlight_badge?: string;
}

export class OffersService {
  /**
   * Get the currently active week's offers
   */
  static async getCurrentWeekOffers(): Promise<WeeklyOffer | null> {
    try {
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
        console.error('Error fetching current offers:', error);
        return null;
      }

      // Transform the data for easier consumption
      const items: OfferItem[] = data.angebotskalender_items?.map((item: any) => ({
        id: item.id,
        menu_item: item.menu_item,
        special_price: item.special_price,
        original_price: item.menu_item?.price || '0',
        savings: this.calculateSavings(item.menu_item?.price, item.special_price),
        highlight_badge: item.highlight_badge
      })) || [];

      return {
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
    } catch (error) {
      console.error('OffersService.getCurrentWeekOffers error:', error);
      return null;
    }
  }

  /**
   * Get offers for a specific week number
   */
  static async getOffersByWeek(weekNumber: number): Promise<WeeklyOffer | null> {
    try {
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
        console.error('Error fetching week offers:', error);
        return null;
      }

      // Transform the data
      const items: OfferItem[] = data.angebotskalender_items?.map((item: any) => ({
        id: item.id,
        menu_item: item.menu_item,
        special_price: item.special_price,
        original_price: item.menu_item?.price || '0',
        savings: this.calculateSavings(item.menu_item?.price, item.special_price),
        highlight_badge: item.highlight_badge
      })) || [];

      return {
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
    } catch (error) {
      console.error('OffersService.getOffersByWeek error:', error);
      return null;
    }
  }

  /**
   * Get all weeks overview (for planning/calendar view)
   */
  static async getAllWeeks(): Promise<AngebotskalenderWeek[]> {
    try {
      const { data, error } = await supabase
        .from('angebotskalender_weeks')
        .select('*')
        .order('week_number', { ascending: true });

      if (error) {
        console.error('Error fetching all weeks:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('OffersService.getAllWeeks error:', error);
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
  static subscribeToOfferUpdates(callback: (payload: any) => void) {
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
}

export default OffersService;