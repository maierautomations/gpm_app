import MenuService from '../../menu/services/menuService';
import EventsService from '../../events/services/eventsService';
import GalleryService from '../../gallery/services/galleryService';
import { Database } from '../../../services/supabase/database.types';

type MenuItem = Database['public']['Tables']['menu_items']['Row'];

interface RestaurantConfig {
  name: string;
  established: number;
  location: string;
  phone: string;
  hours: string;
  parking: string;
  specialties: string[];
  services: string[];
  socialMedia?: {
    instagram?: string;
    facebook?: string;
    website?: string;
  };
  paymentMethods: string[];
  seatingCapacity?: number;
  deliveryInfo?: string;
}

// Centralized restaurant configuration
const RESTAURANT_CONFIG: RestaurantConfig = {
  name: 'Grill-Partner Maier',
  established: 1968,
  location: 'Langer Rehm 25, 24149 Kiel-Dietrichsdorf',
  phone: '+49 431 203615',
  hours: '11:00-21:00 Uhr (täglich außer Heiligabend)',
  parking: 'Kostenlose Parkplätze direkt vor dem Restaurant',
  specialties: [
    'Traditioneller deutscher Imbiss',
    'Hausgemachte Frikadellen seit 1968',
    'Currywurst Spezial',
    'Türkische Spezialitäten',
    'Burger-Variationen',
    'Eventgastronomie (Mai-September)',
    'Eis-Spezialitäten (saisonal)',
  ],
  services: [
    'Kieler Woche Catering',
    'Stadtfeste und Märkte',
    'Private Feiern',
    'Firmencatering',
    'Eisverkauf im Sommer',
  ],
  paymentMethods: [
    'Bargeld',
    'EC-Karte',
    'Kreditkarte (Visa, Mastercard)',
    'Kontaktlos (Apple Pay, Google Pay)',
  ],
  seatingCapacity: 40,
  deliveryInfo: 'Kein Lieferservice - nur Abholung und Vor-Ort-Verzehr',
};

export class ContextManager {
  private static formatAllergens(allergens: any): string[] {
    if (!allergens) return [];
    if (Array.isArray(allergens)) return allergens;
    if (typeof allergens === 'object') {
      return Object.keys(allergens).filter((key) => allergens[key] === true);
    }
    return [];
  }

  private static getRestaurantStatus(): {
    status: 'open' | 'closed' | 'closing_soon';
    nextStatusChange?: string;
  } {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTime = currentHour + currentMinutes / 60;

    // Opening hours: 11:00-21:00 daily (except Christmas Eve)
    const isChristmasEve = now.getMonth() === 11 && now.getDate() === 24;

    if (isChristmasEve) {
      return { status: 'closed', nextStatusChange: 'Öffnet am 25. Dezember um 11:00 Uhr' };
    }

    if (currentTime >= 11 && currentTime < 20.5) {
      return { status: 'open' };
    } else if (currentTime >= 20.5 && currentTime < 21) {
      return { status: 'closing_soon', nextStatusChange: 'Schließt um 21:00 Uhr' };
    } else {
      const nextOpen = currentHour < 11 ? 'heute um 11:00 Uhr' : 'morgen um 11:00 Uhr';
      return { status: 'closed', nextStatusChange: `Öffnet ${nextOpen}` };
    }
  }

  // Get menu context with full details
  static async getMenuContext(): Promise<string> {
    try {
      const menuItems = await MenuService.getMenuItems();
      const categories = await MenuService.getCategories();
      const specialOffers = await MenuService.getSpecialOffers();

      if (menuItems.length === 0) {
        return 'SPEISEKARTE: Momentan nicht verfügbar.';
      }

      // Group menu by category
      const menuByCategory = categories.map((categoryName) => {
        const items = menuItems
          .filter((item) => item.category === categoryName)
          .slice(0, 10) // Limit items per category for context size
          .map((item) => {
            let text = `- ${item.name}: €${parseFloat(item.price).toFixed(2)}`;
            const allergens = this.formatAllergens(item.allergens);
            if (allergens.length > 0) {
              text += ` [Allergene: ${allergens.join(', ')}]`;
            }
            return text;
          })
          .join('\n');

        return `${categoryName.toUpperCase()}:\n${items}`;
      }).join('\n\n');

      // Add special offers
      let offersText = '';
      if (specialOffers && specialOffers.angebotskalender_items?.length > 0) {
        const offerItems = specialOffers.angebotskalender_items.map((item: any) => {
          const displayName = item.custom_name || item.menu_item?.name || 'Unbekanntes Angebot';
          const originalPrice = item.base_price || item.menu_item?.price;
          const savings = originalPrice ? (parseFloat(originalPrice) - parseFloat(item.special_price)).toFixed(2) : null;
          
          let text = `- 🔥 ${displayName}: ANGEBOT €${item.special_price}`;
          if (originalPrice && savings) {
            text += ` (statt €${originalPrice}, spare €${savings})`;
          }
          if (item.highlight_badge) {
            text += ` [${item.highlight_badge}]`;
          }
          return text;
        }).join('\n');

        offersText = `\n🔥 AKTUELLE WOCHE: ${specialOffers.week_theme}\n${offerItems}\n`;
      }

      return `SPEISEKARTE (${menuItems.length} Artikel):\n${offersText}\n${menuByCategory}`;
    } catch (error) {
      console.error('Error fetching menu context:', error);
      return 'SPEISEKARTE: Fehler beim Laden.';
    }
  }

