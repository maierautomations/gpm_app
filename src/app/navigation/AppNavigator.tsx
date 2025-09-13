import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from '../../features/home/screens/HomeScreen';
import MenuScreen from '../../features/menu/screens/MenuScreen';
import EventsScreen from '../../features/events/screens/EventsScreen';
import ChatbotScreen from '../../features/chat/screens/ChatbotScreen';
import ProfileScreen from '../../features/profile/screens/ProfileScreen';
import GalleryScreen from '../../features/gallery/screens/GalleryScreen';
import AboutUsScreen from '../../features/settings/screens/AboutUsScreen';
import HelpSupportScreen from '../../features/settings/screens/HelpSupportScreen';
import LanguageSettingsScreen from '../../features/settings/screens/LanguageSettingsScreen';
import NotificationSettingsScreen from '../../features/settings/screens/NotificationSettingsScreen';

// Rest of the file is unchanged

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Menu') iconName = focused ? 'restaurant' : 'restaurant-outline';
          else if (route.name === 'Events') iconName = focused ? 'calendar' : 'calendar-outline';
          else if (route.name === 'Chat') iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          else iconName = focused ? 'person' : 'person-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#FF0000',  // Red for restaurant theme
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Menu" component={MenuScreen} />
      <Tab.Screen name="Events" component={EventsScreen} />
      <Tab.Screen name="Chat" component={ChatbotScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator({ navigationRef }: { navigationRef?: any }) {
  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator initialRouteName="Main">
        <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
        <Stack.Screen 
          name="Gallery" 
          component={GalleryScreen} 
          options={{ 
            headerShown: false,
            presentation: 'modal'
          }} 
        />
        <Stack.Screen 
          name="AboutUs" 
          component={AboutUsScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="HelpSupport" 
          component={HelpSupportScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="LanguageSettings" 
          component={LanguageSettingsScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="NotificationSettings" 
          component={NotificationSettingsScreen} 
          options={{ headerShown: false }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}