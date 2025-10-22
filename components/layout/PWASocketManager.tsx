"use client";

import { useEffect, useRef } from 'react';
import { useSocket } from '@/lib/contexts/SocketContext';

export function PWASocketManager() {
  const { socket, connected } = useSocket();
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isPWA = useRef(false);

  useEffect(() => {
    // Check if running in PWA mode
    isPWA.current = typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches;
    
    if (!isPWA.current) return;

    console.log('📱 PWA Socket Manager initialized');

    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('📱 App went to background');
        // Send app background event to server
        if (socket && connected) {
          socket.emit('app_background');
        }
        // App went to background - ensure socket stays connected
        if (socket && !connected) {
          console.log('🔄 Attempting to reconnect socket in background...');
          socket.connect();
        }
      } else {
        console.log('📱 App came to foreground');
        // Send app foreground event to server
        if (socket && connected) {
          socket.emit('app_foreground');
        }
        // App came to foreground - check socket connection
        if (socket && !connected) {
          console.log('🔄 Attempting to reconnect socket in foreground...');
          socket.connect();
        }
      }
    };

    const handleOnline = () => {
      console.log('🌐 Network came online');
      if (socket && !connected) {
        console.log('🔄 Attempting to reconnect socket after network recovery...');
        socket.connect();
      }
    };

    const handleOffline = () => {
      console.log('🌐 Network went offline');
      // Clear any pending reconnection attempts
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };

    const handlePageShow = (event: PageTransitionEvent) => {
      console.log('📱 Page shown, persisted:', event.persisted);
      if (socket && !connected) {
        console.log('🔄 Attempting to reconnect socket after page show...');
        socket.connect();
      }
    };

    const handlePageHide = () => {
      console.log('📱 Page hidden');
      // Send app closing event to server
      if (socket && connected) {
        socket.emit('closing_app');
      }
      // Don't disconnect socket when page is hidden in PWA
    };

    // Add beforeunload event listener for explicit app close
    const handleBeforeUnload = () => {
      console.log('📱 App is closing');
      if (socket && connected) {
        socket.emit('closing_app');
      }
    };

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Periodic connection check for PWA
    const connectionCheckInterval = setInterval(() => {
      if (socket && !connected && isPWA.current) {
        console.log('🔄 Periodic connection check - attempting reconnect...');
        socket.connect();
      }
    }, 30000); // Check every 30 seconds

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      clearInterval(connectionCheckInterval);
    };
  }, [socket, connected]);

  // This component doesn't render anything
  return null;
}