  // Get events context
  static async getEventsContext(): Promise<string> {
    try {
      const events = await EventsService.getUpcomingEvents();
      
      if (events.length === 0) {
        return 'VERANSTALTUNGEN: Keine aktuellen Veranstaltungen.';
      }

      const eventsList = events.slice(0, 5).map((event) => {
        const date = new Date(event.date).toLocaleDateString('de-DE', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });
        let text = `- ${event.title} (${date})`;
        if (event.location && event.location !== RESTAURANT_CONFIG.location) {
          text += ` @ ${event.location}`;
        }
        if (event.offerings && event.offerings.length > 0) {
          text += `\n  Angebot: ${event.offerings.join(', ')}`;
        }
        return text;
      }).join('\n');

      return `KOMMENDE VERANSTALTUNGEN:\n${eventsList}\n\nHINWEIS: Wir bieten professionelles Catering für Events von Mai bis September.`;
    } catch (error) {
      console.error('Error fetching events context:', error);
      return 'VERANSTALTUNGEN: Fehler beim Laden.';
    }
  }

  // Get gallery context (brief info about available photos)
  static async getGalleryContext(): Promise<string> {
    try {
      const photosByCategory = await GalleryService.getAllPhotos();
      
      const categories = {
        restaurant: photosByCategory.restaurant.length,
        events: photosByCategory.events.length,
        eis: photosByCategory.eis.length,
      };

      const totalPhotos = categories.restaurant + categories.events + categories.eis;

      if (totalPhotos === 0) {
        return '';
      }

      return `FOTOGALERIE: ${totalPhotos} Fotos verfügbar (${categories.restaurant} Restaurant, ${categories.events} Events, ${categories.eis} Eis-Spezialitäten)`;
    } catch (error) {
      return '';
    }
  }

  // Get loyalty program context
  static async getLoyaltyContext(): Promise<string> {
    return `TREUEPROGRAMM:
- Sammeln Sie Punkte bei jedem Besuch
- QR-Codes an der Kasse scannen
- 10 Punkte = 1€ Rabatt
- Punkte verfallen nicht
- Exklusive Angebote für Stammkunden`;
  }

  // Get restaurant info context
  static getRestaurantInfoContext(): string {
    const status = this.getRestaurantStatus();
    const statusEmoji = status.status === 'open' ? '🟢' : status.status === 'closing_soon' ? '🟡' : '🔴';
    const statusText = status.status === 'open' ? 'GEÖFFNET' : status.status === 'closing_soon' ? 'SCHLIESST BALD' : 'GESCHLOSSEN';

    return `RESTAURANT INFORMATION:
📍 Name: ${RESTAURANT_CONFIG.name}
📍 Adresse: ${RESTAURANT_CONFIG.location}
📞 Telefon: ${RESTAURANT_CONFIG.phone}
🕐 Öffnungszeiten: ${RESTAURANT_CONFIG.hours}
${statusEmoji} Status: ${statusText}${status.nextStatusChange ? ` (${status.nextStatusChange})` : ''}
🅿️ Parkplätze: ${RESTAURANT_CONFIG.parking}
👥 Sitzplätze: ${RESTAURANT_CONFIG.seatingCapacity} Plätze innen
💳 Zahlung: ${RESTAURANT_CONFIG.paymentMethods.join(', ')}
🚚 Lieferung: ${RESTAURANT_CONFIG.deliveryInfo}

SPEZIALITÄTEN:
${RESTAURANT_CONFIG.specialties.map(s => `- ${s}`).join('\n')}

SERVICES:
${RESTAURANT_CONFIG.services.map(s => `- ${s}`).join('\n')}`;
  }

  // Get full context for chat
  static async getFullContext(options?: {
    includeMenu?: boolean;
    includeEvents?: boolean;
    includeGallery?: boolean;
    includeLoyalty?: boolean;
    includeRestaurantInfo?: boolean;
    compact?: boolean;
  }): Promise<string> {
    const opts = {
      includeMenu: true,
      includeEvents: true,
      includeGallery: true,
      includeLoyalty: true,
      includeRestaurantInfo: true,
      compact: false,
      ...options,
    };

    const contextParts: string[] = [];

    // Always include restaurant info as header
    if (opts.includeRestaurantInfo) {
      contextParts.push(this.getRestaurantInfoContext());
      contextParts.push('═══════════════════════════════════════════');
    }

    // Add menu context
    if (opts.includeMenu) {
      const menuContext = await this.getMenuContext();
      if (menuContext) {
        contextParts.push(menuContext);
        contextParts.push('');
      }
    }

    // Add events context
    if (opts.includeEvents) {
      const eventsContext = await this.getEventsContext();
      if (eventsContext) {
        contextParts.push(eventsContext);
        contextParts.push('');
      }
    }

    // Add gallery context (brief)
    if (opts.includeGallery) {
      const galleryContext = await this.getGalleryContext();
      if (galleryContext) {
        contextParts.push(galleryContext);
        contextParts.push('');
      }
    }

    // Add loyalty context
    if (opts.includeLoyalty) {
      const loyaltyContext = await this.getLoyaltyContext();
      if (loyaltyContext) {
        contextParts.push(loyaltyContext);
        contextParts.push('');
      }
    }

    // Add footer
    contextParts.push('═══════════════════════════════════════════');
    contextParts.push(`WICHTIGE HINWEISE:
- Familienbetrieb seit ${RESTAURANT_CONFIG.established} - über ${new Date().getFullYear() - RESTAURANT_CONFIG.established} Jahre Tradition
- Alle Preise inkl. MwSt.
- Bei Allergien bitte nachfragen
- Eventcatering nach Vereinbarung`);

    return contextParts.join('\n');
  }

  // Get compact context for quick responses
  static async getCompactContext(): Promise<string> {
    try {
      const menuItems = await MenuService.getMenuItems();
      const specialOffers = await MenuService.getSpecialOffers();
      const status = this.getRestaurantStatus();

      let context = `${RESTAURANT_CONFIG.name} - ${menuItems.length} Speisen\n`;
      
      if (specialOffers && specialOffers.angebotskalender_items?.length > 0) {
        context += `🔥 ${specialOffers.week_theme}: ${specialOffers.angebotskalender_items.length} Angebote\n`;
      }

      const statusEmoji = status.status === 'open' ? '🟢' : status.status === 'closing_soon' ? '🟡' : '🔴';
      context += `${statusEmoji} ${status.status.toUpperCase()}\n`;
      context += `📞 ${RESTAURANT_CONFIG.phone}`;

      return context;
    } catch (error) {
      return `${RESTAURANT_CONFIG.name}, Kiel-Dietrichsdorf`;
    }
  }

  // Analyze query to determine what context is needed
  static analyzeQueryContext(query: string): {
    needsMenu: boolean;
    needsEvents: boolean;
    needsGallery: boolean;
    needsLoyalty: boolean;
    needsRestaurantInfo: boolean;
  } {
    const lowerQuery = query.toLowerCase();

    return {
      needsMenu: /speise|menu|essen|food|preis|price|burger|pizza|döner|currywurst|angebot|offer/.test(lowerQuery),
      needsEvents: /veranstaltung|event|fest|catering|kieler woche/.test(lowerQuery),
      needsGallery: /foto|photo|bild|galerie|gallery|aussehen|look/.test(lowerQuery),
      needsLoyalty: /punkte|points|treue|loyalty|rabatt|discount|qr/.test(lowerQuery),
      needsRestaurantInfo: /öffnung|opening|adresse|address|telefon|phone|parken|parking|zahlung|payment/.test(lowerQuery),
    };
  }

  // Get optimized context based on query
  static async getOptimizedContext(query: string): Promise<string> {
    const contextNeeds = this.analyzeQueryContext(query);
    
    // Always include restaurant info for general queries
    const hasSpecificNeed = Object.values(contextNeeds).some(v => v);
    if (!hasSpecificNeed) {
      // General query - include everything but compact
      return this.getFullContext({ compact: true });
    }

    // Specific query - include only relevant context
    return this.getFullContext({
      includeMenu: contextNeeds.needsMenu,
      includeEvents: contextNeeds.needsEvents,
      includeGallery: contextNeeds.needsGallery,
      includeLoyalty: contextNeeds.needsLoyalty,
      includeRestaurantInfo: true, // Always include basic info
    });
  }

  // Export restaurant config for external use
  static getRestaurantConfig(): RestaurantConfig {
    return { ...RESTAURANT_CONFIG };
  }

  // Update restaurant config (for admin interface in future)
  static updateRestaurantConfig(updates: Partial<RestaurantConfig>): void {
    Object.assign(RESTAURANT_CONFIG, updates);
  }
}

export default ContextManager;