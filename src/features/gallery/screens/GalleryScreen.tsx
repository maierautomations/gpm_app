import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import ImageView from 'react-native-image-viewing';
import * as Sharing from 'expo-sharing';
import GalleryService from '../services/galleryService';
import { Database } from '../../../services/supabase/database.types';
import { logger } from '../../../utils/logger';

type GalleryPhoto = Database['public']['Tables']['gallery_photos']['Row'];
type PhotoCategory = 'restaurant' | 'events' | 'eis';

interface RouteParams {
  selectedPhotoId?: string;
  category?: PhotoCategory;
}

const { width: screenWidth } = Dimensions.get('window');
const GRID_MARGIN = 16;
const GRID_SPACING = 8;
const COLUMNS = 2;
const ITEM_WIDTH = (screenWidth - (GRID_MARGIN * 2) - (GRID_SPACING * (COLUMNS - 1))) / COLUMNS;

export default function GalleryScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const params = route.params as RouteParams;

  const [activeCategory, setActiveCategory] = useState<PhotoCategory>(params?.category || 'restaurant');
  const [photos, setPhotos] = useState<Record<PhotoCategory, GalleryPhoto[]>>({
    restaurant: [],
    events: [],
    eis: []
  });
  const [categoryCounts, setCategoryCounts] = useState<Record<PhotoCategory, number>>({
    restaurant: 0,
    events: 0,
    eis: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [photoViewerVisible, setPhotoViewerVisible] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  const categories: { key: PhotoCategory; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'restaurant', label: 'Restaurant', icon: 'restaurant' },
    { key: 'events', label: 'Events', icon: 'calendar' },
    { key: 'eis', label: 'Eis-Spezialitäten', icon: 'snow' }
  ];

  useEffect(() => {
    loadPhotos();
    
    // If there's a selected photo ID from navigation, open it
    if (params?.selectedPhotoId) {
      // We'll handle this after photos are loaded
    }
  }, []);

  useEffect(() => {
    // Open specific photo if provided
    if (params?.selectedPhotoId && Object.keys(photos).length > 0) {
      const categoryPhotos = photos[activeCategory] || [];
      const photoIndex = categoryPhotos.findIndex(p => p.id === params.selectedPhotoId);
      if (photoIndex !== -1) {
        setSelectedPhotoIndex(photoIndex);
        setPhotoViewerVisible(true);
      }
    }
  }, [photos, params?.selectedPhotoId, activeCategory]);

  const loadPhotos = async () => {
    try {
      const [allPhotos, counts] = await Promise.all([
        GalleryService.getAllPhotos(),
        GalleryService.getCategoryCounts()
      ]);
      
      setPhotos(allPhotos);
      setCategoryCounts(counts);
    } catch (error) {
      logger.error('Error loading photos:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPhotos();
  };

  const handlePhotoPress = (photo: GalleryPhoto, index: number) => {
    setSelectedPhotoIndex(index);
    setPhotoViewerVisible(true);
  };

  const handleClosePhotoViewer = () => {
    setPhotoViewerVisible(false);
  };

  const handleSharePhoto = async (imageUri: string) => {
    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(imageUri, {
          mimeType: 'image/jpeg',
          dialogTitle: 'Foto teilen',
        });
      } else {
        Alert.alert('Fehler', 'Teilen ist auf diesem Gerät nicht verfügbar');
      }
    } catch (error) {
      logger.error('Error sharing photo:', error);
      Alert.alert('Fehler', 'Foto konnte nicht geteilt werden');
    }
  };

  const renderPhotoGrid = () => {
    const categoryPhotos = photos[activeCategory] || [];

    if (categoryPhotos.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="images-outline" size={64} color="#ccc" />
          <Text style={styles.emptyStateText}>
            Noch keine Fotos in dieser Kategorie
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.grid}>
        {categoryPhotos.map((photo, index) => (
          <TouchableOpacity
            key={photo.id}
            style={styles.gridItem}
            onPress={() => handlePhotoPress(photo, index)}
            activeOpacity={0.8}
          >
            <Image
              source={{ uri: photo.thumbnail_url || photo.image_url }}
              style={styles.gridImage}
              resizeMode="cover"
            />
            
            {photo.title && (
              <View style={styles.photoInfo}>
                <Text style={styles.photoTitle} numberOfLines={1}>
                  {photo.title}
                </Text>
              </View>
            )}

            {photo.is_featured && (
              <View style={styles.featuredBadge}>
                <Ionicons name="star" size={12} color="#FFD700" />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Fotogalerie</Text>
          <View style={styles.placeholder} />
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF0000" />
          <Text style={styles.loadingText}>Fotos werden geladen...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Fotogalerie</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Category Tabs */}
      <View style={styles.tabContainer}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category.key}
            style={[
              styles.tab,
              activeCategory === category.key && styles.activeTab
            ]}
            onPress={() => setActiveCategory(category.key)}
          >
            <Ionicons
              name={category.icon}
              size={20}
              color={activeCategory === category.key ? '#FF0000' : '#666'}
            />
            <Text
              style={[
                styles.tabText,
                activeCategory === category.key && styles.activeTabText
              ]}
            >
              {category.label}
            </Text>
            {categoryCounts[category.key] > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{categoryCounts[category.key]}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Photo Grid */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FF0000']}
          />
        }
      >
        {renderPhotoGrid()}
        
        {/* Footer Spacing */}
        <View style={styles.footerSpacing} />
      </ScrollView>

      {/* Enhanced Photo Viewer */}
      <ImageView
        images={photos[activeCategory]?.map(photo => ({
          uri: photo.image_url,
          title: photo.title,
          description: photo.description
        })) || []}
        imageIndex={selectedPhotoIndex}
        visible={photoViewerVisible}
        onRequestClose={handleClosePhotoViewer}
        FooterComponent={({ imageIndex }) => {
          const currentPhoto = photos[activeCategory]?.[imageIndex];
          if (!currentPhoto) return null;

          return (
            <View style={styles.photoFooter}>
              {/* Photo Info */}
              <View style={styles.photoInfo}>
                {currentPhoto.title && (
                  <Text style={styles.photoTitle}>{currentPhoto.title}</Text>
                )}
                {currentPhoto.description && (
                  <Text style={styles.photoDescription}>
                    {currentPhoto.description}
                  </Text>
                )}
              </View>

              {/* Action Buttons */}
              <View style={styles.photoActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleSharePhoto(currentPhoto.image_url)}
                >
                  <Ionicons name="share-outline" size={24} color="white" />
                  <Text style={styles.actionButtonText}>Teilen</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  refreshButton: {
    padding: 4,
  },
  placeholder: {
    width: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginHorizontal: 4,
    position: 'relative',
  },
  activeTab: {
    backgroundColor: '#FFF0F0',
  },
  tabText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#FF0000',
    fontWeight: 'bold',
  },
  countBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FF0000',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: GRID_MARGIN,
    gap: GRID_SPACING,
  },
  gridItem: {
    width: ITEM_WIDTH,
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'white',
    marginBottom: GRID_SPACING,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  photoInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 8,
  },
  photoTitle: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  featuredBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
    padding: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
    textAlign: 'center',
  },
  footerSpacing: {
    height: 32,
  },
  photoFooter: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  photoInfo: {
    marginBottom: 16,
  },
  photoTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  photoDescription: {
    color: 'white',
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.9,
  },
  photoActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    marginHorizontal: 8,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});