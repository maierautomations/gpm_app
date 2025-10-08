import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Database } from '../../../services/supabase/database.types';
import CachedImage from '../../../shared/components/CachedImage';

type MenuItemType = Database['public']['Tables']['menu_items']['Row'];

interface MenuItemProps {
  item: MenuItemType;
  isFavorite?: boolean;
  onPress: () => void;
  onToggleFavorite?: () => void;
  offerPrice?: string;
  isOffer?: boolean;
}

export default function MenuItem({ item, isFavorite, onPress, onToggleFavorite, offerPrice, isOffer }: MenuItemProps) {
  // Parse price (it comes as string from numeric field)
  const price = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
  const specialPrice = offerPrice ? parseFloat(offerPrice) : null;
  
  // Parse allergens if they exist
  const allergenCount = item.allergens ? 
    (Array.isArray(item.allergens) ? item.allergens.length : 
     typeof item.allergens === 'object' ? Object.keys(item.allergens).length : 0) : 0;

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      {item.image_url && (
        <CachedImage
          uri={item.image_url}
          style={styles.image}
          contentFit="cover"
          transition={200}
          priority="normal"
        />
      )}
      {isOffer && (
        <View style={styles.offerBadge}>
          <Text style={styles.offerBadgeText}>ANGEBOT</Text>
        </View>
      )}
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name}>{item.name}</Text>
          {onToggleFavorite && (
            <TouchableOpacity onPress={onToggleFavorite} style={styles.favoriteButton}>
              <Ionicons 
                name={isFavorite ? 'heart' : 'heart-outline'} 
                size={24} 
                color={isFavorite ? '#FF0000' : '#666'} 
              />
            </TouchableOpacity>
          )}
        </View>
        {item.description && (
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        <View style={styles.footer}>
          <View style={styles.priceContainer}>
            {specialPrice ? (
              <>
                <Text style={styles.originalPrice}>€{price.toFixed(2)}</Text>
                <Text style={styles.specialPrice}>€{specialPrice.toFixed(2)}</Text>
                <Text style={styles.savingsBadge}>
                  Spare €{(price - specialPrice).toFixed(2)}
                </Text>
              </>
            ) : (
              <Text style={styles.price}>€{price.toFixed(2)}</Text>
            )}
          </View>
          {allergenCount > 0 && (
            <View style={styles.allergens}>
              <Ionicons name="warning-outline" size={16} color="#FF6B6B" />
              <Text style={styles.allergenText}>
                {allergenCount} Allergene
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
  },
  content: {
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  favoriteButton: {
    padding: 4,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF0000',
  },
  allergens: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  allergenText: {
    fontSize: 12,
    color: '#FF6B6B',
  },
  offerBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#FF6B00',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    zIndex: 1,
  },
  offerBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  originalPrice: {
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  specialPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B00',
  },
  savingsBadge: {
    backgroundColor: '#FFE0CC',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 11,
    color: '#FF6B00',
    fontWeight: '600',
  },
});