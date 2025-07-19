import { Text, View, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { useUserStore } from '../stores/userStore';
import { signIn, signUp, signOut } from '../features/auth/services/authService';
import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase/client';

export default function ProfileScreen() {
  const { user, setUser } = useUserStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState('');
  const [favorites, setFavorites] = useState<number[]>([]);  // e.g., menu item IDs

  useEffect(() => {
    if (user) {
      supabase.from('profiles').select('full_name, favorites').eq('id', user.id).single().then(({ data, error }) => {
        if (error) console.error(error);
        if (data) {
          setFullName(data.full_name || '');
          setFavorites(data.favorites || []);
        }
      });
    }
  }, [user]);

  const handleAuth = async () => {
    try {
      const newUser = isSignUp ? await signUp(email, password) : await signIn(email, password);
      setUser(newUser);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setUser(null);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const updateProfile = async () => {
    try {
      await supabase.from('profiles').update({ full_name: fullName, favorites }).eq('id', user.id);
      Alert.alert('Success', 'Profile updated!');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  if (user) {
    return (
      <View style={styles.container}>
        <Text>Welcome, {user.email}!</Text>
        <TextInput placeholder="Full Name" value={fullName} onChangeText={setFullName} style={styles.input} />
        <Text>Favorites: {favorites.join(', ')}</Text>  // Temp; add UI to manage later
        <Button title="Update Profile" onPress={updateProfile} />
        <Button title="Sign Out" onPress={handleSignOut} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />
      <Button title={isSignUp ? 'Sign Up' : 'Sign In'} onPress={handleAuth} />
      <Button title={isSignUp ? 'Switch to Sign In' : 'Switch to Sign Up'} onPress={() => setIsSignUp(!isSignUp)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  input: { borderWidth: 1, borderColor: 'gray', padding: 10, marginBottom: 10, width: '80%' },
});