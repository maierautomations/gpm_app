export type NotificationType =
  | 'weekly_offer'
  | 'event_reminder'
  | 'app_update'
  | 'custom';

export interface NotificationSettings {
  weeklyOffers: boolean;
  eventReminders: boolean;
  appUpdates: boolean;
}

export interface DeviceInfo {
  model?: string;
  osName?: string;
  osVersion?: string;
  appVersion?: string;
}

export interface NotificationPayload {
  screen?: string;
  itemId?: string;
  eventId?: string;
  offerId?: string;
  [key: string]: unknown;
}

export interface TargetAudience {
  userIds?: string[];
  allUsers?: boolean;
  testUsers?: boolean;
}

export interface PushToken {
  id?: string;
  user_id: string;
  token: string;
  platform: 'ios' | 'android' | 'web';
  device_info?: DeviceInfo;
  notification_settings?: NotificationSettings;
  created_at?: string;
  updated_at?: string;
}

export interface NotificationData {
  type: NotificationType;
  title: string;
  body: string;
  data?: NotificationPayload;
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
  data?: NotificationPayload;
  sent_at?: string;
  read?: boolean;
  clicked?: boolean;
}

export interface ScheduledNotification {
  id?: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: NotificationPayload;
  scheduled_for: string;
  target_audience?: TargetAudience;
  sent?: boolean;
  created_at?: string;
}