import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '../../../stores/userStore';
import { signIn, signUp, signOut } from '../../auth/services/authService';
import { supabase } from '../../../services/supabase/client';
import MenuService from '../../menu/services/menuService';
import EventsService from '../../events/services/eventsService';
import { Database } from '../../../services/supabase/database.types';
import { useNavigation } from '@react-navigation/native';
import { logger } from '../../../utils/logger';
import { useToast } from '../../../shared/components';
import { validateProfile, sanitizeString } from '../../../utils/validation';

type Profile = Database['public']['Tables']['profiles']['Row'];
type MenuItem = Database['public']['Tables']['menu_items']['Row'];
type Event = Database['public']['Tables']['events']['Row'];

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { user, setUser } = useUserStore();
  const { showError, showSuccess } = useToast();

  // Auth state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  // Profile state
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState('');
  const [favoriteItems, setFavoriteItems] = useState<MenuItem[]>([]);
  const [favoriteEvents, setFavoriteEvents] = useState<Event[]>([]);
  const [editingProfile, setEditingProfile] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);

  useEffect(() => {
    if (user) {
      loadProfile();
      loadFavorites();
      loadFavoriteEvents();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    
    setLoadingProfile(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        logger.error('Error loading profile:', error);
        // Create profile if it doesn't exist
        if (error.code === 'PGRST116') {
          await createProfile();
        }
      } else if (data) {
        setProfile(data);
        setFullName(data.full_name || '');
      }
    } catch (error) {
      logger.error('Error in loadProfile:', error);
    } finally {
      setLoadingProfile(false);
    }
  };

  const createProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          full_name: null,
          favorites: [],
          favorite_events: []
        })
        .select()
        .single();

      if (!error && data) {
        setProfile(data);
      }
    } catch (error) {
      logger.error('Error creating profile:', error);
    }
  };

  const loadFavorites = async () => {
    if (!user) return;
    
    try {
      const items = await MenuService.getFavorites(user.id);
      setFavoriteItems(items);
    } catch (error) {
      logger.error('Error loading favorites:', error);
    }
  };

  const loadFavoriteEvents = async () => {
    if (!user) return;
    
    try {
      const events = await EventsService.getFavoriteEvents(user.id);
      setFavoriteEvents(events);
    } catch (error) {
      logger.error('Error loading favorite events:', error);
    }
  };

  const handleAuth = async () => {
    if (!email || !password) {
      showError('Bitte E-Mail und Passwort eingeben');
      return;
    }

    // Validate email format
    const validation = validateProfile('temp', email);
    if (!validation.isValid) {
      showError(validation.error || 'Ungültige E-Mail-Adresse');
      return;
    }

    // Use sanitized email
    const sanitizedEmail = validation.data!.email;

    // Validate password length
    if (password.length < 6) {
      showError('Passwort muss mindestens 6 Zeichen lang sein');
      return;
    }

    setLoading(true);
    try {
      const newUser = isSignUp
        ? await signUp(sanitizedEmail, password)
        : await signIn(sanitizedEmail, password);

      if (newUser) {
        setUser(newUser);
        setEmail('');
        setPassword('');
        showSuccess(isSignUp ? 'Konto erfolgreich erstellt!' : 'Erfolgreich angemeldet!');
      }
    } catch (error: any) {
      showError(
        isSignUp
          ? 'Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut.'
          : 'Anmeldung fehlgeschlagen. Bitte überprüfen Sie Ihre Anmeldedaten.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Abmelden',
      'Möchten Sie sich wirklich abmelden?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Abmelden',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              setUser(null);
              setProfile(null);
              setFullName('');
              setFavoriteItems([]);
            } catch (error: any) {
              Alert.alert('Fehler', 'Abmeldung fehlgeschlagen');
            }
          }
        }
      ]
    );
  };

  const updateProfile = async () => {
    if (!user || !profile) return;

    // Validate name
    const sanitizedName = sanitizeString(fullName);
    if (sanitizedName.length === 0) {
      showError('Name darf nicht leer sein');
      return;
    }

    if (sanitizedName.length > 100) {
      showError('Name ist zu lang (maximal 100 Zeichen)');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: sanitizedName })
        .eq('id', user.id);

      if (error) {
        showError('Profil konnte nicht aktualisiert werden');
      } else {
        showSuccess('Profil wurde aktualisiert');
        setEditingProfile(false);
        setFullName(sanitizedName);
        loadProfile();
      }
    } catch (error) {
      showError('Ein Fehler ist aufgetreten');
    } finally {
      setLoading(false);
    }
  };

  const navigateToFavorite = (item: MenuItem) => {
    navigation.navigate('Menu');
  };

  const navigateToEvent = (event: Event) => {
    navigation.navigate('Events');
  };

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'short',
    };
    return date.toLocaleDateString('de-DE', options);
  };

  // If user is not logged in, show login/signup form
  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.authContainer}
        >
          <ScrollView 
            contentContainerStyle={styles.authScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Logo/Header */}
            <View style={styles.authHeader}>
              <Ionicons name="person-circle" size={80} color="#FF0000" />
              <Text style={styles.authTitle}>
                {isSignUp ? 'Konto erstellen' : 'Willkommen zurück'}
              </Text>
              <Text style={styles.authSubtitle}>
                {isSignUp
                  ? 'Registrieren Sie sich für exklusive Angebote'
                  : 'Melden Sie sich an, um fortzufahren'}
              </Text>
            </View>

            {/* Form */}
            <View style={styles.authForm}>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  placeholder="E-Mail"
                  value={email}
                  onChangeText={setEmail}
                  style={styles.input}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  placeholder="Passwort"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  style={styles.input}
                  editable={!loading}
                />
              </View>

              <TouchableOpacity 
                style={[styles.primaryButton, loading && styles.disabledButton]}
                onPress={handleAuth}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.primaryButtonText}>
                    {isSignUp ? 'Registrieren' : 'Anmelden'}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={() => setIsSignUp(!isSignUp)}
                disabled={loading}
              >
                <Text style={styles.switchAuthText}>
                  {isSignUp 
                    ? 'Bereits ein Konto? Jetzt anmelden'
                    : 'Neu hier? Konto erstellen'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Benefits */}
            <View style={styles.benefitsContainer}>
              <Text style={styles.benefitsTitle}>Ihre Vorteile:</Text>
              <View style={styles.benefitItem}>
                <Ionicons name="gift-outline" size={20} color="#FF0000" />
                <Text style={styles.benefitText}>Exklusive Angebote erhalten</Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="heart-outline" size={20} color="#FF0000" />
                <Text style={styles.benefitText}>Favoriten speichern</Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="notifications-outline" size={20} color="#FF0000" />
                <Text style={styles.benefitText}>Angebote erhalten</Text>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // User is logged in, show profile
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.profileImageContainer}>
            <Ionicons name="person-circle" size={100} color="#FF0000" />
          </View>
          
          <View style={styles.profileInfo}>
            {editingProfile ? (
              <View style={styles.editNameContainer}>
                <TextInput
                  value={fullName}
                  onChangeText={setFullName}
                  style={styles.editNameInput}
                  placeholder="Ihr Name"
                  autoFocus
                />
                <TouchableOpacity onPress={updateProfile} disabled={loading}>
                  <Ionicons name="checkmark-circle" size={28} color="#4CAF50" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setEditingProfile(false)}>
                  <Ionicons name="close-circle" size={28} color="#FF5252" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.nameContainer}>
                <Text style={styles.profileName}>
                  {profile?.full_name || 'Gast'}
                </Text>
                <TouchableOpacity onPress={() => setEditingProfile(true)}>
                  <Ionicons name="pencil" size={20} color="#666" />
                </TouchableOpacity>
              </View>
            )}
            
            <Text style={styles.profileEmail}>{user.email}</Text>
          </View>
        </View>

        {/* Social Media Card */}
        <View style={styles.socialCard}>
          <Text style={styles.socialTitle}>Folgen Sie uns</Text>
          <Text style={styles.socialSubtitle}>Bleiben Sie auf dem Laufenden</Text>

          <View style={styles.socialButtons}>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => Linking.openURL('https://facebook.com/grillmaier149')}
            >
              <Ionicons name="logo-facebook" size={28} color="#1877F2" />
              <Text style={styles.socialButtonText}>Facebook</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => Linking.openURL('https://instagram.com/grillmaier149')}
            >
              <Ionicons name="logo-instagram" size={28} color="#E4405F" />
              <Text style={styles.socialButtonText}>Instagram</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.socialInfo}>
            <Ionicons name="information-circle-outline" size={16} color="#666" />
            <Text style={styles.socialInfoText}>
              Aktuelle Angebote, Events und Einblicke hinter die Kulissen
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('Menu')}
          >
            <Ionicons name="restaurant" size={24} color="#FF0000" />
            <Text style={styles.actionButtonText}>Speisekarte</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('Chat')}
          >
            <Ionicons name="chatbubbles" size={24} color="#FF0000" />
            <Text style={styles.actionButtonText}>Chat</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('Events')}
          >
            <Ionicons name="calendar" size={24} color="#FF0000" />
            <Text style={styles.actionButtonText}>Events</Text>
          </TouchableOpacity>
        </View>

        {/* Favorites Section */}
        {favoriteItems.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Meine Favoriten</Text>
              <Text style={styles.sectionCount}>{favoriteItems.length}</Text>
            </View>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {favoriteItems.map(item => (
                <TouchableOpacity 
                  key={item.id}
                  style={styles.favoriteCard}
                  onPress={() => navigateToFavorite(item)}
                >
                  {item.image_url && (
                    <Image source={{ uri: item.image_url }} style={styles.favoriteImage} />
                  )}
                  <Text style={styles.favoriteName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.favoritePrice}>€{parseFloat(item.price).toFixed(2)}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Favorite Events Section */}
        {favoriteEvents.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Meine Events</Text>
              <Text style={styles.sectionCount}>{favoriteEvents.length}</Text>
            </View>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {favoriteEvents.map(event => (
                <TouchableOpacity 
                  key={event.id}
                  style={styles.eventCard}
                  onPress={() => navigateToEvent(event)}
                >
                  <View style={styles.eventDateBadge}>
                    <Text style={styles.eventDateText}>{formatEventDate(event.date)}</Text>
                  </View>
                  <Text style={styles.eventName} numberOfLines={2}>{event.title}</Text>
                  <View style={styles.eventLocationRow}>
                    <Ionicons name="location-outline" size={12} color="#666" />
                    <Text style={styles.eventLocation} numberOfLines={1}>{event.location}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Einstellungen</Text>
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => navigation.navigate('NotificationSettings')}
          >
            <Ionicons name="notifications-outline" size={24} color="#666" />
            <Text style={styles.settingText}>Benachrichtigungen</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => navigation.navigate('LanguageSettings')}
          >
            <Ionicons name="language-outline" size={24} color="#666" />
            <Text style={styles.settingText}>Sprache</Text>
            <Text style={styles.settingValue}>Deutsch</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => navigation.navigate('HelpSupport')}
          >
            <Ionicons name="help-circle-outline" size={24} color="#666" />
            <Text style={styles.settingText}>Hilfe & Support</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => navigation.navigate('AboutUs')}
          >
            <Ionicons name="information-circle-outline" size={24} color="#666" />
            <Text style={styles.settingText}>Über uns</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity 
          style={styles.signOutButton}
          onPress={handleSignOut}
        >
          <Ionicons name="log-out-outline" size={24} color="#FF0000" />
          <Text style={styles.signOutText}>Abmelden</Text>
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Mitglied seit {new Date(profile?.created_at || '').toLocaleDateString('de-DE')}</Text>
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
  authContainer: {
    flex: 1,
  },
  authScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  authHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  authTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
  },
  authSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  authForm: {
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#333',
  },
  primaryButton: {
    backgroundColor: '#FF0000',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  disabledButton: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  switchAuthText: {
    textAlign: 'center',
    color: '#FF0000',
    fontSize: 14,
  },
  benefitsContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#666',
  },
  profileHeader: {
    backgroundColor: 'white',
    padding: 20,
    alignItems: 'center',
  },
  profileImageContainer: {
    marginBottom: 16,
  },
  profileInfo: {
    alignItems: 'center',
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  editNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editNameInput: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    borderBottomWidth: 1,
    borderBottomColor: '#FF0000',
    paddingBottom: 4,
    minWidth: 150,
    textAlign: 'center',
  },
  profileEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  socialCard: {
    backgroundColor: 'white',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  socialTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  socialSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  socialButton: {
    alignItems: 'center',
    padding: 12,
    flex: 1,
  },
  socialButtonText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  socialInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
  },
  socialInfoText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  actionButton: {
    alignItems: 'center',
    padding: 12,
  },
  actionButtonText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  section: {
    backgroundColor: 'white',
    marginVertical: 8,
    paddingVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionCount: {
    fontSize: 14,
    color: '#FF0000',
    fontWeight: 'bold',
  },
  favoriteCard: {
    width: 120,
    marginLeft: 20,
  },
  favoriteImage: {
    width: 120,
    height: 80,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f0f0f0',
  },
  favoriteName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  favoritePrice: {
    fontSize: 14,
    color: '#FF0000',
    fontWeight: 'bold',
    marginTop: 4,
  },
  eventCard: {
    width: 150,
    marginLeft: 20,
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  eventDateBadge: {
    backgroundColor: '#FFE5E5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  eventDateText: {
    fontSize: 11,
    color: '#FF0000',
    fontWeight: '600',
  },
  eventName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  eventLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eventLocation: {
    fontSize: 11,
    color: '#666',
    flex: 1,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  settingValue: {
    fontSize: 14,
    color: '#999',
    marginRight: 8,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF0000',
  },
  signOutText: {
    fontSize: 16,
    color: '#FF0000',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 32,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
  },
});