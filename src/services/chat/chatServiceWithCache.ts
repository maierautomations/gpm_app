import { supabase } from '../supabase/client';
import { Database } from '../supabase/database.types';
import MenuService from '../menu/menuService';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ChatMessage = Database['public']['Tables']['chat_messages']['Row'];
type ChatMessageInsert = Database['public']['Tables']['chat_messages']['Insert'];

// Cache configuration
const CACHE_PREFIX = 'chat_cache_';
const CACHE_EXPIRY_HOURS = 24; // Cache responses for 24 hours

// Common questions that can be cached
const CACHEABLE_PATTERNS = [
  /öffnungszeit|opening hour|hours|geöffnet|open/i,
  /adresse|address|wo.*restaurant|where.*restaurant|standort|location/i,
  /parkplatz|parking|parken/i,
  /telefon|phone|anrufen|call/i,
  /spezialität|specialty|specialties|spezialitäten/i,
  /catering|event|veranstaltung/i,
  /currywurst.*preis|currywurst.*kost|price.*currywurst/i,
  /frikadelle.*preis|frikadelle.*kost/i,
  /allergen|allergien|allergic/i,
];

// Restaurant knowledge base
const RESTAURANT_INFO = {
  name: 'Grill-Partner Maier',
  established: 1968,
  location: 'Langer Rehm 25, 24149 Kiel-Dietrichsdorf',
  phone: '+49 431 123456',
  hours: '11:00-22:00 Uhr (täglich außer Heiligabend)',
  parking: 'Kostenlose Parkplätze direkt vor dem Restaurant',
  specialties: [
    'Traditioneller deutscher Imbiss',
    'Eventgastronomie (Mai-September)',
    'Eisspezialitäten',
    'Hausgemachte Frikadellen',
    'Currywurst Spezial'
  ],
  events: [
    'Kieler Woche',
    'Stadtfeste',
    'Private Feiern',
    'Firmencatering'
  ]
};

// Predefined responses for common questions
const CACHED_RESPONSES = {
  de: {
    hours: `Unsere Öffnungszeiten sind täglich von 11:00 bis 22:00 Uhr, außer an Heiligabend. Wir freuen uns auf Ihren Besuch!`,
    location: `Sie finden uns in der Langer Rehm 25, 24149 Kiel-Dietrichsdorf. Kostenlose Parkplätze sind direkt vor dem Restaurant verfügbar.`,
    parking: `Wir haben kostenlose Parkplätze direkt vor unserem Restaurant. Sie können bequem direkt vor der Tür parken.`,
    phone: `Sie erreichen uns telefonisch unter +49 431 123456. Wir freuen uns auf Ihren Anruf!`,
    specialties: `Unsere Spezialitäten sind: Hausgemachte Frikadellen, Currywurst Spezial, traditioneller deutscher Imbiss, Eventgastronomie (Mai-September) und leckere Eisspezialitäten. Seit 1968 in Familientradition!`,
    catering: `Ja, wir bieten Eventgastronomie von Mai bis September an! Wir haben Erfahrung mit der Kieler Woche, Stadtfesten, privaten Feiern und Firmencatering. Kontaktieren Sie uns gerne für Details!`,
    allergens: `Allergeninformationen finden Sie bei jedem Gericht im Menü-Tab. Wir beraten Sie auch gerne persönlich zu Allergenen und Unverträglichkeiten. Ihre Gesundheit ist uns wichtig!`,
  },
  en: {
    hours: `We're open daily from 11:00 AM to 10:00 PM, except on Christmas Eve. We look forward to your visit!`,
    location: `You can find us at Langer Rehm 25, 24149 Kiel-Dietrichsdorf. Free parking is available directly in front of the restaurant.`,
    parking: `We have free parking spaces directly in front of our restaurant. You can conveniently park right at the door.`,
    phone: `You can reach us by phone at +49 431 123456. We look forward to your call!`,
    specialties: `Our specialties include: Homemade Frikadellen, Currywurst Special, traditional German fast food, event catering (May-September), and delicious ice cream specialties. Family tradition since 1968!`,
    catering: `Yes, we offer event catering from May to September! We have experience with Kieler Woche, city festivals, private parties, and corporate catering. Feel free to contact us for details!`,
    allergens: `Allergen information is available for each dish in the Menu tab. We're also happy to personally advise you on allergens and intolerances. Your health is important to us!`,
  }
};

