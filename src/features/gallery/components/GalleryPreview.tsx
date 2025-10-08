import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GalleryService from '../services/galleryService';
import { Database } from '../../../services/supabase/database.types';
import { useNavigation } from '@react-navigation/native';
import { logger } from '../../../utils/logger';
import CachedImage from '../../../shared/components/CachedImage';

type GalleryPhoto = Database['public']['Tables']['gallery_photos']['Row'];

interface GalleryPreviewProps {
  onViewAll?: () => void;
}

const { width: screenWidth } = Dimensions.get('window');
const ITEM_WIDTH = screenWidth * 0.7;
const ITEM_HEIGHT = 180;

export default function GalleryPreview({ onViewAll }: GalleryPreviewProps) {
  const navigation = useNavigation<any>();
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeaturedPhotos();
    
    // Subscribe to photo changes for real-time updates
    const subscription = GalleryService.subscribeToPhotos((updatedPhotos) => {
      setPhotos(updatedPhotos);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadFeaturedPhotos = async () => {
    try {
      const featuredPhotos = await GalleryService.getFeaturedPhotos();
      setPhotos(featuredPhotos);
    } catch (error) {
      logger.error('Error loading featured photos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoPress = (photo: GalleryPhoto, index: number) => {
    // Navigate to full gallery with the selected photo
    navigation.navigate('Gallery', { 
      selectedPhotoId: photo.id,
      category: photo.category 
    });
  };

  const handleViewAll = () => {
    if (onViewAll) {
      onViewAll();
    } else {
      navigation.navigate('Gallery');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#FF0000" />
      </View>
    );
  }

  if (photos.length === 0) {
    return null; // Don't show the section if no photos
  }

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Ionicons name="images-outline" size={24} color="#FF0000" />
          <Text style={styles.title}>Eindrücke aus unserem Restaurant</Text>
        </View>
        <TouchableOpacity onPress={handleViewAll} style={styles.viewAllButton}>
          <Text style={styles.viewAllText}>Alle Fotos</Text>
          <Ionicons name="chevron-forward" size={16} color="#FF0000" />
        </TouchableOpacity>
      </View>

      {/* Photo Preview Scroll */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
      >
        {photos.map((photo, index) => (
          <TouchableOpacity
            key={photo.id}
            style={[
              styles.photoItem,
              index === 0 && styles.firstItem,
              index === photos.length - 1 && styles.lastItem
            ]}
            onPress={() => handlePhotoPress(photo, index)}
            activeOpacity={0.8}
          >
            <CachedImage
              uri={photo.thumbnail_url || photo.image_url}
              style={styles.photoImage}
              contentFit="cover"
              transition={200}
              priority="high"
            />
            
            {/* Photo Info Overlay */}
            <View style={styles.photoOverlay}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>
                  {GalleryService.getCategoryDisplayName(photo.category as 'restaurant' | 'events' | 'eis')}
                </Text>
              </View>
              
              {photo.title && (
                <Text style={styles.photoTitle} numberOfLines={2}>
                  {photo.title}
                </Text>
              )}
            </View>

            {/* Subtle hover effect */}
            <View style={styles.hoverEffect} />
          </TouchableOpacity>
        ))}

        {/* View All Card */}
        <TouchableOpacity
          style={[styles.photoItem, styles.viewAllCard]}
          onPress={handleViewAll}
          activeOpacity={0.8}
        >
          <View style={styles.viewAllContent}>
            <Ionicons name="add-circle-outline" size={48} color="#FF0000" />
            <Text style={styles.viewAllCardText}>Alle Fotos{'\n'}ansehen</Text>
            <Text style={styles.photoCount}>
              {photos.length > 6 ? '6+' : photos.length} Fotos
            </Text>
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* Scroll Hint */}
      {photos.length > 2 && (
        <Text style={styles.scrollHint}>← Wischen für mehr Fotos</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    marginVertical: 8,
    paddingVertical: 16,
  },
  loadingContainer: {
    backgroundColor: 'white',
    paddingVertical: 32,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  viewAllText: {
    fontSize: 14,
    color: '#FF0000',
    fontWeight: '600',
    marginRight: 4,
  },
  scrollView: {
    paddingLeft: 16,
  },
  scrollContent: {
    paddingRight: 16,
  },
  photoItem: {
    width: ITEM_WIDTH,
    height: ITEM_HEIGHT,
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
    position: 'relative',
  },
  firstItem: {
    marginLeft: 0,
  },
  lastItem: {
    marginRight: 8,
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 12,
  },
  categoryBadge: {
    backgroundColor: 'rgba(255, 0, 0, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  categoryText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  photoTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
  hoverEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  viewAllCard: {
    backgroundColor: '#f9f9f9',
    borderWidth: 2,
    borderColor: '#FF0000',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewAllContent: {
    alignItems: 'center',
  },
  viewAllCardText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF0000',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  photoCount: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  scrollHint: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
});