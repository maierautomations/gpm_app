import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText, generateText } from 'ai';
import { Database } from '../../../services/supabase/database.types';
import ChatMessageService from './chatMessageService';
import EnhancedContextProvider from './enhancedContextProvider';
import { logger } from '../../../utils/logger';

type ChatMessage = Database['public']['Tables']['chat_messages']['Row'];

// Restaurant knowledge base - core static information
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
    'Eis-Spezialitäten',
    'Hausgemachte Frikadellen',
    'Currywurst Spezial',
  ],
  services: [
    'Kieler Woche Catering',
    'Stadtfeste',
    'Private Feiern',
    'Firmencatering',
    'Eisverkauf',
  ],
};

const SYSTEM_PROMPT_DE = `Du bist der freundliche und kompetente AI-Assistent von Grill-Partner Maier in Kiel-Dietrichsdorf. 

ÜBER DAS RESTAURANT:
- Familienbetrieb seit ${RESTAURANT_INFO.established} (über 55 Jahre Erfahrung!)
- Adresse: ${RESTAURANT_INFO.location}
- Telefon: ${RESTAURANT_INFO.phone}
- Öffnungszeiten: ${RESTAURANT_INFO.hours}
- Spezialitäten: ${RESTAURANT_INFO.specialties.join(', ')}

DEINE AUFGABEN:
1. 🍔 SPEISEKARTE: Beantworte alle Fragen zu Gerichten, Preisen und Allergenen detailliert
2. 🔥 ANGEBOTE: Informiere über aktuelle Wochenangebote mit exakten Preisen und Ersparnissen
3. 🏪 RESTAURANT: Gib Auskunft zu Öffnungszeiten, Standort, Parkplätzen
4. 🎉 CATERING: Berate zu Eventgastronomie und Catering-Möglichkeiten
5. 🍦 EIS: Informiere über saisonale Eis-Spezialitäten

VERHALTEN:
- Sei warmherzig und stolz auf die Familientradition seit 1968
- Verwende "Moin" als norddeutsche Begrüßung
- Betone Qualität, Frische und faire Preise
- Bei Allergenfragen: Weise auf verfügbare Infos hin und empfiehl persönliche Beratung
- Bei Catering: Erwähne langjährige Erfahrung bei Kieler Woche und anderen Events
- Formatiere Preise immer als €X.XX

Du hast Zugriff auf die KOMPLETTE aktuelle Speisekarte mit allen 125+ Gerichten, aktuellen Angeboten und Restaurantinformationen.`;

const SYSTEM_PROMPT_EN = `You are the friendly and knowledgeable AI assistant for Grill-Partner Maier in Kiel-Dietrichsdorf, Germany.

ABOUT THE RESTAURANT:
- Family business since ${RESTAURANT_INFO.established} (over 55 years of experience!)
- Address: ${RESTAURANT_INFO.location}
- Phone: ${RESTAURANT_INFO.phone}
- Hours: 11:00 AM - 10:00 PM (daily except Christmas Eve)
- Specialties: Traditional German fast food, event catering (May-September), ice cream specialties

YOUR TASKS:
1. 🍔 MENU: Answer all questions about dishes, prices, and allergens in detail
2. 🔥 OFFERS: Inform about current weekly specials with exact prices and savings
3. 🏪 RESTAURANT: Provide information about hours, location, parking
4. 🎉 CATERING: Advise on event catering and catering options
5. 🍦 ICE CREAM: Inform about seasonal ice cream specialties

BEHAVIOR:
- Be warm and proud of the family tradition since 1968
- Emphasize quality, freshness, and fair prices
- For allergen questions: Point to available info and recommend personal consultation
- For catering: Mention long experience at Kieler Woche and other events
- Always format prices as €X.XX

You have access to the COMPLETE current menu with all 125+ dishes, current offers, and restaurant information.`;

export class ChatServiceWithAISDK {
  private static google = createGoogleGenerativeAI({
    apiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY,
  });
  
  private static model = this.google('gemini-1.5-flash');

