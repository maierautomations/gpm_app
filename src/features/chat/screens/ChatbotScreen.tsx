import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ChatService from '../services/chatServiceWithGemini';
import MessageBubble from '../components/MessageBubble';
import ChatInput from '../components/ChatInput';
import { useUserStore } from '../../../stores/userStore';
import { logger } from '../../../utils/logger';
import { useToast } from '../../../shared/components';
import {
  validateChatMessage,
  checkChatRateLimit,
  getRemainingChatMessages,
  VALIDATION_LIMITS,
} from '../../../utils/validation';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: string;
}

export default function ChatbotScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [language, setLanguage] = useState<'de' | 'en'>('de');
  const flatListRef = useRef<FlatList>(null);

  const user = useUserStore(state => state.user);
  const { showError, showWarning } = useToast();

  useEffect(() => {
    // Load chat history if user is logged in
    if (user) {
      loadChatHistory();
    } else {
      // Add welcome message for guests
      addWelcomeMessage();
    }
  }, [user]);

  const loadChatHistory = async () => {
    if (!user) return;
    
    try {
      const history = await ChatService.getChatHistory(user.id);
      const formattedMessages: Message[] = [];
      
      history.forEach(chat => {
        formattedMessages.push({
          id: `${chat.id}-user`,
          text: chat.message,
          isUser: true,
          timestamp: chat.created_at,
        });
        if (chat.response) {
          formattedMessages.push({
            id: `${chat.id}-assistant`,
            text: chat.response,
            isUser: false,
            timestamp: chat.created_at,
          });
        }
      });
      
      setMessages(formattedMessages);
    } catch (error) {
      logger.error('Error loading chat history:', error);
    }
  };

  const addWelcomeMessage = () => {
    const welcomeText = language === 'de' 
      ? 'Hallo! Ich bin der Assistent von Grill-Partner Maier. Wie kann ich Ihnen helfen?'
      : 'Hello! I\'m the assistant for Grill-Partner Maier. How can I help you?';
    
    setMessages([{
      id: 'welcome',
      text: welcomeText,
      isUser: false,
      timestamp: new Date().toISOString(),
    }]);
  };

  const handleSend = async (messageText: string) => {
    if (!messageText.trim()) return;

    // Validate message
    const validation = validateChatMessage(messageText);
    if (!validation.isValid) {
      showError(validation.error || 'Ungültige Nachricht');
      return;
    }

    // Use sanitized message from validation
    const sanitizedMessage = validation.data!;

    // Check rate limit
    const userId = user?.id || 'guest';
    if (!checkChatRateLimit(userId)) {
      const remaining = getRemainingChatMessages(userId);
      showWarning(
        language === 'de'
          ? `Zu viele Nachrichten. Bitte warten Sie einen Moment. (${remaining}/${VALIDATION_LIMITS.CHAT_RATE_LIMIT_MESSAGES} übrig)`
          : `Too many messages. Please wait a moment. (${remaining}/${VALIDATION_LIMITS.CHAT_RATE_LIMIT_MESSAGES} remaining)`
      );
      return;
    }

    // Detect language from message
    const detectedLang = ChatService.detectLanguage(sanitizedMessage);
    setLanguage(detectedLang);

    // Add user message (using sanitized version)
    const userMessage: Message = {
      id: Date.now().toString(),
      text: sanitizedMessage,
      isUser: true,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    // Prepare for assistant response
    const assistantMessageId = (Date.now() + 1).toString();
    let assistantResponse = '';

    try {
      // If user is not logged in, use a temporary ID
      const userIdForService = user?.id || 'guest-' + Date.now();

      await ChatService.sendMessage(
        sanitizedMessage,
        userIdForService,
        (chunk) => {
          assistantResponse += chunk;
          // Update the assistant message with streaming content
          setMessages(prev => {
            const newMessages = [...prev];
            const existingIndex = newMessages.findIndex(m => m.id === assistantMessageId);

            if (existingIndex >= 0) {
              newMessages[existingIndex].text = assistantResponse;
            } else {
              newMessages.push({
                id: assistantMessageId,
                text: assistantResponse,
                isUser: false,
                timestamp: new Date().toISOString(),
              });
            }

            return newMessages;
          });
        }
      );
    } catch (error) {
      logger.error('Error sending message:', error);
      showError(
        language === 'de'
          ? 'Entschuldigung, es gab einen Fehler. Bitte versuchen Sie es später erneut.'
          : 'Sorry, there was an error. Please try again later.'
      );
      setMessages(prev => [
        ...prev,
        {
          id: assistantMessageId,
          text:
            language === 'de'
              ? 'Entschuldigung, es gab einen Fehler. Bitte versuchen Sie es später erneut.'
              : 'Sorry, there was an error. Please try again later.',
          isUser: false,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsTyping(false);
      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const handleQuickAction = (question: string) => {
    handleSend(question);
  };

  const handleClearChat = () => {
    Alert.alert(
      language === 'de' ? 'Chat löschen' : 'Clear Chat',
      language === 'de' 
        ? 'Möchten Sie den Chat-Verlauf wirklich löschen?'
        : 'Are you sure you want to clear the chat history?',
      [
        {
          text: language === 'de' ? 'Abbrechen' : 'Cancel',
          style: 'cancel',
        },
        {
          text: language === 'de' ? 'Löschen' : 'Clear',
          style: 'destructive',
          onPress: async () => {
            if (user) {
              await ChatService.clearChatHistory(user.id);
            }
            setMessages([]);
            addWelcomeMessage();
          },
        },
      ]
    );
  };

  const quickActions = ChatService.getQuickActions(language);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chat Assistent</Text>
        <TouchableOpacity onPress={handleClearChat} style={styles.clearButton}>
          <Ionicons name="trash-outline" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      {messages.length === 1 && !isTyping && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.quickActionsContainer}
          contentContainerStyle={styles.quickActionsContent}
        >
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={styles.quickActionButton}
              onPress={() => handleQuickAction(action)}
            >
              <Text style={styles.quickActionText}>{action}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <MessageBubble
            message={item.text}
            isUser={item.isUser}
            timestamp={item.timestamp}
          />
        )}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {isTyping && (
        <View style={styles.typingIndicator}>
          <ActivityIndicator size="small" color="#FF0000" />
          <Text style={styles.typingText}>
            {language === 'de' ? 'Assistent tippt...' : 'Assistant is typing...'}
          </Text>
        </View>
      )}

      <ChatInput
        onSend={handleSend}
        disabled={isTyping}
        placeholder={language === 'de' ? 'Nachricht eingeben...' : 'Type a message...'}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  clearButton: {
    padding: 4,
  },
  quickActionsContainer: {
    maxHeight: 50,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  quickActionsContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  quickActionButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
  },
  quickActionText: {
    fontSize: 14,
    color: '#666',
  },
  messagesList: {
    paddingVertical: 16,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'transparent',
  },
  typingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
});