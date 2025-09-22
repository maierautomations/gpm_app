import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  SafeAreaView,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type FAQItem = {
  id: string;
  question: string;
  answer: string;
};

const faqData: FAQItem[] = [
  {
    id: '1',
    question: 'Wo finde ich aktuelle Neuigkeiten?',
    answer: 'Folgen Sie uns auf Facebook und Instagram für tägliche Updates, Spezialangebote und Event-Ankündigungen.'
  },
  {
    id: '2',
    question: 'Wie kann ich meine Lieblingsgerichte speichern?',
    answer: 'Tippen Sie auf das Herz-Symbol neben jedem Gericht in der Speisekarte. Ihre Favoriten finden Sie dann im Profil und können gefiltert werden.'
  },
  {
    id: '3',
    question: 'Welche Wochenangebote gibt es?',
    answer: 'Jede Woche wechseln unsere Spezialangebote. Schauen Sie auf der Startseite nach dem aktuellen Wochenthema oder im Menü unter "Angebote".'
  },
  {
    id: '4',
    question: 'Kann ich online bestellen?',
    answer: 'Aktuell ist nur die Abholung vor Ort möglich. Eine Online-Bestellung ist in Planung. Rufen Sie uns gerne für Vorbestellungen an.'
  },
  {
    id: '5',
    question: 'Gibt es vegetarische/vegane Optionen?',
    answer: 'Ja! Wir haben verschiedene vegetarische Gerichte. Schauen Sie in der Speisekarte nach dem entsprechenden Filter oder fragen Sie unser Personal.'
  },
  {
    id: '6',
    question: 'Wo finde ich Informationen zu Allergenen?',
    answer: 'Allergene werden in der Speisekarte bei jedem Gericht angezeigt. Bei Fragen sprechen Sie unser Personal direkt an.'
  }
];

export default function HelpSupportScreen({ navigation }: { navigation: any }) {
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  const toggleFAQ = (id: string) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  const handleCall = () => {
    Linking.openURL('tel:+491734661549');
  };

  const handleEmail = () => {
    Linking.openURL('mailto:info@grill-partner-maier.de');
  };

  const handleFeedback = () => {
    Alert.alert(
      'Feedback senden',
      'Möchten Sie uns Feedback per E-Mail senden?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'E-Mail öffnen', onPress: () => handleEmail() }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hilfe & Support</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Quick Contact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Schnelle Hilfe</Text>
          
          <TouchableOpacity style={styles.contactItem} onPress={handleCall}>
            <View style={styles.contactIconContainer}>
              <Ionicons name="call" size={24} color="#FF0000" />
            </View>
            <View style={styles.contactText}>
              <Text style={styles.contactTitle}>Anrufen</Text>
              <Text style={styles.contactDetail}>+49 173 466 1549</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactItem} onPress={handleEmail}>
            <View style={styles.contactIconContainer}>
              <Ionicons name="mail" size={24} color="#FF0000" />
            </View>
            <View style={styles.contactText}>
              <Text style={styles.contactTitle}>E-Mail schreiben</Text>
              <Text style={styles.contactDetail}>info@grill-partner-maier.de</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactItem} onPress={handleFeedback}>
            <View style={styles.contactIconContainer}>
              <Ionicons name="chatbubble" size={24} color="#FF0000" />
            </View>
            <View style={styles.contactText}>
              <Text style={styles.contactTitle}>Feedback senden</Text>
              <Text style={styles.contactDetail}>Ihre Meinung ist uns wichtig</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        {/* FAQ Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Häufige Fragen</Text>
          
          {faqData.map((faq) => (
            <View key={faq.id} style={styles.faqItem}>
              <TouchableOpacity 
                style={styles.faqQuestion}
                onPress={() => toggleFAQ(faq.id)}
              >
                <Text style={styles.faqQuestionText}>{faq.question}</Text>
                <Ionicons 
                  name={expandedFAQ === faq.id ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color="#666" 
                />
              </TouchableOpacity>
              
              {expandedFAQ === faq.id && (
                <View style={styles.faqAnswer}>
                  <Text style={styles.faqAnswerText}>{faq.answer}</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* App Features Help */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App-Funktionen</Text>
          
          <View style={styles.featureItem}>
            <Ionicons name="qr-code" size={20} color="#FF0000" />
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>QR-Code Scanner</Text>
              <Text style={styles.featureDescription}>
                Scannen Sie QR-Codes an der Kasse um Treuepunkte zu sammeln
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Ionicons name="heart" size={20} color="#FF0000" />
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Favoriten</Text>
              <Text style={styles.featureDescription}>
                Speichern Sie Ihre Lieblingsgerichte und Events für schnellen Zugriff
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Ionicons name="chatbubbles" size={20} color="#FF0000" />
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Chat-Assistent</Text>
              <Text style={styles.featureDescription}>
                Stellen Sie Fragen zu unserem Menü, Öffnungszeiten und mehr
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Ionicons name="calendar" size={20} color="#FF0000" />
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Event-Kalender</Text>
              <Text style={styles.featureDescription}>
                Verpassen Sie keine Veranstaltungen und Sonderaktionen
              </Text>
            </View>
          </View>
        </View>

        {/* Technical Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Technischer Support</Text>
          <Text style={styles.paragraph}>
            Bei technischen Problemen mit der App können Sie uns gerne kontaktieren. 
            Geben Sie dabei bitte Ihr Gerät und die App-Version an.
          </Text>
          <Text style={styles.appVersion}>App-Version: 1.0.0</Text>
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
  section: {
    backgroundColor: 'white',
    marginTop: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  contactIconContainer: {
    width: 40,
    alignItems: 'center',
  },
  contactText: {
    flex: 1,
    marginLeft: 16,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  contactDetail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  faqQuestion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  faqQuestionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 16,
  },
  faqAnswer: {
    paddingBottom: 16,
    paddingRight: 36,
  },
  faqAnswerText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  featureText: {
    flex: 1,
    marginLeft: 16,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    color: '#666',
    marginBottom: 16,
  },
  appVersion: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
});