import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/api.service';
import { User } from '../types';

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

  // Get system theme preference (simplified for mobile)
  const getSystemTheme = (): 'light' | 'dark' => {
    // For mobile, we'll default to light for now
    // In a real app, you might use Appearance API
    return 'light';
  };

  // Update actual theme based on current theme setting
  useEffect(() => {
    if (theme === 'system') {
      setActualTheme(getSystemTheme());
    } else {
      setActualTheme(theme);
    }
  }, [theme]);

  // Load theme from user profile
  useEffect(() => {
    if (user?.profile?.theme) {
      setThemeState(user.profile.theme as Theme);
    }
  }, [user]);

  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme);
    
    // Save to user profile
    if (user) {
      try {
        await apiService.updateProfile({
          theme: newTheme,
        } as any);
      } catch (error) {
        console.error('Failed to save theme preference:', error);
      }
    }
  };

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
