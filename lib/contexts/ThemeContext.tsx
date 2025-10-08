'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { api } from '@/lib/api';
import { getAuthToken } from '@/lib/auth';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  actualTheme: 'light' | 'dark'; // The actual theme being applied
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [theme, setThemeState] = useState<Theme>('system');
  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  // Get system theme preference
  const getSystemTheme = (): 'light' | 'dark' => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  };

  // Handle mounting to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Update actual theme based on current theme setting
  useEffect(() => {
    if (mounted) {
      if (theme === 'system') {
        setActualTheme(getSystemTheme());
      } else {
        setActualTheme(theme);
      }
    }
  }, [theme, mounted]);

  // Listen for system theme changes
  useEffect(() => {
    if (theme === 'system' && mounted && typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => setActualTheme(getSystemTheme());
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme, mounted]);

  // Load theme from user profile
  useEffect(() => {
    if (user?.profile?.theme) {
      setThemeState(user.profile.theme as Theme);
    }
  }, [user]);

  // Apply theme to document
  useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(actualTheme);
    }
  }, [actualTheme, mounted]);

  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme);
    
    // Save to user profile
    if (user) {
      try {
        const token = getAuthToken();
        if (token) {
          await api.updateProfile(token, {
            theme: newTheme,
          } as any);
        }
      } catch (error) {
        console.error('Failed to save theme preference:', error);
      }
    }
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <ThemeContext.Provider value={{ theme: 'system', setTheme, actualTheme: 'light' }}>
        {children}
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, actualTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
