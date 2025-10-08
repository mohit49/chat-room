import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/api.service';
import { getCurrentLocation } from '../services/location.service';
import { COLORS, GENDER_OPTIONS } from '../constants';
import { UserProfile } from '../types';
import AvatarUploader from '../components/AvatarUploader';
import { isProfileComplete, getMissingProfileFields } from '../utils/profile';

// Calculate age from birth date
const calculateAge = (birthDate: string): number => {
  if (!birthDate) return 0;
  
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};

// Get max date (16 years ago from today) in YYYY-MM-DD format
const getMaxDate = (): string => {
  const today = new Date();
  const maxDate = new Date(today.getFullYear() - 16, today.getMonth(), today.getDate());
  const year = maxDate.getFullYear();
  const month = String(maxDate.getMonth() + 1).padStart(2, '0');
  const day = String(maxDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

type ProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Profile'>;

interface Props {
  navigation: ProfileScreenNavigationProp;
}

export default function ProfileScreen({ navigation }: Props) {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [profile, setProfile] = useState<UserProfile>({
    birthDate: '',
    age: 0,
    gender: '',
    location: {
      latitude: 0,
      longitude: 0,
      address: '',
    },
    profilePicture: undefined,
  });

  // Check profile completion status
  const isComplete = isProfileComplete(profile, username);
  const missingFields = getMissingProfileFields(profile, username);

  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      // Ensure we load the complete profile including profilePicture
      setProfile({
        birthDate: user.profile.birthDate || '',
        age: user.profile.age || 0,
        gender: user.profile.gender || '',
        location: user.profile.location || {
          latitude: 0,
          longitude: 0,
          address: ''
        },
        profilePicture: user.profile.profilePicture
      });
    } else {
      // If no user, redirect to login
      navigation.replace('Login');
    }
  }, [user, navigation]);

  const validateUsername = (text: string): boolean => {
    // No spaces allowed
    if (/\s/.test(text)) {
      setUsernameError('Username cannot contain spaces');
      return false;
    }

    // Must start with letter or number
    if (!/^[a-zA-Z0-9]/.test(text)) {
      setUsernameError('Username must start with letter or number');
      return false;
    }

    // Length check
    if (text.length > 0 && text.length < 3) {
      setUsernameError('Username must be at least 3 characters');
      return false;
    }

    if (text.length > 20) {
      setUsernameError('Username must be at most 20 characters');
      return false;
    }

    // Format check
    if (!/^[a-zA-Z0-9][a-zA-Z0-9_\-\.!@#$%^&*()+=]*$/.test(text)) {
      setUsernameError('Invalid characters in username');
      return false;
    }

    setUsernameError('');
    return true;
  };

  const handleUpdateProfile = async () => {
    setLoading(true);
    
    // Calculate age from birth date
    const calculatedAge = calculateAge(profile.birthDate);
    
    // Validate minimum age (16 years)
    if (profile.birthDate && calculatedAge < 16) {
      Alert.alert('Age Requirement', 'You must be at least 16 years old to use this service.');
      setLoading(false);
      return;
    }

    // Update username if changed
    if (username && username !== user?.username) {
      if (!validateUsername(username)) {
        Alert.alert('Invalid Username', usernameError);
        setLoading(false);
        return;
      }

      try {
        const usernameResponse = await apiService.updateUsername(username);
        if (!usernameResponse.success) {
          Alert.alert('Error', usernameResponse.error || 'Username already taken');
          setLoading(false);
          return;
        }
        // Update local username state
        if (usernameResponse.user) {
          setUsername(usernameResponse.user.username || username);
        }
      } catch (error: any) {
        Alert.alert('Error', error.message || 'Failed to update username');
        setLoading(false);
        return;
      }
    }
    
    try {
      const response = await apiService.updateProfile({
        birthDate: profile.birthDate,
        age: calculatedAge,
        gender: profile.gender as any,
        profilePicture: profile.profilePicture,
      } as any);

      if (response.success && response.user) {
        // Update local state with response from server
        setProfile({
          birthDate: response.user.profile.birthDate || '',
          age: response.user.profile.age || 0,
          gender: response.user.profile.gender || '',
          location: response.user.profile.location || profile.location,
          profilePicture: response.user.profile.profilePicture
        });
        Alert.alert('Success', 'Profile updated successfully!');
        
        // Profile updated successfully - user can manually navigate to home
        console.log('Mobile Profile updated successfully');
      } else {
        Alert.alert('Error', response.error || 'Failed to update profile');
      }
    } catch (error: any) {
      // Check if it's an auth error
      if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        Alert.alert('Session Expired', 'Please login again.', [
          {
            text: 'OK',
            onPress: () => navigation.replace('Login'),
          },
        ]);
      } else {
        Alert.alert('Error', error.message || 'Failed to update profile');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateLocation = async () => {
    setLoading(true);
    try {
      const location = await getCurrentLocation();
      
      const response = await apiService.updateLocation({
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address,
      });

      if (response.success && response.user) {
        setProfile(response.user.profile);
        Alert.alert('Success', 'Location updated successfully!');
      } else {
        Alert.alert('Error', response.error || 'Failed to update location');
      }
    } catch (error: any) {
      // Check if it's an auth error
      if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        Alert.alert('Session Expired', 'Please login again.', [
          {
            text: 'OK',
            onPress: () => navigation.replace('Login'),
          },
        ]);
      } else {
        Alert.alert('Error', error.message || 'Failed to update location');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          navigation.replace('Login');
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Profile</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Profile Picture</Text>
        <AvatarUploader
          currentImage={profile.profilePicture?.type === 'upload' ? profile.profilePicture.url : undefined}
          avatarStyle={profile.profilePicture?.avatarStyle}
          avatarSeed={profile.profilePicture?.seed}
          username={user?.mobileNumber || ''}
          onImageChange={(imageData, type, style, seed) => {
            setProfile({
              ...profile,
              profilePicture: {
                type,
                url: type === 'upload' ? imageData : undefined,
                avatarStyle: style,
                seed: seed,
              }
            });
          }}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Personal Information</Text>
        <Text style={styles.label}>Mobile: {user?.mobileNumber}</Text>
        
        {!isComplete && (
          <View style={styles.completionIndicator}>
            <View style={styles.completionHeader}>
              <View style={styles.completionDot} />
              <Text style={styles.completionTitle}>
                Complete your profile to access all features
              </Text>
            </View>
            <Text style={styles.completionText}>
              Missing: {missingFields.join(', ')}
            </Text>
          </View>
        )}

        <Text style={styles.label}>Username (unique, no spaces)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., john_doe123 or cool@user!"
          value={username}
          onChangeText={(text) => {
            setUsername(text);
            validateUsername(text);
          }}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {usernameError && (
          <Text style={styles.errorText}>⚠️ {usernameError}</Text>
        )}
        <Text style={styles.helperText}>
          3-20 characters. Letters, numbers, special characters. No spaces.
        </Text>

        <Text style={styles.label}>Birth Date (Must be 16+ years old)</Text>
        <TextInput
          style={styles.input}
          placeholder={`YYYY-MM-DD (Max: ${getMaxDate()})`}
          value={profile.birthDate}
          onChangeText={(text) => {
            const calculatedAge = calculateAge(text);
            setProfile({ ...profile, birthDate: text, age: calculatedAge });
            
            // Show alert if age is less than 16
            if (calculatedAge < 16 && calculatedAge > 0) {
              Alert.alert('Age Requirement', 'You must be at least 16 years old to use this service.');
            }
          }}
        />
        {profile.birthDate && calculateAge(profile.birthDate) < 16 && calculateAge(profile.birthDate) > 0 && (
          <Text style={styles.warningText}>⚠️ Minimum age requirement: 16 years</Text>
        )}

        <Text style={styles.label}>Age (Auto-calculated)</Text>
        <TextInput
          style={[styles.input, styles.inputDisabled]}
          placeholder="Auto-calculated from birth date"
          value={profile.birthDate ? calculateAge(profile.birthDate).toString() : ''}
          editable={false}
        />

        <Text style={styles.label}>Gender</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={profile.gender}
            onValueChange={(value) => setProfile({ ...profile, gender: value })}
            style={styles.picker}
          >
            <Picker.Item label="Select gender" value="" />
            {GENDER_OPTIONS.map((option) => (
              <Picker.Item key={option.value} label={option.label} value={option.value} />
            ))}
          </Picker>
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleUpdateProfile}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Update Profile</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Location</Text>
        {profile.location.address && (
          <View style={styles.locationInfo}>
            <Text style={styles.locationText}>{profile.location.address}</Text>
            {profile.location.latitude !== 0 && (
              <>
                <Text style={styles.coordText}>
                  Latitude: {profile.location.latitude.toFixed(6)}
                </Text>
                <Text style={styles.coordText}>
                  Longitude: {profile.location.longitude.toFixed(6)}
                </Text>
              </>
            )}
          </View>
        )}

        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary, loading && styles.buttonDisabled]}
          onPress={handleUpdateLocation}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : (
            <Text style={styles.buttonTextSecondary}>Update Current Location</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  logoutButton: {
    padding: 8,
  },
  logoutText: {
    color: COLORS.error,
    fontSize: 16,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: COLORS.inputBackground,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputDisabled: {
    backgroundColor: '#f0f0f0',
    color: '#666',
  },
  pickerContainer: {
    backgroundColor: COLORS.inputBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonSecondary: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextSecondary: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  locationInfo: {
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  locationText: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 8,
  },
  coordText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  warningText: {
    fontSize: 12,
    color: COLORS.error,
    marginTop: 4,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.error,
    marginTop: 4,
  },
  helperText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 4,
    marginBottom: 12,
  },
  completionIndicator: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#f59e0b',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    marginBottom: 16,
  },
  completionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  completionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f59e0b',
  },
  completionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
  },
  completionText: {
    fontSize: 12,
    color: '#a16207',
  },
});

