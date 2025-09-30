import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabase/client';
import {
  NotificationSettings,
  PushToken,
  NotificationData,
  NotificationHistory,
  NotificationType
} from './types';
import { logger } from '../../utils/logger';

class NotificationService {
  private static instance: NotificationService;
  private pushToken: string | null = null;
  private notificationListener: any = null;
  private responseListener: any = null;

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async initialize(userId: string | null) {
    if (!userId) return;

    // Set notification handler
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    // Register for push notifications
    await this.registerForPushNotifications(userId);

    // Set up notification listeners
    this.setupNotificationListeners();
  }

  async registerForPushNotifications(userId: string): Promise<string | null> {
    try {
      // Check if we're on a physical device
      if (!Device.isDevice) {
        logger.log('Push notifications only work on physical devices');
        return null;
      }

      // Get existing permission status
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Request permission if not already granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        logger.log('Failed to get push token for push notification!');
        return null;
      }

      // Get the token
      const projectId = process.env.EXPO_PUBLIC_PROJECT_ID;
      if (!projectId) {
        logger.error('EXPO_PUBLIC_PROJECT_ID not found in environment variables');
        throw new Error('Project ID not configured. Please set EXPO_PUBLIC_PROJECT_ID in your .env.local file.');
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: projectId
      });
      
      const token = tokenData.data;
      this.pushToken = token;

      // Configure notification channel for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF0000',
        });
      }

      // Save token to Supabase
      await this.savePushToken(userId, token);

      return token;
    } catch (error) {
      logger.error('Error registering for push notifications:', error);
      return null;
    }
  }

  private async savePushToken(userId: string, token: string) {
    try {
      const platform = Platform.OS as 'ios' | 'android';
      
      // Get existing notification settings from AsyncStorage
      const savedSettings = await AsyncStorage.getItem('notification_settings');
      const settings = savedSettings ? JSON.parse(savedSettings) : {
        weeklyOffers: true,
        eventReminders: true,
        appUpdates: false
      };

      // Upsert the token (update if exists, insert if not)
      const { error } = await supabase
        .from('push_tokens')
        .upsert({
          user_id: userId,
          token,
          platform,
          device_info: {
            brand: Device.brand,
            modelName: Device.modelName,
            osVersion: Device.osVersion,
          },
          notification_settings: settings,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'token'
        });

      if (error) {
        logger.error('Error saving push token:', error);
      } else {
        logger.log('Push token saved successfully');
      }
    } catch (error) {
      logger.error('Error in savePushToken:', error);
    }
  }

  private setupNotificationListeners() {
    // Handle notifications when app is in foreground
    this.notificationListener = Notifications.addNotificationReceivedListener(
      notification => {
        logger.log('Notification received:', notification);
        this.handleNotificationReceived(notification);
      }
    );

    // Handle notification responses (when user taps on notification)
    this.responseListener = Notifications.addNotificationResponseReceivedListener(
      response => {
        logger.log('Notification response:', response);
        this.handleNotificationResponse(response);
      }
    );
  }

  private async handleNotificationReceived(notification: Notifications.Notification) {
    // You can update UI, badges, or perform other actions
    // when a notification is received while app is in foreground
    const { title, body, data } = notification.request.content;
    
    // Optionally save to history
    if (data?.userId) {
      await this.saveToHistory({
        user_id: data.userId,
        type: data.type || 'custom',
        title: title || '',
        body: body || '',
        data: data
      });
    }
  }

  private async handleNotificationResponse(response: Notifications.NotificationResponse) {
    const { data } = response.notification.request.content;
    
    // Mark as clicked in history
    if (data?.historyId) {
      await supabase
        .from('notification_history')
        .update({ clicked: true })
        .eq('id', data.historyId);
    }

    // Navigate based on notification type
    this.navigateBasedOnNotification(data);
  }

  private navigateBasedOnNotification(data: NotificationPayload) {
    if (!data) return;

    // This will be handled in App.tsx or navigation context
    // Emit an event or use a navigation ref
    switch (data.type) {
      case 'weekly_offer':
        // Navigate to offers screen
        break;
      case 'event_reminder':
        // Navigate to events screen
        break;
      default:
        // Default navigation
        break;
    }
  }

  async updateNotificationSettings(settings: NotificationSettings, userId: string) {
    try {
      // Save to AsyncStorage
      await AsyncStorage.setItem('notification_settings', JSON.stringify(settings));

      // Update in Supabase if we have a token
      if (this.pushToken && userId) {
        const { error } = await supabase
          .from('push_tokens')
          .update({ 
            notification_settings: settings,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .eq('token', this.pushToken);

        if (error) {
          logger.error('Error updating notification settings:', error);
        }
      }
    } catch (error) {
      logger.error('Error in updateNotificationSettings:', error);
    }
  }

  async getNotificationHistory(userId: string): Promise<NotificationHistory[]> {
    try {
      const { data, error } = await supabase
        .from('notification_history')
        .select('*')
        .eq('user_id', userId)
        .order('sent_at', { ascending: false })
        .limit(50);

      if (error) {
        logger.error('Error fetching notification history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      logger.error('Error in getNotificationHistory:', error);
      return [];
    }
  }

  async markNotificationAsRead(notificationId: string) {
    try {
      const { error } = await supabase
        .from('notification_history')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) {
        logger.error('Error marking notification as read:', error);
      }
    } catch (error) {
      logger.error('Error in markNotificationAsRead:', error);
    }
  }

  private async saveToHistory(notification: Partial<NotificationHistory>) {
    try {
      const { error } = await supabase
        .from('notification_history')
        .insert(notification);

      if (error) {
        logger.error('Error saving to notification history:', error);
      }
    } catch (error) {
      logger.error('Error in saveToHistory:', error);
    }
  }

  async scheduleLocalNotification(data: NotificationData, trigger: Date | number) {
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: data.title,
          body: data.body,
          data: data.data,
          badge: data.badge,
          sound: data.sound || 'default',
        },
        trigger: trigger instanceof Date ? { date: trigger } : { seconds: trigger },
      });

      return id;
    } catch (error) {
      logger.error('Error scheduling notification:', error);
      return null;
    }
  }

  async cancelScheduledNotification(notificationId: string) {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      logger.error('Error canceling notification:', error);
    }
  }

  async cancelAllScheduledNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      logger.error('Error canceling all notifications:', error);
    }
  }

  getPushToken(): string | null {
    return this.pushToken;
  }

  cleanup() {
    if (this.notificationListener) {
      this.notificationListener.remove();
      this.notificationListener = null;
    }
    if (this.responseListener) {
      this.responseListener.remove();
      this.responseListener = null;
    }
  }
}

export default NotificationService.getInstance();