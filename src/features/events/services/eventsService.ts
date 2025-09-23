import { supabase } from '../../../services/supabase/client';
import { Database } from '../../../services/supabase/database.types';

type Event = Database['public']['Tables']['events']['Row'];
type EventInsert = Database['public']['Tables']['events']['Insert'];

export class EventsService {
  static async getEvents(): Promise<Event[]> {
    try {
      const today = new Date().toISOString().split('T')[0]; // Get date in YYYY-MM-DD format
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .gte('date', today)
        .order('date', { ascending: true });

      if (error) {
        console.error('Error fetching events:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('EventsService.getEvents error:', error);
      return [];
    }
  }

  static async getUpcomingEvents(limit: number = 5): Promise<Event[]> {
    try {
      const today = new Date().toISOString().split('T')[0]; // Get date in YYYY-MM-DD format
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .gte('date', today)
        .order('date', { ascending: true })
        .limit(limit);

      if (error) {
        console.error('Error fetching upcoming events:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('EventsService.getUpcomingEvents error:', error);
      return [];
    }
  }

  static async getPastEvents(): Promise<Event[]> {
    try {
      const today = new Date().toISOString().split('T')[0]; // Get date in YYYY-MM-DD format
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .lt('date', today)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching past events:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('EventsService.getPastEvents error:', error);
      return [];
    }
  }

  static async getEvent(id: string): Promise<Event | null> {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching event:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('EventsService.getEvent error:', error);
      return null;
    }
  }

  static async getEventsByMonth(year: number, month: number): Promise<Event[]> {
    try {
      const startDate = new Date(year, month - 1, 1).toISOString();
      const endDate = new Date(year, month, 0).toISOString();

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });

      if (error) {
        console.error('Error fetching events by month:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('EventsService.getEventsByMonth error:', error);
      return [];
    }
  }

  static subscribeToEventUpdates(callback: (payload: any) => void) {
    return supabase
      .channel('event-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events',
        },
        callback
      )
      .subscribe();
  }

  // Favorite Events Methods
  static async toggleFavoriteEvent(eventId: string, userId: string): Promise<boolean> {
    try {
      // First get current favorite events
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('favorite_events')
        .eq('id', userId)
        .single();

      if (fetchError) {
        console.error('Error fetching profile:', fetchError);
        return false;
      }

      // Parse favorite events from JSONB - could be an array or null
      const currentFavorites = Array.isArray(profile?.favorite_events) 
        ? profile.favorite_events as string[]
        : [];
      
      let newFavorites: string[];

      if (currentFavorites.includes(eventId)) {
        // Remove from favorites
        newFavorites = currentFavorites.filter((id: string) => id !== eventId);
      } else {
        // Add to favorites
        newFavorites = [...currentFavorites, eventId];
      }

      // Update favorite events as JSONB
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ favorite_events: newFavorites })
        .eq('id', userId);

      if (updateError) {
        console.error('Error updating favorite events:', updateError);
        return false;
      }

      return true;
    } catch (error) {
      console.error('EventsService.toggleFavoriteEvent error:', error);
      return false;
    }
  }

  static async getFavoriteEvents(userId: string): Promise<Event[]> {
    try {
      // Get user's favorite event IDs
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('favorite_events')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        return [];
      }

      // Parse favorite events from JSONB
      const favoriteIds = Array.isArray(profile?.favorite_events) 
        ? profile.favorite_events as string[]
        : [];

      if (favoriteIds.length === 0) {
        return [];
      }

      // Get events for those IDs
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .in('id', favoriteIds)
        .order('date', { ascending: true });

      if (error) {
        console.error('Error fetching favorite events:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('EventsService.getFavoriteEvents error:', error);
      return [];
    }
  }
}

export default EventsService;