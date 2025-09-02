import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  SafeAreaView,
  Alert,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

type NotificationSettings = {
  weeklyOffers: boolean;
  eventReminders: boolean;
  pointsEarned: boolean;
  appUpdates: boolean;
};

const defaultSettings: NotificationSettings = {
  weeklyOffers: true,
  eventReminders: true,
  pointsEarned: true,
  appUpdates: false
};

export default function NotificationSettingsScreen({ navigation }: { navigation: any }) {
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const saved = await AsyncStorage.getItem('notification_settings');
      if (saved) {
        setSettings(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (newSettings: NotificationSettings) => {
    try {
      await AsyncStorage.setItem('notification_settings', JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving notification settings:', error);
      Alert.alert('Fehler', 'Die Einstellungen konnten nicht gespeichert werden.');
    }
  };

  const handleSettingChange = (key: keyof NotificationSettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    saveSettings(newSettings);
  };

  const requestPermissions = () => {
    Alert.alert(
      'Benachrichtigungen aktivieren',
      'Um Ihnen Benachrichtigungen senden zu können, müssen Sie diese in den Geräteeinstellungen aktivieren.',
      [
        { text: 'Später', style: 'cancel' },
        { 
          text: 'Einstellungen öffnen', 
          onPress: () => {
            // In a real app, you would use Linking.openSettings() or expo-notifications
            Alert.alert('Info', 'Diese Funktion wird in einer zukünftigen Version verfügbar sein.');
          }
        }
      ]
    );
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
          <TouchableOpacity style={styles.permissionCard} onPress={requestPermissions}>
            <View style={styles.permissionIcon}>
              <Ionicons name="notifications" size={24} color="#FF0000" />
            </View>
            <View style={styles.permissionText}>
              <Text style={styles.permissionTitle}>Push-Benachrichtigungen</Text>
              <Text style={styles.permissionSubtitle}>
                Aktivieren Sie Benachrichtigungen in den Geräteeinstellungen
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
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
                Neue Angebote und Aktionen der Woche
              </Text>
            </View>
            <Switch
              value={settings.weeklyOffers}
              onValueChange={(value) => handleSettingChange('weeklyOffers', value)}
              trackColor={{ false: '#d3d3d3', true: '#ffcccc' }}
              thumbColor={settings.weeklyOffers ? '#FF0000' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Ionicons name="calendar" size={20} color="#FF0000" />
            </View>
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>Event-Erinnerungen</Text>
              <Text style={styles.settingSubtitle}>
                Erinnerungen für bevorstehende Veranstaltungen
              </Text>
            </View>
            <Switch
              value={settings.eventReminders}
              onValueChange={(value) => handleSettingChange('eventReminders', value)}
              trackColor={{ false: '#d3d3d3', true: '#ffcccc' }}
              thumbColor={settings.eventReminders ? '#FF0000' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Ionicons name="star" size={20} color="#FF0000" />
            </View>
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>Treuepunkte</Text>
              <Text style={styles.settingSubtitle}>
                Benachrichtigung bei Punktestand-Änderungen
              </Text>
            </View>
            <Switch
              value={settings.pointsEarned}
              onValueChange={(value) => handleSettingChange('pointsEarned', value)}
              trackColor={{ false: '#d3d3d3', true: '#ffcccc' }}
              thumbColor={settings.pointsEarned ? '#FF0000' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Ionicons name="phone-portrait" size={20} color="#FF0000" />
            </View>
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>App-Updates</Text>
              <Text style={styles.settingSubtitle}>
                Informationen über neue Features und Updates
              </Text>
            </View>
            <Switch
              value={settings.appUpdates}
              onValueChange={(value) => handleSettingChange('appUpdates', value)}
              trackColor={{ false: '#d3d3d3', true: '#ffcccc' }}
              thumbColor={settings.appUpdates ? '#FF0000' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Timing Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Benachrichtigungszeiten</Text>
          <Text style={styles.infoText}>
            Benachrichtigungen werden nur während der Öffnungszeiten gesendet 
            (11:00 - 22:00 Uhr), um Sie nicht zu stören.
          </Text>
          
          <View style={styles.timeInfo}>
            <Ionicons name="time" size={16} color="#666" />
            <Text style={styles.timeText}>Montag - Sonntag: 11:00 - 22:00 Uhr</Text>
          </View>
        </View>

        {/* Privacy Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datenschutz</Text>
          <Text style={styles.infoText}>
            Ihre Benachrichtigungseinstellungen werden nur lokal auf Ihrem Gerät 
            gespeichert. Wir respektieren Ihre Privatsphäre und senden nur die von 
            Ihnen gewünschten Benachrichtigungen.
          </Text>
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
    backgroundColor: '#fff5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffcccc',
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
  permissionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
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