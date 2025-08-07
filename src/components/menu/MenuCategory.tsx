import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface MenuCategoryProps {
  categories: Array<{
    id: string;
    label: string;
  }>;
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
  showFavoritesOnly?: boolean;
  onToggleFavorites?: () => void;
  favoritesCount?: number;
}

export default function MenuCategory({ 
  categories, 
  selectedCategory, 
  onSelectCategory,
  showFavoritesOnly,
  onToggleFavorites,
  favoritesCount = 0
}: MenuCategoryProps) {
  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {onToggleFavorites && (
          <TouchableOpacity
            style={[
              styles.categoryButton,
              styles.favoriteButton,
              showFavoritesOnly && styles.favoriteButtonActive
            ]}
            onPress={onToggleFavorites}
          >
            <Ionicons 
              name={showFavoritesOnly ? "heart" : "heart-outline"} 
              size={16} 
              color={showFavoritesOnly ? "white" : "#FF0000"} 
            />
            <Text style={[
              styles.categoryText,
              showFavoritesOnly && styles.categoryTextActive
            ]}>
              Favoriten {favoritesCount > 0 && `(${favoritesCount})`}
            </Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[
            styles.categoryButton,
            !selectedCategory && !showFavoritesOnly && styles.categoryButtonActive
          ]}
          onPress={() => onSelectCategory(null)}
        >
          <Text style={[
            styles.categoryText,
            !selectedCategory && !showFavoritesOnly && styles.categoryTextActive
          ]}>
            Alle
          </Text>
        </TouchableOpacity>
        
        {categories.map(category => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryButton,
              selectedCategory === category.id && !showFavoritesOnly && styles.categoryButtonActive
            ]}
            onPress={() => onSelectCategory(category.id)}
          >
            <Text style={[
              styles.categoryText,
              selectedCategory === category.id && !showFavoritesOnly && styles.categoryTextActive
            ]}>
              {category.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
  },
  categoryButtonActive: {
    backgroundColor: '#FF0000',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  categoryTextActive: {
    color: 'white',
  },
  favoriteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#FF0000',
    backgroundColor: 'white',
  },
  favoriteButtonActive: {
    backgroundColor: '#FF0000',
    borderColor: '#FF0000',
  },
});