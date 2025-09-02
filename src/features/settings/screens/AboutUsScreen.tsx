import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  Linking,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AboutUsScreen({ navigation }: { navigation: any }) {
  const handleCall = () => {
    Linking.openURL('tel:+491734661549');
  };

  const handleEmail = () => {
    Linking.openURL('mailto:info@grill-partner-maier.de');
  };

  const handleDirections = () => {
    const address = 'Langer Rehm 25, 24149 Kiel-Dietrichsdorf';
    const url = `https://maps.google.com/?q=${encodeURIComponent(address)}`;
    Linking.openURL(url);
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
        <Text style={styles.headerTitle}>Über uns</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Restaurant Header */}
        <View style={styles.heroSection}>
          <Image 
            source={{ uri: 'https://via.placeholder.com/400x200' }} 
            style={styles.heroImage}
          />
          <View style={styles.heroOverlay}>
            <Text style={styles.restaurantName}>Grill-Partner Maier</Text>
            <Text style={styles.restaurantTagline}>Familientradition seit 1968</Text>
          </View>
        </View>

        {/* Our Story */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Unsere Geschichte</Text>
          <Text style={styles.paragraph}>
            Seit über 55 Jahren steht der Name Maier in Kiel-Dietrichsdorf für Qualität, 
            Tradition und echten Geschmack. Was als kleiner Familienbetrieb begann, ist heute 
            ein fester Bestandteil der Kieler Gastronomie-Landschaft.
          </Text>
          <Text style={styles.paragraph}>
            Unser Grill-Partner Maier bietet Ihnen eine vielfältige Auswahl an frischen, 
            täglich zubereiteten Speisen - von klassischen Burgern und Schnitzeln bis hin zu 
            orientalischen Spezialitäten und hausgemachten Eis-Kreationen.
          </Text>
        </View>

        {/* Our Values */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Unsere Werte</Text>
          <View style={styles.valueItem}>
            <Ionicons name="restaurant" size={20} color="#FF0000" />
            <Text style={styles.valueText}>Frische Zubereitung täglich</Text>
          </View>
          <View style={styles.valueItem}>
            <Ionicons name="people" size={20} color="#FF0000" />
            <Text style={styles.valueText}>Familiengeführt in 3. Generation</Text>
          </View>
          <View style={styles.valueItem}>
            <Ionicons name="heart" size={20} color="#FF0000" />
            <Text style={styles.valueText}>Mit Liebe zum Detail</Text>
          </View>
          <View style={styles.valueItem}>
            <Ionicons name="location" size={20} color="#FF0000" />
            <Text style={styles.valueText}>Verwurzelt in Kiel-Dietrichsdorf</Text>
          </View>
        </View>

        {/* Contact Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kontakt & Anfahrt</Text>
          
          <TouchableOpacity style={styles.contactItem} onPress={handleCall}>
            <Ionicons name="call" size={24} color="#FF0000" />
            <View style={styles.contactText}>
              <Text style={styles.contactTitle}>Telefon</Text>
              <Text style={styles.contactDetail}>+49 173 466 1549</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactItem} onPress={handleEmail}>
            <Ionicons name="mail" size={24} color="#FF0000" />
            <View style={styles.contactText}>
              <Text style={styles.contactTitle}>E-Mail</Text>
              <Text style={styles.contactDetail}>info@grill-partner-maier.de</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactItem} onPress={handleDirections}>
            <Ionicons name="location" size={24} color="#FF0000" />
            <View style={styles.contactText}>
              <Text style={styles.contactTitle}>Adresse</Text>
              <Text style={styles.contactDetail}>Langer Rehm 25</Text>
              <Text style={styles.contactDetail}>24149 Kiel-Dietrichsdorf</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        {/* Opening Hours */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Öffnungszeiten</Text>
          <View style={styles.hoursContainer}>
            <View style={styles.hoursRow}>
              <Text style={styles.dayText}>Montag - Sonntag</Text>
              <Text style={styles.timeText}>11:00 - 22:00 Uhr</Text>
            </View>
            <Text style={styles.hoursNote}>364 Tage im Jahr geöffnet</Text>
            <Text style={styles.hoursNote}>Nur Heiligabend geschlossen</Text>
          </View>
        </View>

        {/* App Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App-Information</Text>
          <Text style={styles.appInfo}>Version 1.0.0</Text>
          <Text style={styles.appInfo}>Entwickelt für Familie Maier</Text>
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
  heroSection: {
    position: 'relative',
    height: 200,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 20,
  },
  restaurantName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  restaurantTagline: {
    fontSize: 16,
    color: 'white',
    marginTop: 4,
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
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    color: '#666',
    marginBottom: 16,
  },
  valueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  valueText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
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
  hoursContainer: {
    backgroundColor: '#f8f8f8',
    padding: 16,
    borderRadius: 8,
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dayText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  timeText: {
    fontSize: 16,
    color: '#FF0000',
    fontWeight: '600',
  },
  hoursNote: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  appInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
});