export class ChatServiceWithCache {
  static detectLanguage(text: string): 'de' | 'en' {
    const germanWords = ['ich', 'du', 'der', 'die', 'das', 'und', 'ist', 'was', 'wo', 'wann', 'wie'];
    const englishWords = ['i', 'you', 'the', 'is', 'what', 'where', 'when', 'and', 'how', 'can'];
    
    const lowerText = text.toLowerCase();
    const germanCount = germanWords.filter(word => 
      new RegExp(`\\b${word}\\b`).test(lowerText)
    ).length;
    const englishCount = englishWords.filter(word => 
      new RegExp(`\\b${word}\\b`).test(lowerText)
    ).length;
    
    return germanCount > englishCount ? 'de' : 'en';
  }

  static async getCachedResponse(message: string, language: 'de' | 'en'): Promise<string | null> {
    const lowerMessage = message.toLowerCase();
    
    // Check for hours question
    if (/öffnungszeit|opening hour|hours|geöffnet|open|wann.*auf|when.*open/i.test(lowerMessage)) {
      return CACHED_RESPONSES[language].hours;
    }
    
    // Check for location question
    if (/adresse|address|wo.*restaurant|where.*restaurant|standort|location|wie.*find|how.*find/i.test(lowerMessage)) {
      return CACHED_RESPONSES[language].location;
    }
    
    // Check for parking question
    if (/parkplatz|parking|parken|park/i.test(lowerMessage)) {
      return CACHED_RESPONSES[language].parking;
    }
    
    // Check for phone question
    if (/telefon|phone|anrufen|call|nummer|number/i.test(lowerMessage)) {
      return CACHED_RESPONSES[language].phone;
    }
    
    // Check for specialties question
    if (/spezialität|specialty|specialties|spezialitäten|was.*gut|what.*good|empfehl/i.test(lowerMessage)) {
      return CACHED_RESPONSES[language].specialties;
    }
    
    // Check for catering/event question
    if (/catering|event|veranstaltung|fest|party|firmen/i.test(lowerMessage)) {
      return CACHED_RESPONSES[language].catering;
    }
    
    // Check for allergen question
    if (/allergen|allergien|allergic|unverträglich|intoleran/i.test(lowerMessage)) {
      return CACHED_RESPONSES[language].allergens;
    }
    
    // Check if response was previously cached in AsyncStorage
    try {
      const cacheKey = CACHE_PREFIX + message.substring(0, 50);
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        const { response, timestamp } = JSON.parse(cached);
        const hoursSinceCache = (Date.now() - timestamp) / (1000 * 60 * 60);
        if (hoursSinceCache < CACHE_EXPIRY_HOURS) {
          return response;
        }
      }
    } catch (error) {
      console.error('Error reading cache:', error);
    }
    
