import React, { useState, useEffect } from 'react';
import { 
  View, 
  FlatList, 
  ActivityIndicator, 
  StyleSheet, 
  Text,
  RefreshControl,
  TextInput,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MenuService from '../services/menu/menuService';
import MenuItem from '../components/menu/MenuItem';
import MenuCategory from '../components/menu/MenuCategory';
import { useUserStore } from '../stores/userStore';
import { Database } from '../services/supabase/database.types';

type MenuItemType = Database['public']['Tables']['menu_items']['Row'];

export default function MenuScreen() {
  const [menuItems, setMenuItems] = useState<MenuItemType[]>([]);
  const [filteredItems, setFilteredItems] = useState<MenuItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<number[]>([]);
  const [categories, setCategories] = useState<Array<{ id: string; label: string }>>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  
  const user = useUserStore(state => state.user);

  useEffect(() => {
    loadMenuItems();
    loadCategories();
    if (user) {
      loadFavorites();
    }

    // Subscribe to real-time updates
    const subscription = MenuService.subscribeToMenuUpdates(() => {
      loadMenuItems();
      loadCategories();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  useEffect(() => {
    filterItems();
  }, [menuItems, selectedCategory, searchQuery, showFavoritesOnly, favorites]);

  const loadMenuItems = async () => {
    try {
      const items = await MenuService.getMenuItems();
      setMenuItems(items);
    } catch (error) {
      console.error('Error loading menu:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadCategories = async () => {
    try {
      const cats = await MenuService.getCategories();
      const formattedCategories = cats.map(cat => ({
        id: cat,
        label: cat.charAt(0).toUpperCase() + cat.slice(1)
      }));
      setCategories(formattedCategories);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadFavorites = async () => {
    if (!user) return;
    try {
      const favoriteItems = await MenuService.getFavorites(user.id);
      setFavorites(favoriteItems.map(item => item.id));
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const filterItems = () => {
    let filtered = [...menuItems];

    // Filter by favorites
    if (showFavoritesOnly) {
      filtered = filtered.filter(item => favorites.includes(item.id));
    }

    // Filter by category
    if (selectedCategory && !showFavoritesOnly) {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredItems(filtered);
  };

  const handleToggleFavorite = async (itemId: number) => {
    if (!user) {
      // TODO: Show login prompt
      alert('Bitte melden Sie sich an, um Favoriten zu speichern');
      return;
    }

    const success = await MenuService.toggleFavorite(itemId, user.id);
    if (success) {
      if (favorites.includes(itemId)) {
        setFavorites(favorites.filter(id => id !== itemId));
      } else {
        setFavorites([...favorites, itemId]);
      }
    }
  };

  const handleItemPress = (item: MenuItemType) => {
    // TODO: Navigate to item details screen
    console.log('Item pressed:', item);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadMenuItems();
    loadCategories();
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF0000" />
        <Text style={styles.loadingText}>Speisekarte wird geladen...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Suche nach Gerichten..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
        {searchQuery.length > 0 && (
          <Ionicons 
            name="close-circle" 
            size={20} 
            color="#666" 
            onPress={() => setSearchQuery('')}
            style={styles.clearIcon}
          />
        )}
      </View>

      {categories.length > 0 && (
        <MenuCategory
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={(cat) => {
            setSelectedCategory(cat);
            setShowFavoritesOnly(false);
          }}
          showFavoritesOnly={showFavoritesOnly}
          onToggleFavorites={user ? () => {
            setShowFavoritesOnly(!showFavoritesOnly);
            setSelectedCategory(null);
          } : undefined}
          favoritesCount={favorites.length}
        />
      )}

      {filteredItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="restaurant-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>
            {searchQuery 
              ? 'Keine Gerichte gefunden' 
              : selectedCategory
                ? 'Keine Gerichte in dieser Kategorie'
                : 'Keine Gerichte verfügbar'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <MenuItem
              item={item}
              isFavorite={favorites.includes(item.id)}
              onPress={() => handleItemPress(item)}
              onToggleFavorite={user ? () => handleToggleFavorite(item.id) : undefined}
            />
          )}
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  clearIcon: {
    marginLeft: 8,
  },
  listContent: {
    paddingVertical: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
});