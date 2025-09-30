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
import MenuService from '../services/menuService';
import OffersService, { WeeklyOffer } from '../../offers/services/offersService';
import MenuItem from '../components/MenuItem';
import MenuCategory from '../components/MenuCategory';
import MenuItemDetailModal from '../components/MenuItemDetailModal';
import { useUserStore } from '../../../stores/userStore';
import { Database } from '../../../services/supabase/database.types';
import { useRoute, RouteProp } from '@react-navigation/native';
import { logger } from '../../../utils/logger';
import { sanitizeString, VALIDATION_LIMITS } from '../../../utils/validation';

type MenuItemType = Database['public']['Tables']['menu_items']['Row'];
type MenuScreenRouteProp = RouteProp<{ Menu: { showOffers?: boolean } }, 'Menu'>;

export default function MenuScreen() {
  const route = useRoute<MenuScreenRouteProp>();
  const [menuItems, setMenuItems] = useState<MenuItemType[]>([]);
  const [filteredItems, setFilteredItems] = useState<MenuItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<number[]>([]);
  const [categories, setCategories] = useState<Array<{ id: string; label: string }>>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showOffersOnly, setShowOffersOnly] = useState(false);
  const [currentOffers, setCurrentOffers] = useState<WeeklyOffer | null>(null);
  const [offerItemIds, setOfferItemIds] = useState<number[]>([]);
  const [offerPrices, setOfferPrices] = useState<Map<number, string>>(new Map());
  const [selectedItem, setSelectedItem] = useState<MenuItemType | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  
  const user = useUserStore(state => state.user);

  useEffect(() => {
    loadMenuItems();
    loadCategories();
    loadCurrentOffers();
    if (user) {
      loadFavorites();
    }

    // Check if we should show offers from navigation
    if (route.params?.showOffers) {
      setShowOffersOnly(true);
      setShowFavoritesOnly(false);
      setSelectedCategory(null);
    }

    // Subscribe to real-time updates
    const subscription = MenuService.subscribeToMenuUpdates(() => {
      loadMenuItems();
      loadCategories();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [user, route.params?.showOffers]);

  useEffect(() => {
    filterItems();
  }, [menuItems, selectedCategory, searchQuery, showFavoritesOnly, showOffersOnly, favorites, offerItemIds]);

  const loadMenuItems = async () => {
    try {
      const items = await MenuService.getMenuItems();
      setMenuItems(items);
    } catch (error) {
      logger.error('Error loading menu:', error);
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
      logger.error('Error loading categories:', error);
    }
  };

  const loadFavorites = async () => {
    if (!user) return;
    try {
      const favoriteItems = await MenuService.getFavorites(user.id);
      setFavorites(favoriteItems.map(item => item.id));
    } catch (error) {
      logger.error('Error loading favorites:', error);
    }
  };

  const loadCurrentOffers = async () => {
    try {
      const offers = await OffersService.getCurrentWeekOffers();
      if (offers) {
        setCurrentOffers(offers);
        // Extract item IDs and prices for easy lookup
        const ids = offers.items.map(item => item.menu_item.id);
        setOfferItemIds(ids);
        
        const prices = new Map<number, string>();
        offers.items.forEach(item => {
          prices.set(item.menu_item.id, item.special_price);
        });
        setOfferPrices(prices);
      }
    } catch (error) {
      logger.error('Error loading offers:', error);
    }
  };

  const filterItems = () => {
    let filtered = [...menuItems];

    // Filter by offers
    if (showOffersOnly) {
      filtered = filtered.filter(item => offerItemIds.includes(item.id));
    }

    // Filter by favorites
    if (showFavoritesOnly && !showOffersOnly) {
      filtered = filtered.filter(item => favorites.includes(item.id));
    }

    // Filter by category
    if (selectedCategory && !showFavoritesOnly && !showOffersOnly) {
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
    setSelectedItem(item);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedItem(null);
  };

  const handleToggleFavoriteInModal = async () => {
    if (selectedItem) {
      await handleToggleFavorite(selectedItem.id);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadMenuItems();
    loadCategories();
    loadCurrentOffers();
    if (user) {
      loadFavorites();
    }
  };

  const handleSearchChange = (text: string) => {
    // Sanitize and validate search input
    const sanitized = sanitizeString(text);

    // Enforce max length
    if (sanitized.length > VALIDATION_LIMITS.SEARCH_MAX_LENGTH) {
      setSearchQuery(sanitized.substring(0, VALIDATION_LIMITS.SEARCH_MAX_LENGTH));
    } else {
      setSearchQuery(sanitized);
    }
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
          onChangeText={handleSearchChange}
          placeholderTextColor="#999"
          maxLength={VALIDATION_LIMITS.SEARCH_MAX_LENGTH}
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
            setShowOffersOnly(false);
          }}
          showFavoritesOnly={showFavoritesOnly}
          onToggleFavorites={user ? () => {
            setShowFavoritesOnly(!showFavoritesOnly);
            setShowOffersOnly(false);
            setSelectedCategory(null);
          } : undefined}
          favoritesCount={favorites.length}
          showOffersOnly={showOffersOnly}
          onToggleOffers={currentOffers ? () => {
            setShowOffersOnly(!showOffersOnly);
            setShowFavoritesOnly(false);
            setSelectedCategory(null);
          } : undefined}
          offersWeekTheme={currentOffers?.week.week_theme}
          offersCount={currentOffers?.items.length || 0}
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
              offerPrice={offerPrices.get(item.id)}
              isOffer={offerItemIds.includes(item.id)}
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
      
      <MenuItemDetailModal
        visible={modalVisible}
        item={selectedItem}
        isFavorite={selectedItem ? favorites.includes(selectedItem.id) : false}
        onClose={handleCloseModal}
        onToggleFavorite={user ? handleToggleFavoriteInModal : undefined}
        offerPrice={selectedItem ? offerPrices.get(selectedItem.id) : undefined}
        isOffer={selectedItem ? offerItemIds.includes(selectedItem.id) : false}
      />
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