import MenuService from '../../menu/services/menuService';
import { Database } from '../../../services/supabase/database.types';

type MenuItem = Database['public']['Tables']['menu_items']['Row'];
type WeeklyOffer = Database['public']['Tables']['angebotskalender_weeks']['Row'] & {
  angebotskalender_items: Array<{
    special_price: string;
    highlight_badge: string | null;
    menu_item: MenuItem;
  }>;
};

interface EnhancedMenuContext {
  totalItems: number;
  categories: Array<{
    name: string;
    count: number;
    items: Array<{
      id: number;
      name: string;
      price: string;
      allergens: string[];
      subcategory: string | null;
      isSpecialOffer: boolean;
      specialPrice?: string;
      highlight_badge?: string;
    }>;
  }>;
  currentOffers?: {
    theme: string;
    weekNumber: number;
    items: Array<{
      name: string;
      originalPrice: string;
      specialPrice: string;
      savings: string;
      highlight_badge?: string;
    }>;
  };
  restaurantInfo: {
    name: string;
    status: 'open' | 'closed' | 'closing_soon';
    nextStatusChange?: string;
  };
}

export class EnhancedContextProvider {
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

    // Opening hours: 11:00-22:00 daily (except Christmas Eve)
    const isChristmasEve = now.getMonth() === 11 && now.getDate() === 24;

    if (isChristmasEve) {
      return { status: 'closed', nextStatusChange: 'Opens December 25 at 11:00' };
    }

