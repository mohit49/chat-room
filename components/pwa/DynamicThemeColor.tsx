'use client';

import { useEffect } from 'react';
import { useTheme } from '@/lib/contexts/ThemeContext';

/**
 * DynamicThemeColor component
 * Updates the PWA theme-color meta tag to match the current theme
 */
export function DynamicThemeColor() {
  const { actualTheme } = useTheme();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Define theme colors based on theme
    // Light theme: Use light background (oklch(0.995 0.005 240) ≈ #FDFEFF)
    // Dark theme: Use dark background (oklch(0.145 0 0) ≈ #252525)
    const themeColor = actualTheme === 'dark' 
      ? '#252525' // Dark theme background
      : '#FDFEFF'; // Light theme background

    // Update all theme-color meta tags
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', themeColor);
    }

    // Also update for Apple devices
    const appleStatusBarMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (appleStatusBarMeta) {
      // 'black-translucent' for dark theme gives a nice dark status bar
      // 'default' for light theme gives a white status bar
      appleStatusBarMeta.setAttribute('content', actualTheme === 'dark' ? 'black-translucent' : 'default');
    }

    // Log for debugging
    console.log(`🎨 PWA theme color updated to: ${themeColor} (${actualTheme} theme)`);
  }, [actualTheme]);

  // This component doesn't render anything
  return null;
}

