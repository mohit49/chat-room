'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthToken, setAuthToken, removeAuthToken, isTokenExpired } from '@/lib/auth';
import { api } from '@/lib/api';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (mobileNumber: string, otp: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const isAuthenticated = !!user;

  // Initialize authentication on mount
  useEffect(() => {
    initializeAuth();
    
    // Listen for storage changes (when token is removed by API client)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_token' && e.newValue === null) {
        console.log('🔐 Token removed by API client, updating user state');
        setUser(null);
      }
    };
    
    // Listen for custom auth token removal event
    const handleAuthTokenRemoved = () => {
      console.log('🔐 Auth token removed event received, updating user state');
      setUser(null);
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('authTokenRemoved', handleAuthTokenRemoved);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authTokenRemoved', handleAuthTokenRemoved);
    };
  }, []);

  const initializeAuth = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      
      if (!token) {
        console.log('🔐 No token found');
        setLoading(false);
        return;
      }

      if (isTokenExpired(token)) {
        console.log('🔐 Token expired, removing');
        removeAuthToken();
        setLoading(false);
        return;
      }

      // Fetch user profile
      const response = await api.getProfile(token);
      if (response.success && response.user) {
        console.log('🔐 User authenticated:', response.user.username || response.user.mobileNumber);
        setUser(response.user as User);
      } else {
        console.log('🔐 Profile fetch failed, removing token');
        removeAuthToken();
        setUser(null);
      }
    } catch (error) {
      console.error('🔐 Auth initialization error:', error);
      removeAuthToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (mobileNumber: string, otp: string): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await api.login(mobileNumber, otp);
      
      if (response.success && response.token && response.user) {
        setAuthToken(response.token);
        setUser(response.user as User);
        console.log('🔐 Login successful:', response.user.username || response.user.mobileNumber);
        return true;
      } else {
        console.log('🔐 Login failed:', response.error);
        return false;
      }
    } catch (error) {
      console.error('🔐 Login error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await api.logout();
    } catch (error) {
      console.error('🔐 Logout error:', error);
    } finally {
      removeAuthToken();
      setUser(null);
      // Don't redirect here - let GlobalAuthChecker handle it
    }
  };

  const refreshUser = async (): Promise<void> => {
    const token = getAuthToken();
    if (!token || isTokenExpired(token)) {
      setUser(null);
      return;
    }

    try {
      const response = await api.getProfile(token);
      if (response.success && response.user) {
        setUser(response.user as User);
      } else {
        removeAuthToken();
        setUser(null);
      }
    } catch (error) {
      console.error('🔐 Refresh user error:', error);
      removeAuthToken();
      setUser(null);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
