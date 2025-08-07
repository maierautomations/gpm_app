import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
  Image,
  ScrollView,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import EventsService from '../services/events/eventsService';
import { Database } from '../services/supabase/database.types';

type Event = Database['public']['Tables']['events']['Row'];

export default function EventsScreen() {
  const [events, setEvents] = useState<Event[]>([]);
  const [pastEvents, setPastEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showPast, setShowPast] = useState(false);

  useEffect(() => {
    loadEvents();

    // Subscribe to real-time updates
    const subscription = EventsService.subscribeToEventUpdates(() => {
      loadEvents();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadEvents = async () => {
    try {
      const upcomingEvents = await EventsService.getEvents();
      const pastEventsList = await EventsService.getPastEvents();
      
      // If no events in database, use mock data for demonstration
      if (upcomingEvents.length === 0 && pastEventsList.length === 0) {
        const mockEvents = EventsService.getMockEvents();
        setEvents(mockEvents);
      } else {
        setEvents(upcomingEvents);
        setPastEvents(pastEventsList);
      }
    } catch (error) {
      console.error('Error loading events:', error);
      // Use mock data as fallback
      const mockEvents = EventsService.getMockEvents();
      setEvents(mockEvents);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadEvents();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    return date.toLocaleDateString('de-DE', options);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  };

  const getDaysUntil = (dateString: string) => {
    const eventDate = new Date(dateString);
    const today = new Date();
    const diffTime = eventDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Heute';
    if (diffDays === 1) return 'Morgen';
    if (diffDays < 0) return 'Vergangen';
    return `In ${diffDays} Tagen`;
  };

  const handleLocationPress = (location: string) => {
    const url = `https://maps.google.com/?q=${encodeURIComponent(location)}`;
    Linking.openURL(url);
  };

  const renderEvent = ({ item }: { item: Event }) => {
    const isPast = new Date(item.date) < new Date();
    
    return (
      <View style={[styles.eventCard, isPast && styles.pastEventCard]}>
        {item.image_url && (
          <Image source={{ uri: item.image_url }} style={styles.eventImage} />
        )}
        
        <View style={styles.eventContent}>
          <View style={styles.eventHeader}>
            <Text style={[styles.eventTitle, isPast && styles.pastEventTitle]}>
              {item.title}
            </Text>
            <View style={[styles.dateBadge, isPast && styles.pastDateBadge]}>
              <Text style={[styles.daysUntil, isPast && styles.pastDaysUntil]}>
                {getDaysUntil(item.date)}
              </Text>
            </View>
          </View>

          {item.description && (
            <Text style={[styles.eventDescription, isPast && styles.pastEventDescription]} numberOfLines={2}>
              {item.description}
            </Text>
          )}

          <View style={styles.eventDetails}>
            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={16} color={isPast ? '#999' : '#666'} />
              <Text style={[styles.detailText, isPast && styles.pastDetailText]}>
                {formatDate(item.date)}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="time-outline" size={16} color={isPast ? '#999' : '#666'} />
              <Text style={[styles.detailText, isPast && styles.pastDetailText]}>
                {formatTime(item.date)}
              </Text>
            </View>

            <TouchableOpacity 
              style={styles.detailRow}
              onPress={() => handleLocationPress(item.location)}
              disabled={isPast}
            >
              <Ionicons name="location-outline" size={16} color={isPast ? '#999' : '#FF0000'} />
              <Text style={[styles.locationText, isPast && styles.pastLocationText]}>
                {item.location}
              </Text>
            </TouchableOpacity>
          </View>

          {item.offerings && item.offerings.length > 0 && (
            <View style={styles.offeringsContainer}>
              <Text style={[styles.offeringsTitle, isPast && styles.pastOfferingsTitle]}>
                Unser Angebot:
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {item.offerings.map((offering, index) => (
                  <View key={index} style={[styles.offeringChip, isPast && styles.pastOfferingChip]}>
                    <Text style={[styles.offeringText, isPast && styles.pastOfferingText]}>
                      {offering}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF0000" />
        <Text style={styles.loadingText}>Events werden geladen...</Text>
      </View>
    );
  }

  const displayEvents = showPast ? pastEvents : events;

  return (
    <SafeAreaView style={styles.container}>
      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, !showPast && styles.activeTab]}
          onPress={() => setShowPast(false)}
        >
          <Text style={[styles.tabText, !showPast && styles.activeTabText]}>
            Kommende Events ({events.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, showPast && styles.activeTab]}
          onPress={() => setShowPast(true)}
        >
          <Text style={[styles.tabText, showPast && styles.activeTabText]}>
            Vergangene Events ({pastEvents.length})
          </Text>
        </TouchableOpacity>
      </View>

      {displayEvents.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>
            {showPast 
              ? 'Keine vergangenen Events' 
              : 'Keine kommenden Events geplant'}
          </Text>
          <Text style={styles.emptySubtext}>
            {showPast
              ? 'Hier erscheinen vergangene Veranstaltungen'
              : 'Schauen Sie bald wieder vorbei!'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={displayEvents}
          keyExtractor={item => item.id}
          renderItem={renderEvent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#FF0000']}
            />
          }
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <Ionicons name="information-circle-outline" size={20} color="#666" />
        <Text style={styles.infoText}>
          Eventgastronomie von Mai bis September • Catering auf Anfrage
        </Text>
      </View>
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
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#FF0000',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#FF0000',
  },
  listContent: {
    paddingVertical: 16,
  },
  eventCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pastEventCard: {
    opacity: 0.7,
  },
  eventImage: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
  },
  eventContent: {
    padding: 16,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  pastEventTitle: {
    color: '#999',
  },
  dateBadge: {
    backgroundColor: '#FFE5E5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pastDateBadge: {
    backgroundColor: '#f0f0f0',
  },
  daysUntil: {
    fontSize: 12,
    color: '#FF0000',
    fontWeight: '600',
  },
  pastDaysUntil: {
    color: '#999',
  },
  eventDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  pastEventDescription: {
    color: '#999',
  },
  eventDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  pastDetailText: {
    color: '#999',
  },
  locationText: {
    fontSize: 14,
    color: '#FF0000',
    marginLeft: 8,
    textDecorationLine: 'underline',
  },
  pastLocationText: {
    color: '#999',
    textDecorationLine: 'none',
  },
  offeringsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  offeringsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  pastOfferingsTitle: {
    color: '#999',
  },
  offeringChip: {
    backgroundColor: '#FFE5E5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  pastOfferingChip: {
    backgroundColor: '#f0f0f0',
  },
  offeringText: {
    fontSize: 12,
    color: '#FF0000',
  },
  pastOfferingText: {
    color: '#999',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
});