"use client";

import React, { useState, useEffect } from 'react';
import { PWAInstallPrompt } from './PWAInstallPrompt';

interface PWAManagerProps {
  children: React.ReactNode;
}

export function PWAManager({ children }: PWAManagerProps) {
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isServiceWorkerRegistered, setIsServiceWorkerRegistered] = useState(false);

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered successfully:', registration);
          setIsServiceWorkerRegistered(true);
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    }

    // Check if we should show install prompt
    const shouldShowInstallPrompt = () => {
      // Don't show if already installed
      if (window.matchMedia('(display-mode: standalone)').matches) {
        return false;
      }

      // Check if user has dismissed before
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (dismissed) {
        const dismissedTime = parseInt(dismissed);
        const now = Date.now();
        // Show again after 7 days
        if (now - dismissedTime < 7 * 24 * 60 * 60 * 1000) {
          return false;
        }
      }

      return true;
    };

    // Show install prompt after a delay
    const timer = setTimeout(() => {
      if (shouldShowInstallPrompt()) {
        setShowInstallPrompt(true);
      }
    }, 3000); // Show after 3 seconds

    return () => clearTimeout(timer);
  }, []);

  const handleInstallPromptClose = () => {
    setShowInstallPrompt(false);
    // Remember that user dismissed the prompt
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  const handleInstall = () => {
    console.log('PWA installed successfully');
    // You can add analytics tracking here
  };

  return (
    <>
      {children}
      <PWAInstallPrompt
        isOpen={showInstallPrompt}
        onClose={handleInstallPromptClose}
        onInstall={handleInstall}
      />
    </>
  );
}
