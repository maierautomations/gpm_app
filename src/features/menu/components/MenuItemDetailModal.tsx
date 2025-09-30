import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Database } from '../../../services/supabase/database.types';

type MenuItemType = Database['public']['Tables']['menu_items']['Row'];

interface MenuItemDetailModalProps {
  visible: boolean;
  item: MenuItemType | null;
  isFavorite?: boolean;
  onClose: () => void;
  onToggleFavorite?: () => void;
  offerPrice?: string;
  isOffer?: boolean;
}

export default function MenuItemDetailModal({ 
  visible, 
  item, 
  isFavorite, 
  onClose, 
  onToggleFavorite,
  offerPrice,
  isOffer 
}: MenuItemDetailModalProps) {
  if (!item) return null;

  // Parse price (it comes as string from numeric field)
  const price = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
  const specialPrice = offerPrice ? parseFloat(offerPrice) : null;

  // Parse allergens using the same logic as enhancedContextProvider
  type AllergenData = string[] | Record<string, boolean> | null | undefined;

  const formatAllergens = (allergens: AllergenData): string[] => {
    if (!allergens) return [];
    if (Array.isArray(allergens)) return allergens;
    if (typeof allergens === 'object') {
      return Object.keys(allergens).filter((key) => allergens[key] === true);
    }
    return [];
  };

  const allergensList = formatAllergens(item.allergens);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title} numberOfLines={2}>
              {item.name}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.content} 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Image (if available) */}
            {item.image_url && (
              <Image source={{ uri: item.image_url }} style={styles.image} />
            )}

            {/* Offer Badge */}
            {isOffer && (
              <View style={styles.offerSection}>
                <View style={styles.offerBadge}>
                  <Ionicons name="flame" size={16} color="#fff" />
                  <Text style={styles.offerBadgeText}>SONDERANGEBOT</Text>
                </View>
              </View>
            )}

            {/* Price Section */}
            <View style={styles.priceSection}>
              {specialPrice ? (
                <View style={styles.priceContainer}>
                  <Text style={styles.originalPrice}>€{price.toFixed(2)}</Text>
                  <Text style={styles.specialPrice}>€{specialPrice.toFixed(2)}</Text>
                  <View style={styles.savingsBadge}>
                    <Text style={styles.savingsText}>
                      Spare €{(price - specialPrice).toFixed(2)}
                    </Text>
                  </View>
                </View>
              ) : (
                <Text style={styles.price}>€{price.toFixed(2)}</Text>
              )}
            </View>

            {/* Description */}
            {item.description && (
              <View style={styles.descriptionSection}>
                <Text style={styles.sectionTitle}>Beschreibung</Text>
                <Text style={styles.description}>{item.description}</Text>
              </View>
            )}

            {/* Allergens */}
            {allergensList.length > 0 && (
              <View style={styles.allergensSection}>
                <Text style={styles.sectionTitle}>
                  <Ionicons name="warning" size={16} color="#FF6B6B" /> Allergene
                </Text>
                <View style={styles.allergensList}>
                  {allergensList.map((allergen, index) => (
                    <View key={index} style={styles.allergenChip}>
                      <Ionicons name="alert-circle" size={14} color="#FF6B6B" />
                      <Text style={styles.allergenText}>{allergen}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Spacer for bottom button */}
            <View style={styles.bottomSpacer} />
          </ScrollView>

          {/* Bottom Action Button */}
          {onToggleFavorite && (
            <View style={styles.bottomAction}>
              <TouchableOpacity 
                style={[styles.favoriteButton, isFavorite && styles.favoriteButtonActive]}
                onPress={onToggleFavorite}
              >
                <Ionicons 
                  name={isFavorite ? 'heart' : 'heart-outline'} 
                  size={20} 
                  color={isFavorite ? '#fff' : '#FF0000'} 
                />
                <Text style={[styles.favoriteButtonText, isFavorite && styles.favoriteButtonTextActive]}>
                  {isFavorite ? 'Von Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const { height } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.85,
    minHeight: height * 0.4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 16,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  image: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  offerSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  offerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B00',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  offerBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  priceSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF0000',
  },
  originalPrice: {
    fontSize: 18,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  specialPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B00',
  },
  savingsBadge: {
    backgroundColor: '#FFE0CC',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  savingsText: {
    color: '#FF6B00',
    fontSize: 14,
    fontWeight: '600',
  },
  descriptionSection: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: '#666',
  },
  allergensSection: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  allergensList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  allergenChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFE0E0',
  },
  allergenText: {
    fontSize: 13,
    color: '#FF6B6B',
    marginLeft: 4,
    fontWeight: '500',
  },
  bottomSpacer: {
    height: 80,
  },
  bottomAction: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  favoriteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#FF0000',
    paddingVertical: 14,
    borderRadius: 12,
  },
  favoriteButtonActive: {
    backgroundColor: '#FF0000',
  },
  favoriteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF0000',
    marginLeft: 8,
  },
  favoriteButtonTextActive: {
    color: '#fff',
  },
});