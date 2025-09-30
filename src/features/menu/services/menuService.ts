import { supabase } from '../../../services/supabase/client';
import { Database } from '../../../services/supabase/database.types';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { logger } from '../../../utils/logger';

type MenuItem = Database['public']['Tables']['menu_items']['Row'];

export class MenuService {
  static async getMenuItems(category?: string): Promise<MenuItem[]> {
    try {
      let query = supabase
        .from('menu_items')
        .select('*')
        .eq('is_available', true)
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Error fetching menu items:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error('MenuService.getMenuItems error:', error);
      return [];
    }
  }

  static async getMenuItem(id: number): Promise<MenuItem | null> {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        logger.error('Error fetching menu item:', error);
        return null;
      }

      return data;
    } catch (error) {
      logger.error('MenuService.getMenuItem error:', error);
      return null;
    }
  }

  static async searchMenuItems(searchTerm: string): Promise<MenuItem[]> {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('is_available', true)
        .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
        .order('name', { ascending: true });

      if (error) {
        logger.error('Error searching menu items:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error('MenuService.searchMenuItems error:', error);
      return [];
    }
  }

  static async toggleFavorite(itemId: number, userId: string): Promise<boolean> {
    try {
      // First get current favorites
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('favorites')
        .eq('id', userId)
        .single();

      if (fetchError) {
        logger.error('Error fetching profile:', fetchError);
        return false;
      }

      // Parse favorites from JSONB - could be an array or null
      const currentFavorites = Array.isArray(profile?.favorites) 
        ? profile.favorites as number[]
        : [];
      
      let newFavorites: number[];

      if (currentFavorites.includes(itemId)) {
        // Remove from favorites
        newFavorites = currentFavorites.filter((id: number) => id !== itemId);
      } else {
        // Add to favorites
        newFavorites = [...currentFavorites, itemId];
      }

      // Update favorites as JSONB
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ favorites: newFavorites })
        .eq('id', userId);

      if (updateError) {
        logger.error('Error updating favorites:', updateError);
        return false;
      }

      return true;
    } catch (error) {
      logger.error('MenuService.toggleFavorite error:', error);
      return false;
    }
  }

  static async getFavorites(userId: string): Promise<MenuItem[]> {
    try {
      // Get user's favorite IDs
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('favorites')
        .eq('id', userId)
        .single();

      if (profileError) {
        logger.error('Error fetching profile:', profileError);
        return [];
      }

      // Parse favorites from JSONB
      const favoriteIds = Array.isArray(profile?.favorites) 
        ? profile.favorites as number[]
        : [];

      if (favoriteIds.length === 0) {
        return [];
      }

      // Get menu items for those IDs
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .in('id', favoriteIds);

      if (error) {
        logger.error('Error fetching favorite items:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      logger.error('MenuService.getFavorites error:', error);
      return [];
    }
  }

  static subscribeToMenuUpdates(callback: (payload: RealtimePostgresChangesPayload<MenuItem>) => void) {
    return supabase
      .channel('menu-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'menu_items',
        },
        callback
      )
      .subscribe();
  }

  static async getSpecialOffers(): Promise<any> {
    try {
      // Get the current active week
      const { data: activeWeek, error: weekError } = await supabase
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

      if (weekError) {
        logger.error('Error fetching active week:', weekError);
        return null;
      }

      return activeWeek;
    } catch (error) {
      logger.error('MenuService.getSpecialOffers error:', error);
      return null;
    }
  }

  // Helper to get unique categories from menu items
  static async getCategories(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('category')
        .eq('is_available', true);

      if (error) {
        logger.error('Error fetching categories:', error);
        return [];
      }

      // Extract unique categories
      const categories = [...new Set(data?.map(item => item.category) || [])];
      return categories.sort();
    } catch (error) {
      logger.error('MenuService.getCategories error:', error);
      return [];
    }
  }
}

export default MenuService;