'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { api } from '@/lib/api';
import { getAuthToken } from '@/lib/auth';
import { UserProfile, Location } from '@/types';

interface ProfileUpdateState {
  loading: boolean;
  error: string | null;
  success: string | null;
}

interface ProfileUpdateOptions {
  optimistic?: boolean; // Whether to update UI immediately
  showSuccess?: boolean; // Whether to show success message
  successMessage?: string; // Custom success message
}

export function useProfileUpdate() {
  const { user, updateUserProfile, updateUsername: updateUsernameInContext } = useAuth();
  const [state, setState] = useState<ProfileUpdateState>({
    loading: false,
    error: null,
    success: null,
  });

  const clearMessages = useCallback(() => {
    setState(prev => ({ ...prev, error: null, success: null }));
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
  }, []);

  const setError = useCallback((error: string) => {
    setState(prev => ({ ...prev, error, success: null }));
  }, []);

  const setSuccess = useCallback((success: string) => {
    setState(prev => ({ ...prev, success, error: null }));
    // Auto-clear success message after 3 seconds
    setTimeout(() => {
      setState(prev => ({ ...prev, success: null }));
    }, 3000);
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
      showSuccess = true, 
      successMessage = 'Profile updated successfully!' 
    } = options;

    const token = getAuthToken();
    if (!token) {
      setError('Authentication token not found. Please login again.');
      return false;
    }

    if (!user) {
      setError('User not found. Please login again.');
      return false;
    }

    // Validate age if birthDate is being updated
    if (profileData.birthDate) {
      const age = calculateAge(profileData.birthDate);
      if (age < 16) {
        setError('You must be at least 16 years old to use this service.');
        return false;
      }
      // Auto-calculate age
      profileData.age = age;
    }

    setLoading(true);
    clearMessages();

    // Optimistic update
    if (optimistic) {
      updateUserProfile(profileData);
    }

    try {
      // Prepare complete profile data for update
      const updateData = {
        ...user.profile,
        ...profileData,
      };

      console.log('🔄 Updating profile:', JSON.stringify(updateData, null, 2));

      const response = await api.updateProfile(token, updateData as any);

      if (response.success && response.user) {
        // Update context with server response (in case server modified data)
        updateUserProfile(response.user.profile);
        
        if (showSuccess) {
          setSuccess(successMessage);
        }
        
        console.log('✅ Profile updated successfully');
        return true;
      } else {
        // Revert optimistic update on failure
        if (optimistic) {
          // Fetch fresh data to revert
          const freshResponse = await api.getProfile(token);
          if (freshResponse.success && freshResponse.user) {
            updateUserProfile(freshResponse.user.profile);
          }
        }
        
        setError(response.error || 'Failed to update profile');
        return false;
      }
    } catch (error: any) {
      console.error('❌ Profile update error:', error);
      
      // Revert optimistic update on error
      if (optimistic) {
        try {
          const freshResponse = await api.getProfile(token);
          if (freshResponse.success && freshResponse.user) {
            updateUserProfile(freshResponse.user.profile);
          }
        } catch (revertError) {
          console.error('Failed to revert optimistic update:', revertError);
        }
      }
      
      setError(error.message || 'Failed to update profile');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, updateUserProfile, calculateAge, setLoading, clearMessages, setError, setSuccess]);

  // Update username with validation
  const updateUsername = useCallback(async (
    username: string,
    options: ProfileUpdateOptions = {}
  ): Promise<boolean> => {
    const { 
      optimistic = true, 
      showSuccess = true, 
      successMessage = 'Username updated successfully!' 
    } = options;

    const token = getAuthToken();
    if (!token) {
      setError('Authentication token not found. Please login again.');
      return false;
    }

    if (!username.trim()) {
      setError('Username cannot be empty.');
      return false;
    }

    setLoading(true);
    clearMessages();

    // Store original username for potential revert
    const originalUsername = user?.username;

    // Optimistic update
    if (optimistic) {
      updateUsernameInContext(username);
    }

    try {
      const response = await api.updateUsername(token, username);

      if (response.success) {
        // Ensure context is updated with server response
        if (response.user?.username) {
          updateUsernameInContext(response.user.username);
        }
        
        if (showSuccess) {
          setSuccess(successMessage);
        }
        
        console.log('✅ Username updated successfully');
        return true;
      } else {
        // Revert optimistic update
        if (optimistic && originalUsername) {
          updateUsernameInContext(originalUsername);
        }
        
        setError(response.error || 'Failed to update username');
        return false;
      }
    } catch (error: any) {
      console.error('❌ Username update error:', error);
      
      // Revert optimistic update
      if (optimistic && originalUsername) {
        updateUsernameInContext(originalUsername);
      }
      
      setError(error.message || 'Failed to update username');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user?.username, updateUsernameInContext, setLoading, clearMessages, setError, setSuccess]);

  // Update location
  const updateLocation = useCallback(async (
    locationData: Location,
    options: ProfileUpdateOptions = {}
  ): Promise<boolean> => {
    const { 
      optimistic = true, 
      showSuccess = true, 
      successMessage = 'Location updated successfully!' 
    } = options;

    const token = getAuthToken();
    if (!token) {
      setError('Authentication token not found. Please login again.');
      return false;
    }

    setLoading(true);
    clearMessages();

    // Store original location for potential revert
    const originalLocation = user?.profile?.location;

    // Optimistic update
    if (optimistic) {
      updateUserProfile({ location: locationData });
    }

    try {
      const response = await api.updateLocation(token, locationData);

      if (response.success && response.user) {
        // Update context with server response
        updateUserProfile({ location: response.user.profile.location });
        
        if (showSuccess) {
          setSuccess(successMessage);
        }
        
        console.log('✅ Location updated successfully');
        return true;
      } else {
        // Revert optimistic update
        if (optimistic && originalLocation) {
          updateUserProfile({ location: originalLocation });
        }
        
        setError(response.error || 'Failed to update location');
        return false;
      }
    } catch (error: any) {
      console.error('❌ Location update error:', error);
      
      // Revert optimistic update
      if (optimistic && originalLocation) {
        updateUserProfile({ location: originalLocation });
      }
      
      setError(error.message || 'Failed to update location');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user?.profile?.location, updateUserProfile, setLoading, clearMessages, setError, setSuccess]);

  // Update profile picture
  const updateProfilePicture = useCallback(async (
    profilePicture: UserProfile['profilePicture'],
    options: ProfileUpdateOptions = {}
  ): Promise<boolean> => {
    const { 
      optimistic = true, 
      showSuccess = true, 
      successMessage = 'Profile picture updated successfully!' 
    } = options;

    // Optimistic update for immediate UI feedback
    if (optimistic) {
      updateUserProfile({ profilePicture });
    }

    // Update profile with the new picture
    const success = await updateProfile(
      { profilePicture },
      { optimistic: false, showSuccess, successMessage }
    );

    return success;
  }, [updateProfile, updateUserProfile]);

  return {
    // State
    loading: state.loading,
    error: state.error,
    success: state.success,
    
    // Actions
    updateProfile,
    updateUsername,
    updateLocation,
    updateProfilePicture,
    
    // Utilities
    clearMessages,
    calculateAge,
  };
}

