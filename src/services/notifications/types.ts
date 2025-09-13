export type NotificationType = 
  | 'weekly_offer' 
  | 'event_reminder' 
  | 'points_earned' 
  | 'app_update' 
  | 'custom';

export interface NotificationSettings {
  weeklyOffers: boolean;
  eventReminders: boolean;
  pointsEarned: boolean;
  appUpdates: boolean;
}

export interface PushToken {
  id?: string;
  user_id: string;
  token: string;
  platform: 'ios' | 'android' | 'web';
  device_info?: any;
  notification_settings?: NotificationSettings;
  created_at?: string;
  updated_at?: string;
}

export interface NotificationData {
  type: NotificationType;
  title: string;
  body: string;
  data?: any;
  image_url?: string;
  badge?: number;
  sound?: string;
  channelId?: string;
}

export interface NotificationHistory {
  id?: string;
  user_id?: string;
  type?: NotificationType;
  title: string;
  body: string;
  data?: any;
  sent_at?: string;
  read?: boolean;
  clicked?: boolean;
}

export interface ScheduledNotification {
  id?: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: any;
  scheduled_for: string;
  target_audience?: any;
  sent?: boolean;
  created_at?: string;
}