  static detectLanguage(text: string): 'de' | 'en' {
    const germanWords = [
      'ich',
      'du',
      'der',
      'die',
      'das',
      'und',
      'ist',
      'was',
      'wo',
      'wann',
      'wie',
      'speisekarte',
      'öffnungszeiten',
      'angebot',
    ];
    const englishWords = [
      'i',
      'you',
      'the',
      'is',
      'what',
      'where',
      'when',
      'and',
      'how',
      'can',
      'menu',
      'hours',
      'offer',
    ];

    const lowerText = text.toLowerCase();
    const germanCount = germanWords.filter((word) =>
      new RegExp(`\\b${word}\\b`).test(lowerText)
    ).length;
    const englishCount = englishWords.filter((word) =>
      new RegExp(`\\b${word}\\b`).test(lowerText)
    ).length;

    return germanCount > englishCount ? 'de' : 'en';
  }

  static async sendMessage(
    message: string,
    userId: string,
    onStream?: (chunk: string) => void
  ): Promise<string> {
    try {
      const language = this.detectLanguage(message);
      const systemPrompt = language === 'de' ? SYSTEM_PROMPT_DE : SYSTEM_PROMPT_EN;

      // Get enhanced context with full menu data
      const menuContext = await EnhancedContextProvider.getEnhancedContext();
      const fullSystemPrompt = `${systemPrompt}\n\n${menuContext}`;

      if (onStream) {
        // Streaming implementation
        const result = await streamText({
          model: this.model,
          messages: [
            { role: 'system', content: fullSystemPrompt },
            { role: 'user', content: message },
          ],
          temperature: 0.7,
          maxOutputTokens: 500,
        });

        let fullResponse = '';

        // Process the stream
        for await (const chunk of result.textStream) {
          fullResponse += chunk;
          onStream(chunk);
        }

        // Save complete response to database
        await ChatMessageService.saveMessage(userId, message, fullResponse, language);

        return fullResponse;
      } else {
        // Non-streaming implementation (fallback)
        const result = await generateText({
          model: this.model,
          messages: [
            { role: 'system', content: fullSystemPrompt },
            { role: 'user', content: message },
          ],
          temperature: 0.7,
          maxOutputTokens: 500,
        });

        const response = result.text;

        // Save to database
        await ChatMessageService.saveMessage(userId, message, response, language);

        return response;
      }
    } catch (error) {
      logger.error('ChatServiceWithAISDK.sendMessage error:', error);

      // Fallback response
      const language = this.detectLanguage(message);
      const fallbackMessage =
        language === 'de'
          ? 'Entschuldigung, ich habe momentan technische Schwierigkeiten. Bitte rufen Sie uns direkt an unter +49 431 123456 oder besuchen Sie uns im Restaurant.'
          : "Sorry, I'm experiencing technical difficulties. Please call us directly at +49 431 123456 or visit us at the restaurant.";

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
        'Was sind eure Spezialitäten?',
        'Welche Angebote gibt es diese Woche?',
        'Wie sind die Öffnungszeiten?',
        'Wo kann ich parken?',
        'Was kostet eine Currywurst?',
        'Macht ihr auch Catering?',
        'Welche Eisspezialitäten habt ihr?',
        'Wo befindet sich das Restaurant?',
      ];
    } else {
      return [
        'What are your specialties?',
        'What offers do you have this week?',
        'What are the opening hours?',
        'Where can I park?',
        'Do you offer catering?',
        'What ice cream specialties do you have?',
        'Where is the restaurant located?',
        'What events are coming up?',
      ];
    }
  }

  // Enhanced features for better user experience
  static async getRestaurantSummary(language: 'de' | 'en'): Promise<string> {
    try {
      const context = await EnhancedContextProvider.getCompactContext();

      const prompt =
        language === 'de'
          ? 'Gib eine kurze Zusammenfassung des Restaurants mit den wichtigsten Infos.'
          : 'Give a brief summary of the restaurant with the most important information.';

      const result = await generateText({
        model: this.model,
        messages: [
          { role: 'system', content: language === 'de' ? SYSTEM_PROMPT_DE : SYSTEM_PROMPT_EN },
          { role: 'system', content: context },
          { role: 'user', content: prompt },
        ],
        temperature: 0.5,
        maxOutputTokens: 200,
      });

      return result.text;
    } catch (error) {
      logger.error('Error getting restaurant summary:', error);
      return language === 'de'
        ? 'Grill-Partner Maier - Familienbetrieb seit 1968 in Kiel-Dietrichsdorf. Traditioneller Imbiss, Catering und Eis-Spezialitäten.'
        : 'Grill-Partner Maier - Family business since 1968 in Kiel-Dietrichsdorf. Traditional fast food, catering and ice cream specialties.';
    }
  }
}

// Export with same name for compatibility
export { ChatServiceWithAISDK as ChatService };
export default ChatServiceWithAISDK;
