import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet, 
  Image,
  Linking,
  RefreshControl,
  SafeAreaView,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '../../../stores/userStore';
import MenuService from '../../menu/services/menuService';
import OffersService, { WeeklyOffer } from '../../offers/services/offersService';
import { Database } from '../../../services/supabase/database.types';
import { useNavigation } from '@react-navigation/native';
import GalleryPreview from '../../gallery/components/GalleryPreview';

type MenuItem = Database['public']['Tables']['menu_items']['Row'];

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const user = useUserStore(state => state.user);
  const [specialOffers, setSpecialOffers] = useState<MenuItem[]>([]);
  const [currentOffers, setCurrentOffers] = useState<WeeklyOffer | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Restaurant info
  const isOpen = () => {
    const now = new Date();
    const hours = now.getHours();
    const day = now.getDay();
    
    // Closed on Christmas Eve (Dec 24)
    if (now.getMonth() === 11 && now.getDate() === 24) return false;
    
    // Open 11:00 - 21:00
    return hours >= 11 && hours < 21;
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load current week's offers
      const offers = await OffersService.getCurrentWeekOffers();
      setCurrentOffers(offers);
      
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
    Linking.openURL('tel:+491734661549'); // Update with actual phone
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

        {/* Offers Banner */}
        {currentOffers && currentOffers.items.length > 0 && (
          <View style={styles.offersBanner}>
            <TouchableWithoutFeedback 
              onPress={() => navigation.navigate('Menu', { showOffers: true })}
              delayPressIn={100}
            >
              <View style={styles.offersBannerContent}>
                <View style={styles.offersBadge}>
                  <Text style={styles.offersBadgeText}>ANGEBOT</Text>
                </View>
                <View style={styles.offersInfo}>
                  <Text style={styles.offersTitle}>{currentOffers.week.week_theme}</Text>
                  <Text style={styles.offersSubtitle}>
                    {currentOffers.items.length} Artikel im Angebot!
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#FFF" />
              </View>
            </TouchableWithoutFeedback>
            
            {/* Show all offer items with scroll */}
            <View style={styles.offersScrollContainer}>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.offersPreview}
                contentContainerStyle={styles.offersScrollContent}
              >
                {currentOffers.items.map((item, index) => (
                  <View key={item.id} style={[
                    styles.offerItem,
                    index === 0 && styles.offerItemFirst,
                    index === currentOffers.items.length - 1 && styles.offerItemLast
                  ]}>
                    {item.highlight_badge && (
                      <Text style={styles.offerHighlightBadge}>{item.highlight_badge}</Text>
                    )}
                    <Text style={styles.offerItemName} numberOfLines={2}>
                      {OffersService.getItemDisplayName(item)}
                    </Text>
                    <View style={styles.offerPriceContainer}>
                      <Text style={styles.offerOriginalPrice}>
                        €{parseFloat(item.original_price).toFixed(2)}
                      </Text>
                      <Text style={styles.offerSpecialPrice}>
                        €{parseFloat(item.special_price).toFixed(2)}
                      </Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
              {currentOffers.items.length > 3 && (
                <Text style={styles.scrollHint}>→ Wischen für mehr</Text>
              )}
            </View>
          </View>
        )}

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

        {/* Gallery Preview */}
        <GalleryPreview onViewAll={() => navigation.navigate('Gallery')} />

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
              <Text style={styles.infoText}>Täglich 11:00 - 21:00 Uhr</Text>
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
  offersBanner: {
    backgroundColor: '#FF0000',
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  offersBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  offersBadge: {
    backgroundColor: '#FFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 12,
  },
  offersBadgeText: {
    color: '#FF0000',
    fontSize: 10,
    fontWeight: 'bold',
  },
  offersInfo: {
    flex: 1,
  },
  offersTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  offersSubtitle: {
    color: '#FFE0E0',
    fontSize: 14,
    marginTop: 2,
  },
  offersScrollContainer: {
    position: 'relative',
  },
  offersPreview: {
    marginTop: 8,
  },
  offersScrollContent: {
    paddingRight: 16,
  },
  offerItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 12,
    borderRadius: 8,
    marginRight: 10,
    width: 150,
    minHeight: 90,
  },
  offerItemFirst: {
    marginLeft: 0,
  },
  offerItemLast: {
    marginRight: 0,
  },
  offerItemName: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    minHeight: 36,
  },
  offerPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  offerOriginalPrice: {
    color: '#FFE0E0',
    fontSize: 12,
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  offerSpecialPrice: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  offerHighlightBadge: {
    backgroundColor: '#FFD700',
    color: '#333',
    fontSize: 9,
    fontWeight: 'bold',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  scrollHint: {
    position: 'absolute',
    bottom: 4,
    right: 16,
    color: '#FFE0E0',
    fontSize: 11,
    fontStyle: 'italic',
  },
});