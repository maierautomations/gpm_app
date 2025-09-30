import React, { useState, useEffect } from 'react';
import { logger } from '../../../utils/logger';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  SafeAreaView,
  Alert,
  ScrollView,
  Linking,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import notificationService from '../../../services/notifications/notificationService';
import { useUserStore } from '../../../stores/userStore';
import { NotificationSettings } from '../../../services/notifications/types';

const defaultSettings: NotificationSettings = {
  weeklyOffers: true,
  eventReminders: true,
  appUpdates: false
};

export default function NotificationSettingsScreen({ navigation }: { navigation: any }) {
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [permissionStatus, setPermissionStatus] = useState<string>('undetermined');
  const [notificationHistory, setNotificationHistory] = useState<any[]>([]);
  const user = useUserStore((state) => state.user);

  useEffect(() => {
    loadSettings();
    checkPermissionStatus();
    loadNotificationHistory();
  }, []);

  const loadSettings = async () => {
    try {
      const saved = await AsyncStorage.getItem('notification_settings');
      if (saved) {
        setSettings(JSON.parse(saved));
      }
    } catch (error) {
      logger.error('Error loading notification settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkPermissionStatus = async () => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      setPermissionStatus(status);
    } catch (error) {
      logger.error('Error checking permission status:', error);
    }
  };

  const loadNotificationHistory = async () => {
    if (!user?.id) return;
    
    try {
      const history = await notificationService.getNotificationHistory(user.id);
      setNotificationHistory(history.slice(0, 5)); // Show last 5 notifications
    } catch (error) {
      logger.error('Error loading notification history:', error);
    }
  };

  const saveSettings = async (newSettings: NotificationSettings) => {
    try {
      await AsyncStorage.setItem('notification_settings', JSON.stringify(newSettings));
      setSettings(newSettings);
      
      // Update in notification service
      if (user?.id) {
        await notificationService.updateNotificationSettings(newSettings, user.id);
      }
    } catch (error) {
      logger.error('Error saving notification settings:', error);
      Alert.alert('Fehler', 'Die Einstellungen konnten nicht gespeichert werden.');
    }
  };

  const handleSettingChange = (key: keyof NotificationSettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    saveSettings(newSettings);
  };

  const requestPermissions = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      setPermissionStatus(status);
      
      if (status === 'granted' && user?.id) {
        // Register for push notifications
        await notificationService.registerForPushNotifications(user.id);
        Alert.alert('Erfolg', 'Benachrichtigungen wurden aktiviert!');
      } else if (status === 'denied') {
        Alert.alert(
          'Benachrichtigungen verweigert',
          'Bitte aktivieren Sie Benachrichtigungen in den Geräteeinstellungen.',
          [
            { text: 'Abbrechen', style: 'cancel' },
            { text: 'Einstellungen öffnen', onPress: () => Linking.openSettings() }
          ]
        );
      }
    } catch (error) {
      logger.error('Error requesting permissions:', error);
      Alert.alert('Fehler', 'Benachrichtigungen konnten nicht aktiviert werden.');
    }
  };

  const sendTestNotification = async () => {
    try {
      // Schedule a local notification for testing
      await notificationService.scheduleLocalNotification(
        {
          type: 'custom',
          title: 'Test-Benachrichtigung 🔔',
          body: 'Dies ist eine Test-Benachrichtigung von Grill-Partner Maier!',
          data: { type: 'test' }
        },
        2 // Send after 2 seconds
      );
      
      Alert.alert('Test gesendet', 'Sie erhalten in 2 Sekunden eine Test-Benachrichtigung.');
    } catch (error) {
      logger.error('Error sending test notification:', error);
      Alert.alert('Fehler', 'Test-Benachrichtigung konnte nicht gesendet werden.');
    }
  };

  const getPermissionStatusText = (): { text: string; color: string; icon: keyof typeof Ionicons.glyphMap } => {
    switch (permissionStatus) {
      case 'granted':
        return { text: 'Aktiviert', color: '#4CAF50', icon: 'checkmark-circle' };
      case 'denied':
        return { text: 'Verweigert', color: '#FF0000', icon: 'close-circle' };
      default:
        return { text: 'Nicht konfiguriert', color: '#FFA500', icon: 'alert-circle' };
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Benachrichtigungen</Text>
        </View>
        <View style={styles.centerContainer}>
          <Text>Lädt...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const permissionInfo = getPermissionStatusText();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Benachrichtigungen</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Permission Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Berechtigung</Text>
          <TouchableOpacity 
            style={[styles.permissionCard, { borderColor: permissionInfo.color }]} 
            onPress={permissionStatus !== 'granted' ? requestPermissions : undefined}
          >
            <View style={styles.permissionIcon}>
              <Ionicons name={permissionInfo.icon} size={24} color={permissionInfo.color} />
            </View>
            <View style={styles.permissionText}>
              <Text style={styles.permissionTitle}>Push-Benachrichtigungen</Text>
              <Text style={[styles.permissionStatus, { color: permissionInfo.color }]}>
                Status: {permissionInfo.text}
              </Text>
            </View>
            {permissionStatus !== 'granted' && (
              <Ionicons name="chevron-forward" size={20} color="#999" />
            )}
          </TouchableOpacity>

          {/* Test Notification Button */}
          {permissionStatus === 'granted' && (
            <TouchableOpacity style={styles.testButton} onPress={sendTestNotification}>
              <Ionicons name="send" size={18} color="#fff" />
              <Text style={styles.testButtonText}>Test-Benachrichtigung senden</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Notification Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Benachrichtigungstypen</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Ionicons name="pricetag" size={20} color="#FF0000" />
            </View>
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>Wochenangebote</Text>
              <Text style={styles.settingSubtitle}>
                Jeden Montag um 10:00 Uhr
              </Text>
            </View>
            <Switch
              value={settings.weeklyOffers}
              onValueChange={(value) => handleSettingChange('weeklyOffers', value)}
              trackColor={{ false: '#d3d3d3', true: '#ffcccc' }}
              thumbColor={settings.weeklyOffers ? '#FF0000' : '#f4f3f4'}
              disabled={permissionStatus !== 'granted'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Ionicons name="calendar" size={20} color="#FF0000" />
            </View>
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>Event-Erinnerungen</Text>
              <Text style={styles.settingSubtitle}>
                Einen Tag vor dem Event
              </Text>
            </View>
            <Switch
              value={settings.eventReminders}
              onValueChange={(value) => handleSettingChange('eventReminders', value)}
              trackColor={{ false: '#d3d3d3', true: '#ffcccc' }}
              thumbColor={settings.eventReminders ? '#FF0000' : '#f4f3f4'}
              disabled={permissionStatus !== 'granted'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Ionicons name="phone-portrait" size={20} color="#FF0000" />
            </View>
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>App-Updates</Text>
              <Text style={styles.settingSubtitle}>
                Neue Features und Verbesserungen
              </Text>
            </View>
            <Switch
              value={settings.appUpdates}
              onValueChange={(value) => handleSettingChange('appUpdates', value)}
              trackColor={{ false: '#d3d3d3', true: '#ffcccc' }}
              thumbColor={settings.appUpdates ? '#FF0000' : '#f4f3f4'}
              disabled={permissionStatus !== 'granted'}
            />
          </View>
        </View>

        {/* Recent Notifications */}
        {notificationHistory.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Letzte Benachrichtigungen</Text>
            {notificationHistory.map((notification, index) => (
              <View key={notification.id || index} style={styles.historyItem}>
                <View style={styles.historyIcon}>
                  <Ionicons 
                    name={notification.read ? 'mail-open' : 'mail'} 
                    size={16} 
                    color={notification.read ? '#999' : '#FF0000'} 
                  />
                </View>
                <View style={styles.historyText}>
                  <Text style={styles.historyTitle}>{notification.title}</Text>
                  <Text style={styles.historyBody}>{notification.body}</Text>
                  <Text style={styles.historyDate}>
                    {new Date(notification.sent_at).toLocaleDateString('de-DE')}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Timing Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Benachrichtigungszeiten</Text>
          <Text style={styles.infoText}>
            Benachrichtigungen werden nur während der Öffnungszeiten gesendet 
            (11:00 - 21:00 Uhr), um Sie nicht zu stören.
          </Text>
          
          <View style={styles.timeInfo}>
            <Ionicons name="time" size={16} color="#666" />
            <Text style={styles.timeText}>Montag - Sonntag: 11:00 - 21:00 Uhr</Text>
          </View>
        </View>

        {/* Privacy Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datenschutz</Text>
          <Text style={styles.infoText}>
            Ihre Benachrichtigungseinstellungen werden sicher verschlüsselt gespeichert. 
            Wir respektieren Ihre Privatsphäre und senden nur die von Ihnen gewünschten 
            Benachrichtigungen. Sie können jederzeit alle Benachrichtigungen deaktivieren.
          </Text>
          
          {Platform.OS === 'ios' && (
            <Text style={styles.infoText}>
              {'\n'}Push-Token: {notificationService.getPushToken() ? '✓ Registriert' : '✗ Nicht registriert'}
            </Text>
          )}
        </View>
      </ScrollView>
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
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    backgroundColor: 'white',
    marginTop: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  permissionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
  },
  permissionIcon: {
    marginRight: 16,
  },
  permissionText: {
    flex: 1,
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  permissionStatus: {
    fontSize: 14,
    marginTop: 2,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF0000',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 16,
  },
  testButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingIcon: {
    width: 40,
    alignItems: 'center',
    marginRight: 16,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  historyItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  historyIcon: {
    width: 30,
    alignItems: 'center',
    paddingTop: 2,
  },
  historyText: {
    flex: 1,
    marginLeft: 12,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  historyBody: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  historyDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
    marginBottom: 12,
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  timeText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
});