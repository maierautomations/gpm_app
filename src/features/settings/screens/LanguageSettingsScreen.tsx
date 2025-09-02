import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Language = {
  code: string;
  name: string;
  nativeName: string;
};

const languages: Language[] = [
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'en', name: 'English', nativeName: 'English' }
];

export default function LanguageSettingsScreen({ navigation }: { navigation: any }) {
  const [selectedLanguage, setSelectedLanguage] = useState<string>('de');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSavedLanguage();
  }, []);

  const loadSavedLanguage = async () => {
    try {
      const saved = await AsyncStorage.getItem('app_language');
      if (saved) {
        setSelectedLanguage(saved);
      }
    } catch (error) {
      console.error('Error loading language preference:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = async (languageCode: string) => {
    if (languageCode === selectedLanguage) return;

    try {
      await AsyncStorage.setItem('app_language', languageCode);
      setSelectedLanguage(languageCode);
      
      // Show restart notice for now
      Alert.alert(
        'Sprache geändert',
        'Die Sprachänderung wird beim nächsten App-Start wirksam.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error saving language preference:', error);
      Alert.alert('Fehler', 'Die Spracheinstellung konnte nicht gespeichert werden.');
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
          <Text style={styles.headerTitle}>Sprache</Text>
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
        <Text style={styles.headerTitle}>Sprache</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App-Sprache auswählen</Text>
          
          {languages.map((language) => (
            <TouchableOpacity
              key={language.code}
              style={[
                styles.languageOption,
                selectedLanguage === language.code && styles.selectedLanguageOption
              ]}
              onPress={() => handleLanguageChange(language.code)}
            >
              <View style={styles.languageInfo}>
                <Text style={[
                  styles.languageName,
                  selectedLanguage === language.code && styles.selectedLanguageName
                ]}>
                  {language.nativeName}
                </Text>
                <Text style={[
                  styles.languageSubtext,
                  selectedLanguage === language.code && styles.selectedLanguageSubtext
                ]}>
                  {language.name}
                </Text>
              </View>
              
              {selectedLanguage === language.code && (
                <Ionicons name="checkmark-circle" size={24} color="#FF0000" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hinweis</Text>
          <Text style={styles.noteText}>
            Aktuell sind nur die Grundfunktionen der App übersetzt. 
            Die vollständige Übersetzung aller Inhalte wird in einer zukünftigen Version verfügbar sein.
          </Text>
          <Text style={styles.noteText}>
            Der Chatbot erkennt automatisch Ihre Sprache und antwortet entsprechend.
          </Text>
        </View>

        {/* Language Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Übersetzungsstatus</Text>
          
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Deutsch</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>Vollständig</Text>
            </View>
          </View>
          
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>English</Text>
            <View style={[styles.statusBadge, styles.incompleteStatus]}>
              <Text style={[styles.statusText, styles.incompleteStatusText]}>In Arbeit</Text>
            </View>
          </View>
        </View>
      </View>
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
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: 12,
    backgroundColor: '#f8f8f8',
  },
  selectedLanguageOption: {
    borderColor: '#FF0000',
    backgroundColor: '#fff5f5',
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  selectedLanguageName: {
    color: '#FF0000',
  },
  languageSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  selectedLanguageSubtext: {
    color: '#FF0000',
  },
  noteText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
    marginBottom: 12,
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statusLabel: {
    fontSize: 16,
    color: '#333',
  },
  statusBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  incompleteStatus: {
    backgroundColor: '#FFC107',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  incompleteStatusText: {
    color: '#333',
  },
});