import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import ProfileScreen from '../screens/ProfileScreen';
import HomeScreen from '../screens/HomeScreen';
import { getToken, getUser } from '../services/storage.service';
import { isProfileComplete, getMissingProfileFields } from '../utils/profile';
import { useAuth } from '../hooks/useAuth';
import { Alert } from 'react-native';
import { COLORS } from '../constants';

export type RootStackParamList = {
  Login: undefined;
  Profile: undefined;
  Home: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { user, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState<'Login' | 'Profile' | 'Home'>('Login');

  useEffect(() => {
    checkLoginStatus();
  }, []);

  useEffect(() => {
    // Handle navigation when user state changes
    if (!loading) {
      if (user) {
        if (isProfileComplete(user.profile, user.username)) {
          setInitialRoute('Home');
        } else {
          const missingFields = getMissingProfileFields(user.profile, user.username);
          Alert.alert(
            'Profile Incomplete',
            `Please complete your profile first. Missing: ${missingFields.join(', ')}`,
            [{ text: 'OK' }]
          );
          setInitialRoute('Profile');
        }
      } else {
        setInitialRoute('Login');
      }
    }
  }, [user, loading]);

  const checkLoginStatus = async () => {
    try {
      const token = await getToken();
      if (token) {
        const user = await getUser();
        if (user && isProfileComplete(user.profile, user.username)) {
          setInitialRoute('Home');
        } else {
          setInitialRoute('Profile');
        }
      } else {
        setInitialRoute('Login');
      }
    } catch (error) {
      setInitialRoute('Login');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
});


