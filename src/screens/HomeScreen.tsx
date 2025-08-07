import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  Image,
  Linking,
  RefreshControl,
  SafeAreaView,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '../stores/userStore';
import MenuService from '../services/menu/menuService';
import { Database } from '../services/supabase/database.types';
import { useNavigation } from '@react-navigation/native';

type MenuItem = Database['public']['Tables']['menu_items']['Row'];

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const user = useUserStore(state => state.user);
  const [specialOffers, setSpecialOffers] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Restaurant info
  const isOpen = () => {
    const now = new Date();
    const hours = now.getHours();
    const day = now.getDay();
    
    // Closed on Christmas Eve (Dec 24)
    if (now.getMonth() === 11 && now.getDate() === 24) return false;
    
    // Open 11:00 - 22:00
    return hours >= 11 && hours < 22;
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load special offers or featured items
      const items = await MenuService.getMenuItems();
      // For now, show first 3 items as "specials"
      setSpecialOffers(items.slice(0, 3));
    } catch (error) {
      console.error('Error loading home data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleCall = () => {
    Linking.openURL('tel:+494311234567'); // Update with actual phone
  };

  const handleDirections = () => {
    const address = 'Langer Rehm 25, 24149 Kiel-Dietrichsdorf';
    const url = `https://maps.google.com/?q=${encodeURIComponent(address)}`;
    Linking.openURL(url);
  };

  const handleQuickAction = (screen: string) => {
    navigation.navigate(screen);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF0000" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FF0000']}
          />
        }
      >
        {/* Header with Restaurant Image */}
        <View style={styles.header}>
          <Image 
            source={{ uri: 'https://via.placeholder.com/400x200' }} // Replace with actual image
            style={styles.headerImage}
          />
          <View style={styles.headerOverlay}>
            <Text style={styles.headerTitle}>Grill-Partner Maier</Text>
            <Text style={styles.headerSubtitle}>Seit 1968 • Familientradition</Text>
          </View>
        </View>

        {/* Welcome Message */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>
            {user ? `Moin ${user.email?.split('@')[0]}!` : 'Moin!'}
          </Text>
          <View style={styles.statusBadge}>
            <View style={[styles.statusDot, { backgroundColor: isOpen() ? '#4CAF50' : '#FF5252' }]} />
            <Text style={styles.statusText}>
              {isOpen() ? 'Jetzt geöffnet' : 'Geschlossen'}
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionCard} onPress={() => handleQuickAction('Menu')}>
            <Ionicons name="restaurant" size={32} color="#FF0000" />
            <Text style={styles.actionText}>Speisekarte</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionCard} onPress={handleCall}>
            <Ionicons name="call" size={32} color="#FF0000" />
            <Text style={styles.actionText}>Anrufen</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionCard} onPress={handleDirections}>
            <Ionicons name="navigate" size={32} color="#FF0000" />
            <Text style={styles.actionText}>Route</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionCard} onPress={() => handleQuickAction('Events')}>
            <Ionicons name="calendar" size={32} color="#FF0000" />
            <Text style={styles.actionText}>Events</Text>
          </TouchableOpacity>
        </View>

        {/* Today's Specials */}
        {specialOffers.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Beliebte Gerichte</Text>
              <TouchableOpacity onPress={() => handleQuickAction('Menu')}>
                <Text style={styles.seeAllText}>Alle ansehen →</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {specialOffers.map(item => (
                <TouchableOpacity 
                  key={item.id} 
                  style={styles.specialCard}
                  onPress={() => handleQuickAction('Menu')}
                >
                  {item.image_url && (
                    <Image source={{ uri: item.image_url }} style={styles.specialImage} />
                  )}
                  <View style={styles.specialContent}>
                    <Text style={styles.specialName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.specialPrice}>€{parseFloat(item.price).toFixed(2)}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Info Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gut zu wissen</Text>
          
          <View style={styles.infoCard}>
            <Ionicons name="time-outline" size={24} color="#FF0000" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Öffnungszeiten</Text>
              <Text style={styles.infoText}>Täglich 11:00 - 22:00 Uhr</Text>
              <Text style={styles.infoSubtext}>364 Tage im Jahr (außer Heiligabend)</Text>
            </View>
          </View>
          
          <View style={styles.infoCard}>
            <Ionicons name="location-outline" size={24} color="#FF0000" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Adresse</Text>
              <Text style={styles.infoText}>Langer Rehm 25</Text>
              <Text style={styles.infoSubtext}>24149 Kiel-Dietrichsdorf</Text>
            </View>
          </View>
          
          <View style={styles.infoCard}>
            <Ionicons name="car-outline" size={24} color="#FF0000" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Parkplätze</Text>
              <Text style={styles.infoText}>Kostenlose Parkplätze</Text>
              <Text style={styles.infoSubtext}>Direkt vor dem Restaurant</Text>
            </View>
          </View>
        </View>

        {/* Loyalty CTA (if not logged in) */}
        {!user && (
          <TouchableOpacity 
            style={styles.ctaCard}
            onPress={() => handleQuickAction('Profile')}
          >
            <Ionicons name="gift-outline" size={32} color="#FFF" />
            <View style={styles.ctaContent}>
              <Text style={styles.ctaTitle}>Treuepunkte sammeln!</Text>
              <Text style={styles.ctaText}>Jetzt anmelden und bei jedem Besuch profitieren</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#FFF" />
          </TouchableOpacity>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Familie Maier heißt Sie herzlich willkommen!</Text>
          <Text style={styles.footerSubtext}>Tradition & Qualität seit 1968</Text>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    height: 200,
    position: 'relative',
  },
  headerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  headerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'white',
    marginTop: 4,
  },
  welcomeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    color: '#666',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: 'white',
    marginTop: 2,
  },
  actionCard: {
    alignItems: 'center',
    padding: 12,
  },
  actionText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  section: {
    marginTop: 16,
    paddingVertical: 16,
    backgroundColor: 'white',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 14,
    color: '#FF0000',
  },
  specialCard: {
    width: 150,
    marginLeft: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
  },
  specialImage: {
    width: '100%',
    height: 100,
    resizeMode: 'cover',
  },
  specialContent: {
    padding: 8,
  },
  specialName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  specialPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF0000',
    marginTop: 4,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  infoContent: {
    marginLeft: 16,
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  infoSubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  ctaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF0000',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  ctaContent: {
    flex: 1,
    marginLeft: 12,
  },
  ctaTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  ctaText: {
    fontSize: 14,
    color: 'white',
    marginTop: 4,
  },
  footer: {
    alignItems: 'center',
    padding: 20,
    marginTop: 8,
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  footerSubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
});