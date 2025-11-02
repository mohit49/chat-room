import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useAuth } from './useAuth';
import { apiService } from '../services/api.service';
import { UserProfile, Location } from '../types';

interface ProfileUpdateState {
  loading: boolean;
  error: string | null;
}

interface ProfileUpdateOptions {
  optimistic?: boolean; // Whether to update UI immediately
  showAlert?: boolean; // Whether to show success alert
  successMessage?: string; // Custom success message
}

export function useProfileUpdate() {
  const { user, updateUser } = useAuth();
  const [state, setState] = useState<ProfileUpdateState>({
    loading: false,
    error: null,
  });

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Calculate age from birth date
  const calculateAge = useCallback((birthDate: string): number => {
    if (!birthDate) return 0;
    
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }, []);

  // Update profile with comprehensive error handling and optimistic updates
  const updateProfile = useCallback(async (
    profileData: Partial<UserProfile>,
    options: ProfileUpdateOptions = {}
  ): Promise<boolean> => {
    const { 
      optimistic = true, 
      showAlert = true, 
      successMessage = 'Profile updated successfully!' 
    } = options;

    if (!user) {
      setError('User not found. Please login again.');
      return false;
    }

    // Validate age if birthDate is being updated
    if (profileData.birthDate) {
      const age = calculateAge(profileData.birthDate);
      if (age < 16) {
        setError('You must be at least 16 years old to use this service.');
        if (showAlert) {
          Alert.alert('Age Requirement', 'You must be at least 16 years old to use this service.');
        }
        return false;
      }
      // Auto-calculate age
      profileData.age = age;
    }

    setLoading(true);
    clearError();

    // Store original profile for potential revert
    const originalProfile = user.profile;

    // Optimistic update
    if (optimistic && updateUser) {
      updateUser({
        ...user,
        profile: {
          ...user.profile,
          ...profileData,
        },
      });
    }

    try {
      console.log('🔄 Mobile: Updating profile:', JSON.stringify(profileData, null, 2));

      const response = await apiService.updateProfile(profileData as any);

      if (response.success && response.user) {
        // Update context with server response (in case server modified data)
        if (updateUser) {
          updateUser(response.user);
        }
        
        if (showAlert) {
          Alert.alert('Success', successMessage);
        }
        
        console.log('✅ Mobile: Profile updated successfully');
        return true;
      } else {
        // Revert optimistic update on failure
        if (optimistic && updateUser) {
          updateUser({
            ...user,
            profile: originalProfile,
          });
        }
        
        const errorMessage = response.error || 'Failed to update profile';
        setError(errorMessage);
        if (showAlert) {
          Alert.alert('Error', errorMessage);
        }
        return false;
      }
    } catch (error: any) {
      console.error('❌ Mobile: Profile update error:', error);
      
      // Revert optimistic update on error
      if (optimistic && updateUser) {
        updateUser({
          ...user,
          profile: originalProfile,
        });
      }
      
      const errorMessage = error.message || 'Failed to update profile';
      setError(errorMessage);
      
      // Check if it's an auth error
      if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        if (showAlert) {
          Alert.alert('Session Expired', 'Please login again.');
        }
      } else if (showAlert) {
        Alert.alert('Error', errorMessage);
      }
      
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, updateUser, calculateAge, setLoading, clearError, setError]);

  // Update username with validation
  const updateUsername = useCallback(async (
    username: string,
    options: ProfileUpdateOptions = {}
  ): Promise<boolean> => {
    const { 
      showAlert = true, 
      successMessage = 'Username updated successfully!' 
    } = options;

    if (!username.trim()) {
      const errorMessage = 'Username cannot be empty.';
      setError(errorMessage);
      if (showAlert) {
        Alert.alert('Error', errorMessage);
      }
      return false;
    }

    setLoading(true);
    clearError();

    // Store original username for potential revert
    const originalUsername = user?.username;

    try {
      const response = await apiService.updateUsername(username);

      if (response.success && response.user) {
        // Update context with server response
        if (updateUser) {
          updateUser(response.user);
        }
        
        if (showAlert) {
          Alert.alert('Success', successMessage);
        }
        
        console.log('✅ Mobile: Username updated successfully');
        return true;
      } else {
        const errorMessage = response.error || 'Failed to update username';
        setError(errorMessage);
        if (showAlert) {
          Alert.alert('Error', errorMessage);
        }
        return false;
      }
    } catch (error: any) {
      console.error('❌ Mobile: Username update error:', error);
      
      const errorMessage = error.message || 'Failed to update username';
      setError(errorMessage);
      
      if (showAlert) {
        Alert.alert('Error', errorMessage);
      }
      
      return false;
    } finally {
      setLoading(false);
    }
  }, [user?.username, updateUser, setLoading, clearError, setError]);

  // Update location
  const updateLocation = useCallback(async (
    locationData: Location,
    options: ProfileUpdateOptions = {}
  ): Promise<boolean> => {
    const { 
      optimistic = true, 
      showAlert = true, 
      successMessage = 'Location updated successfully!' 
    } = options;

    if (!user) {
      setError('User not found. Please login again.');
      return false;
    }

    setLoading(true);
    clearError();

    // Store original location for potential revert
    const originalLocation = user.profile?.location;

    // Optimistic update
    if (optimistic && updateUser) {
      updateUser({
        ...user,
        profile: {
          ...user.profile,
          location: locationData,
        },
      });
    }

    try {
      const response = await apiService.updateLocation(locationData);

      if (response.success && response.user) {
        // Update context with server response
        if (updateUser) {
          updateUser(response.user);
        }
        
        if (showAlert) {
          Alert.alert('Success', successMessage);
        }
        
        console.log('✅ Mobile: Location updated successfully');
        return true;
      } else {
        // Revert optimistic update
        if (optimistic && updateUser && originalLocation) {
          updateUser({
            ...user,
            profile: {
              ...user.profile,
              location: originalLocation,
            },
          });
        }
        
        const errorMessage = response.error || 'Failed to update location';
        setError(errorMessage);
        if (showAlert) {
          Alert.alert('Error', errorMessage);
        }
        return false;
      }
    } catch (error: any) {
      console.error('❌ Mobile: Location update error:', error);
      
      // Revert optimistic update
      if (optimistic && updateUser && originalLocation) {
        updateUser({
          ...user,
          profile: {
            ...user.profile,
            location: originalLocation,
          },
        });
      }
      
      const errorMessage = error.message || 'Failed to update location';
      setError(errorMessage);
      
      if (showAlert) {
        Alert.alert('Error', errorMessage);
      }
      
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, updateUser, setLoading, clearError, setError]);

  // Update profile picture
  const updateProfilePicture = useCallback(async (
    profilePicture: UserProfile['profilePicture'],
    options: ProfileUpdateOptions = {}
  ): Promise<boolean> => {
    const { 
      optimistic = true, 
      showAlert = true, 
      successMessage = 'Profile picture updated successfully!' 
    } = options;

    // Optimistic update for immediate UI feedback
    if (optimistic && updateUser && user) {
      updateUser({
        ...user,
        profile: {
          ...user.profile,
          profilePicture,
        },
      });
    }

    // Update profile with the new picture
    const success = await updateProfile(
      { profilePicture },
      { optimistic: false, showAlert, successMessage }
    );

    return success;
  }, [updateProfile, updateUser, user]);

  return {
    // State
    loading: state.loading,
    error: state.error,
    
    // Actions
    updateProfile,
    updateUsername,
    updateLocation,
    updateProfilePicture,
    
    // Utilities
    clearError,
    calculateAge,
  };
}

