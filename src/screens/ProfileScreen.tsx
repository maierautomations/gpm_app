import { Text, View, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { useState } from 'react';
import { useUserStore } from '../stores/userStore';
import { signIn, signUp, signOut } from '../features/auth/services/authService';

export default function ProfileScreen() {
  const { user, setUser } = useUserStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

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

  if (user) {
    return (
      <View style={styles.container}>
        <Text>Welcome, {user.email}!</Text>
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