import { supabase } from '../../../services/supabase/client';
import { Database } from '../../../services/supabase/database.types';
import MenuService from '../../menu/services/menuService';
import ChatMessageService from './chatMessageService';

type ChatMessage = Database['public']['Tables']['chat_messages']['Row'];
type ChatMessageInsert = Database['public']['Tables']['chat_messages']['Insert'];

// Restaurant knowledge base (same as before)
const RESTAURANT_INFO = {
  name: 'Grill-Partner Maier',
  established: 1968,
  location: 'Langer Rehm 25, 24149 Kiel-Dietrichsdorf',
  phone: '+49 431 123456',
  hours: '11:00-21:00 Uhr (täglich außer Heiligabend)',
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

const SYSTEM_PROMPT_DE = `Du bist der freundliche Assistent von Grill-Partner Maier in Kiel-Dietrichsdorf. 
Das Restaurant ist ein Familienbetrieb seit 1968.

WICHTIGE INFORMATIONEN:
- Restaurant: ${RESTAURANT_INFO.name}
- Adresse: ${RESTAURANT_INFO.location}
- Öffnungszeiten: ${RESTAURANT_INFO.hours}
- Parkplätze: ${RESTAURANT_INFO.parking}
- Spezialitäten: ${RESTAURANT_INFO.specialties.join(', ')}

VERHALTENSREGELN:
1. Sei immer freundlich, hilfsbereit und professionell
2. Betone die Familientradition und Qualität seit 1968
3. Bei Fragen zur Speisekarte: Verweise auf den Menü-Tab für aktuelle Preise und vollständige Auswahl
4. Bei Allergenen: Betone, dass Infos im Menü verfügbar sind und wir gerne persönlich beraten
5. Bei Events: Erwähne unsere Erfahrung in der Eventgastronomie
6. Verwende lokale Begriffe (z.B. "Moin" als Begrüßung ist okay)

Antworte kurz und präzise, aber warmherzig.`;

const SYSTEM_PROMPT_EN = `You are the friendly assistant for Grill-Partner Maier in Kiel-Dietrichsdorf, Germany.
The restaurant has been a family business since 1968.

IMPORTANT INFORMATION:
- Restaurant: ${RESTAURANT_INFO.name}
- Address: ${RESTAURANT_INFO.location}
- Opening hours: 11:00 AM - 09:00 PM (daily except Christmas Eve)
- Parking: Free parking directly in front of the restaurant
- Specialties: Traditional German fast food, event catering (May-September), ice cream specialties

BEHAVIOR RULES:
1. Always be friendly, helpful, and professional
2. Emphasize the family tradition and quality since 1968
3. For menu questions: Refer to the Menu tab for current prices and full selection
4. For allergens: Mention info is available in the menu and we're happy to advise personally
5. For events: Mention our experience in event catering
6. Keep responses concise but warm

Respond briefly and precisely, but warmly.`;

export class ChatServiceGemini {
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
      const menuContext = await this.getMenuContext();
      const systemPrompt = language === 'de' ? SYSTEM_PROMPT_DE : SYSTEM_PROMPT_EN;
      const fullSystemPrompt = menuContext ? `${systemPrompt}\n\n${menuContext}` : systemPrompt;

      // Google Gemini API (95% cheaper than OpenAI!)
      const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('Gemini API key not configured');
      }

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: fullSystemPrompt + '\n\nUser: ' + message
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500,
          }
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Gemini API error:', error);
        throw new Error('Failed to get response from AI');
      }

      const data = await response.json();
      const fullResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      // Call onStream callback with full response if provided
      if (onStream) {
        onStream(fullResponse);
      }

      // Save to database using ChatMessageService
      await ChatMessageService.saveMessage(
        userId,
        message,
        fullResponse,
        language
      );

      return fullResponse;
    } catch (error) {
      console.error('ChatService.sendMessage error:', error);
      
      // Fallback response
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

  // Use ChatMessageService for all database operations
  static async getChatHistory(userId: string, limit: number = 50): Promise<ChatMessage[]> {
    return ChatMessageService.getChatHistory(userId, limit);
  }

  static async clearChatHistory(userId: string): Promise<boolean> {
    return ChatMessageService.clearChatHistory(userId);
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

// Export as ChatService for compatibility
export { ChatServiceGemini as ChatService };
export default ChatServiceGemini;
