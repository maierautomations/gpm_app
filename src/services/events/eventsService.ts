import { supabase } from '../supabase/client';
import { Database } from '../supabase/database.types';

type Event = Database['public']['Tables']['events']['Row'];
type EventInsert = Database['public']['Tables']['events']['Insert'];

export class EventsService {
  static async getEvents(): Promise<Event[]> {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .gte('date', new Date().toISOString())
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
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .gte('date', new Date().toISOString())
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
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .lt('date', new Date().toISOString())
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

  // Get mock events for testing (if database is empty)
  static getMockEvents(): Event[] {
    const now = new Date();
    return [
      {
        id: '1',
        title: 'Kieler Woche 2025',
        description: 'Besuchen Sie uns an unserem Stand während der Kieler Woche! Genießen Sie unsere Spezialitäten direkt am Hafen.',
        date: new Date(2025, 5, 21).toISOString(), // June 21, 2025
        location: 'Kiellinie, Stand 42',
        offerings: ['Currywurst Spezial', 'Frikadellen', 'Pommes', 'Kaltgetränke'],
        image_url: null,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      },
      {
        id: '2',
        title: 'Stadtfest Kiel-Dietrichsdorf',
        description: 'Feiern Sie mit uns beim traditionellen Stadtfest in Dietrichsdorf.',
        date: new Date(2025, 6, 15).toISOString(), // July 15, 2025
        location: 'Marktplatz Dietrichsdorf',
        offerings: ['Grillspezialitäten', 'Eis', 'Getränke'],
        image_url: null,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      },
      {
        id: '3',
        title: 'Firmenfeier - Catering',
        description: 'Private Veranstaltung - Catering für 150 Personen',
        date: new Date(2025, 7, 10).toISOString(), // August 10, 2025
        location: 'Firmenzentrale Kiel',
        offerings: ['Buffet', 'Grillstation', 'Desserts'],
        image_url: null,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      },
    ];
  }
}

export default EventsService;