    if (currentHour >= 11 && currentHour < 21) {
      return { status: 'open' };
    } else if (currentHour === 21) {
      return { status: 'closing_soon', nextStatusChange: 'Closes at 22:00' };
    } else {
      const nextOpen = currentHour < 11 ? 'today at 11:00' : 'tomorrow at 11:00';
      return { status: 'closed', nextStatusChange: `Opens ${nextOpen}` };
    }
  }

  static async getEnhancedContext(): Promise<string> {
    try {
      // Get all menu items
      const menuItems = await MenuService.getMenuItems();
      const categories = await MenuService.getCategories();
      const specialOffers = await MenuService.getSpecialOffers();

      if (menuItems.length === 0) {
        return 'FEHLER: Speisekarte kann nicht geladen werden.';
      }

      // Group menu items by category with full details
      const categorizedMenu = categories.map((categoryName) => {
        const categoryItems = menuItems
          .filter((item) => item.category === categoryName)
          .map((item) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            allergens: this.formatAllergens(item.allergens),
            subcategory: item.subcategory,
            isSpecialOffer: false, // Will be updated if in offers
            specialPrice: undefined,
            highlight_badge: undefined,
          }));

        return {
          name: categoryName,
          count: categoryItems.length,
          items: categoryItems,
        };
      });

      // Add special offers information
      let offersContext = '';
      if (specialOffers && specialOffers.angebotskalender_items?.length > 0) {
        const offerItems = specialOffers.angebotskalender_items.map((offerItem: any) => {
          const menuItem = offerItem.menu_item as MenuItem;
          const originalPrice = parseFloat(menuItem.price);
          const specialPrice = parseFloat(offerItem.special_price);
          const savings = (originalPrice - specialPrice).toFixed(2);

          // Mark this item as special offer in categorized menu
          const category = categorizedMenu.find((cat) =>
            cat.items.find((item) => item.id === menuItem.id)
          );
          if (category) {
            const item = category.items.find((item) => item.id === menuItem.id);
            if (item) {
              item.isSpecialOffer = true;
              item.specialPrice = offerItem.special_price;
              item.highlight_badge = offerItem.highlight_badge;
            }
          }

          return {
            name: menuItem.name,
            originalPrice: menuItem.price,
            specialPrice: offerItem.special_price,
            savings,
            highlight_badge: offerItem.highlight_badge,
          };
        });

        offersContext = `
🔥 AKTUELLE WOCHE: ${specialOffers.week_theme} (Woche ${specialOffers.week_number})
SONDERANGEBOTE:
${offerItems
  .map(
    (item: {
      name: string;
      originalPrice: string;
      specialPrice: string;
      savings: string;
      highlight_badge?: string;
    }) =>
      `- ${item.name}: ANGEBOT €${item.specialPrice} (statt €${item.originalPrice}) - SPAR €${item.savings}${item.highlight_badge ? ` [${item.highlight_badge}]` : ''}`
  )
  .join('\n')}

`;
      }

      // Create comprehensive menu context
      const menuContext = categorizedMenu
        .map((category) => {
          const items = category.items
            .map((item) => {
              let itemText = `- ${item.name}: €${parseFloat(item.price).toFixed(2)}`;

              if (item.isSpecialOffer && item.specialPrice) {
                const savings = (parseFloat(item.price) - parseFloat(item.specialPrice)).toFixed(2);
                itemText = `- 🔥 ${item.name}: ANGEBOT €${item.specialPrice} (statt €${item.price}) - SPAR €${savings}${item.highlight_badge ? ` [${item.highlight_badge}]` : ''}`;
              }

              if (item.allergens.length > 0) {
                itemText += ` [Allergene: ${item.allergens.join(', ')}]`;
              }

              if (item.subcategory) {
                itemText += ` (${item.subcategory})`;
              }

              return itemText;
            })
            .join('\n');

          return `${category.name.toUpperCase()} (${category.count} Artikel):\n${items}`;
        })
        .join('\n\n');

      // Restaurant status
      const restaurantStatus = this.getRestaurantStatus();
      const statusText =
        restaurantStatus.status === 'open'
          ? '🟢 GEÖFFNET'
          : restaurantStatus.status === 'closing_soon'
            ? '🟡 SCHLIESST BALD'
            : '🔴 GESCHLOSSEN';

      const statusInfo = restaurantStatus.nextStatusChange
        ? ` (${restaurantStatus.nextStatusChange})`
        : '';

      return `VOLLSTÄNDIGE SPEISEKARTE - Grill-Partner Maier Kiel
Status: ${statusText}${statusInfo}
═══════════════════════════════════════════

${offersContext}ALLE SPEISEN UND GETRÄNKE (${menuItems.length} Artikel total):

${menuContext}

═══════════════════════════════════════════
RESTAURANT INFO:
📍 Adresse: Langer Rehm 25, 24149 Kiel-Dietrichsdorf  
📞 Telefon: +49 431 123456
🕐 Öffnungszeiten: 11:00-22:00 Uhr (täglich außer Heiligabend)
🅿️ Parkplätze: Kostenlos direkt vor dem Restaurant
🍔 Spezialitäten: Traditioneller deutscher Imbiss, Eventgastronomie (Mai-September), Eis-Spezialitäten

WICHTIGE HINWEISE:
- Alle Preise verstehen sich inkl. MwSt.
- Bei Allergien oder Unverträglichkeiten bitte nachfragen
- Eventgastronomie und Catering nach Vereinbarung
- Saisonale Eisspezialitäten verfügbar
- Familienbetrieb seit 1968 - Qualität und Tradition`;
    } catch (error) {
      console.error('Error generating enhanced context:', error);
      return `FEHLER: Kontext kann nicht geladen werden. Bitte wenden Sie sich direkt an das Restaurant.
📞 Telefon: +49 431 123456
📍 Adresse: Langer Rehm 25, 24149 Kiel-Dietrichsdorf`;
    }
  }

  static async getCompactContext(): Promise<string> {
    try {
      const menuItems = await MenuService.getMenuItems();
      const specialOffers = await MenuService.getSpecialOffers();

      // Compact version with just highlights
      let context = `Grill-Partner Maier - ${menuItems.length} Speisen verfügbar\n`;

      if (specialOffers && specialOffers.angebotskalender_items?.length > 0) {
        context += `🔥 ${specialOffers.week_theme}: `;
        context += specialOffers.angebotskalender_items
          .map(
            (item: { menu_item: MenuItem; special_price: string }) =>
              `${item.menu_item.name} €${item.special_price}`
          )
          .join(', ');
        context += '\n';
      }

      const restaurantStatus = this.getRestaurantStatus();
      const statusEmoji =
        restaurantStatus.status === 'open'
          ? '🟢'
          : restaurantStatus.status === 'closing_soon'
            ? '🟡'
            : '🔴';
      context += `Status: ${statusEmoji} ${restaurantStatus.status.toUpperCase()}`;

      return context;
    } catch (error) {
      return 'Restaurant info: Grill-Partner Maier, Kiel-Dietrichsdorf';
    }
  }
}

export default EnhancedContextProvider;
