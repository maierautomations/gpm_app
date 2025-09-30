import { supabase } from '../../../services/supabase/client';
import { Database } from '../../../services/supabase/database.types';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { logger } from '../../../utils/logger';

type ChatMessage = Database['public']['Tables']['chat_messages']['Row'];
type NewChatMessage = Database['public']['Tables']['chat_messages']['Insert'];

export class ChatMessageService {
  static async saveMessage(
    userId: string,
    message: string,
    response: string | null,
    language: 'de' | 'en' = 'de'
  ): Promise<ChatMessage | null> {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          user_id: userId,
          message,
          response,
          language
        })
        .select()
        .single();

      if (error) {
        logger.error('Error saving chat message:', error);
        return null;
      }

      return data;
    } catch (error) {
      logger.error('ChatMessageService.saveMessage error:', error);
      return null;
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
        logger.error('Error fetching chat history:', error);
        return [];
      }

      // Return in chronological order for display
      return (data || []).reverse();
    } catch (error) {
      logger.error('ChatMessageService.getChatHistory error:', error);
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
        logger.error('Error clearing chat history:', error);
        return false;
      }

      return true;
    } catch (error) {
      logger.error('ChatMessageService.clearChatHistory error:', error);
      return false;
    }
  }

  static async getRecentMessages(userId: string, hours: number = 24): Promise<ChatMessage[]> {
    try {
      const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', since)
        .order('created_at', { ascending: true });

      if (error) {
        logger.error('Error fetching recent messages:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      logger.error('ChatMessageService.getRecentMessages error:', error);
      return [];
    }
  }

  static subscribeToMessages(userId: string, callback: (payload: RealtimePostgresChangesPayload<ChatMessage>) => void) {
    return supabase
      .channel(`chat-messages-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .subscribe();
  }
}

export default ChatMessageService;