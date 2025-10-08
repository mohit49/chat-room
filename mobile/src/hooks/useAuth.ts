import { useState, useEffect } from 'react';
import { apiService } from '../services/api.service';
import { saveToken, getToken, removeToken, saveUser, removeUser } from '../services/storage.service';
import { User } from '../types';
import { isProfileComplete, getMissingProfileFields } from '../utils/profile';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await getToken();
      if (token) {
        const response = await apiService.getProfile();
        if (response.success && response.user) {
          setUser(response.user as User);
          setIsAuthenticated(true);
        } else {
          // Auth failed, clear everything
          await removeToken();
          await removeUser();
          setUser(null);
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
    } catch (err) {
      // Auth error, clear everything
      await removeToken();
      await removeUser();
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (mobileNumber: string, otp: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.login(mobileNumber, otp);
      
      if (response.success && response.token && response.user) {
        const userData = response.user as User;
        await saveToken(response.token);
        await saveUser(userData);
        setUser(userData);
        setIsAuthenticated(true);
        
        // Check if profile is complete - navigation will be handled by AppNavigator
        console.log('Mobile Login - Profile completion check:', {
          profile: userData.profile,
          username: userData.username,
          isComplete: isProfileComplete(userData.profile, userData.username)
        });
        
        // Show alert if profile is incomplete
        if (!isProfileComplete(userData.profile, userData.username)) {
          const missingFields = getMissingProfileFields(userData.profile, userData.username);
          // Note: Alert will be shown by AppNavigator when it redirects to Profile
        }
        
        return true;
      } else {
        setError(response.error || 'Login failed');
        return false;
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      await removeToken();
      await removeUser();
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  return {
    user,
    loading,
    error,
    isAuthenticated,
    login,
    logout,
  };
};

