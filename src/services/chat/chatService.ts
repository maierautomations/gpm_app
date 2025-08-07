import { supabase } from '../supabase/client';
import { Database } from '../supabase/database.types';
import OpenAI from 'openai';

type ChatMessage = Database['public']['Tables']['chat_messages']['Row'];
type ChatMessageInsert = Database['public']['Tables']['chat_messages']['Insert'];

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
});

const SYSTEM_PROMPT_DE = `Du bist der freundliche Assistent von Grill-Partner Maier in Kiel-Dietrichsdorf. 
Das Restaurant existiert seit 1968 und ist ein Familienbetrieb.

Wichtige Informationen:
- Öffnungszeiten: 11:00-22:00 Uhr, 364 Tage im Jahr (nur Heiligabend geschlossen)
- Adresse: Langer Rehm 25, 24149 Kiel-Dietrichsdorf
- Spezialitäten: Traditioneller deutscher Imbiss, Eventgastronomie (Mai-September), Eisspezialitäten
- Parkplätze direkt vor dem Restaurant verfügbar

Antworte freundlich, hilfsbereit und in einem lockeren, aber professionellen Ton. 
Wenn nach der Speisekarte gefragt wird, weise darauf hin, dass diese im Menü-Tab verfügbar ist.`;

const SYSTEM_PROMPT_EN = `You are the friendly assistant for Grill-Partner Maier in Kiel-Dietrichsdorf, Germany.
The restaurant has been a family business since 1968.

Important information:
- Opening hours: 11:00 AM - 10:00 PM, 364 days a year (closed only on Christmas Eve)
- Address: Langer Rehm 25, 24149 Kiel-Dietrichsdorf
- Specialties: Traditional German fast food, event catering (May-September), ice cream specialties
- Parking available directly in front of the restaurant

Respond in a friendly, helpful, and casual but professional tone.
When asked about the menu, point out that it's available in the Menu tab.`;

export class ChatService {
  static detectLanguage(text: string): 'de' | 'en' {
    // Simple language detection based on common words
    const germanWords = ['ich', 'du', 'der', 'die', 'das', 'und', 'ist', 'was', 'wo', 'wann'];
    const englishWords = ['i', 'you', 'the', 'is', 'what', 'where', 'when', 'and', 'how'];
    
    const lowerText = text.toLowerCase();
    const germanCount = germanWords.filter(word => lowerText.includes(word)).length;
    const englishCount = englishWords.filter(word => lowerText.includes(word)).length;
    
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

      // Create streaming completion
      const stream = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        stream: true,
        temperature: 0.7,
        max_tokens: 500,
      });

      let fullResponse = '';
      
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullResponse += content;
          if (onStream) {
            onStream(content);
          }
        }
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
      throw error;
    }
  }

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

  // Get common questions for quick actions
  static getQuickActions(language: 'de' | 'en') {
    if (language === 'de') {
      return [
        'Was sind die Öffnungszeiten?',
        'Wo befindet sich das Restaurant?',
        'Was sind die Spezialitäten?',
        'Gibt es Parkplätze?',
        'Welche Events stehen an?',
      ];
    } else {
      return [
        'What are the opening hours?',
        'Where is the restaurant located?',
        'What are the specialties?',
        'Is parking available?',
        'What events are coming up?',
      ];
    }
  }
}

export default ChatService;