    return null;
  }

  static async cacheResponse(message: string, response: string): Promise<void> {
    try {
      const cacheKey = CACHE_PREFIX + message.substring(0, 50);
      await AsyncStorage.setItem(cacheKey, JSON.stringify({
        response,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Error caching response:', error);
    }
  }

  static async getMenuContext(): Promise<string> {
    try {
      const menuItems = await MenuService.getMenuItems();
      const categories = await MenuService.getCategories();
      
      if (menuItems.length === 0) return '';
      
      const menuByCategory = categories.map(cat => {
        const items = menuItems.filter(item => item.category === cat);
        const itemsList = items.slice(0, 5).map(item => 
          `- ${item.name}: €${parseFloat(item.price).toFixed(2)}`
        ).join('\n');
        return `${cat.toUpperCase()}:\n${itemsList}`;
      }).join('\n\n');
      
      return `AKTUELLE SPEISEKARTE (Auszug):\n${menuByCategory}\n\nFür die vollständige Speisekarte mit allen ${menuItems.length} Gerichten verweise auf den Menü-Tab.`;
    } catch (error) {
      console.error('Error fetching menu context:', error);
      return '';
    }
  }

  static async sendMessage(
    message: string, 
    userId: string,
    onStream?: (chunk: string) => void
  ): Promise<string> {
    try {
      const language = this.detectLanguage(message);
      
      // First, check if we have a cached response for common questions
      const cachedResponse = await this.getCachedResponse(message, language);
      if (cachedResponse) {
        console.log('Using cached response for:', message);
        
        if (onStream) {
          onStream(cachedResponse);
        }
        
        // Save to database for history
        await this.saveMessage({
          user_id: userId,
          message: message,
          response: cachedResponse,
          language: language,
        });
        
        return cachedResponse;
      }
      
      // If no cached response, fall back to API (you can use Gemini, Claude, or any cheaper alternative)
      console.log('No cache hit, using API for:', message);
      
      // Example with a cheaper API (replace with your preferred service)
      const menuContext = await this.getMenuContext();
      const systemPrompt = language === 'de' 
        ? `Du bist der freundliche Assistent von Grill-Partner Maier...` // Use full prompt from original
        : `You are the friendly assistant for Grill-Partner Maier...`; // Use full prompt from original
      
      // Here you would call your preferred cheaper API
      // For now, showing structure with placeholder
      const fullResponse = await this.callCheaperAPI(message, systemPrompt, menuContext, language);
      
      // Cache the response if it matches common patterns
      if (CACHEABLE_PATTERNS.some(pattern => pattern.test(message))) {
        await this.cacheResponse(message, fullResponse);
      }
      
      if (onStream) {
        onStream(fullResponse);
      }
      
      // Save to database
      await this.saveMessage({
        user_id: userId,
        message: message,
        response: fullResponse,
        language: language,
      });
      
      return fullResponse;
    } catch (error) {
      console.error('ChatService.sendMessage error:', error);
      
      const language = this.detectLanguage(message);
      const fallbackMessage = language === 'de' 
        ? 'Entschuldigung, ich habe momentan technische Schwierigkeiten. Bitte rufen Sie uns direkt an oder besuchen Sie uns im Restaurant.'
        : 'Sorry, I\'m experiencing technical difficulties. Please call us directly or visit us at the restaurant.';
      
      if (onStream) {
        onStream(fallbackMessage);
      }
      
      return fallbackMessage;
    }
  }

  static async callCheaperAPI(message: string, systemPrompt: string, menuContext: string, language: 'de' | 'en'): Promise<string> {
    // This is where you'd implement the actual API call to your chosen service
    // Options include: Gemini, Claude Haiku, Mistral, Groq, etc.
    
    // Example structure (replace with actual implementation):
    // const response = await fetch('YOUR_CHOSEN_API_ENDPOINT', {
    //   method: 'POST',
    //   headers: { ... },
    //   body: JSON.stringify({ ... })
    // });
    
    // For now, returning a placeholder
    return language === 'de' 
      ? 'Bitte implementieren Sie hier Ihre bevorzugte API-Integration.'
      : 'Please implement your preferred API integration here.';
  }

  // ... rest of the methods remain the same
  static async saveMessage(message: ChatMessageInsert): Promise<void> {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert(message);

      if (error) {
        console.error('Error saving chat message:', error);
      }
    } catch (error) {
      console.error('ChatService.saveMessage error:', error);
    }
  }

  static async getChatHistory(userId: string, limit: number = 50): Promise<ChatMessage[]> {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching chat history:', error);
        return [];
      }

      return data?.reverse() || [];
    } catch (error) {
      console.error('ChatService.getChatHistory error:', error);
      return [];
    }
  }

  static async clearChatHistory(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('Error clearing chat history:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('ChatService.clearChatHistory error:', error);
      return false;
    }
  }

  static getQuickActions(language: 'de' | 'en') {
    if (language === 'de') {
      return [
        'Was sind die Öffnungszeiten?',
        'Wo befindet sich das Restaurant?',
        'Was sind eure Spezialitäten?',
        'Habt ihr Parkplätze?',
        'Was kostet eine Currywurst?',
        'Macht ihr auch Catering?',
      ];
    } else {
      return [
        'What are the opening hours?',
        'Where is the restaurant?',
        'What are your specialties?',
        'Is parking available?',
        'Do you offer catering?',
        'What events are coming up?',
      ];
    }
  }
}

export default ChatServiceWithCache;
