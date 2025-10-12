'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { getAuthToken, isTokenExpired, removeAuthToken } from '@/lib/auth';
import { getSocketUrl } from '@/lib/utils/apiUrl';
import { getSocketEventManager } from '@/lib/socket/socketEvents';

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  connectionConfirmed: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

interface SocketProviderProps {
  children: ReactNode;
}

export function SocketProvider({ children }: SocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [connectionConfirmed, setConnectionConfirmed] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const token = getAuthToken();
    
    if (!token) {
      setConnected(false);
      setConnectionConfirmed(false);
      setIsInitialized(true); // Mark as initialized even without token
      return;
    }

    if (isTokenExpired(token)) {
      removeAuthToken();
      setConnected(false);
      setConnectionConfirmed(false);
      setIsInitialized(true); // Mark as initialized even with expired token
      return;
    }

    // Only create socket if it doesn't exist
    if (socket) {
      return;
    }

    // Connect to socket
    const socketUrl = getSocketUrl();
    
    const newSocket = io(socketUrl, {
      transports: ['polling', 'websocket'],
      timeout: 10000,
      forceNew: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      autoConnect: true,
      upgrade: true,
      rememberUpgrade: true,
      multiplex: true,
      // PWA-specific options
      withCredentials: true,
      // Ensure connection works in PWA mode
      ...(typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches && {
        transports: ['websocket', 'polling'], // Prefer websocket in PWA
      })
    });

    newSocket.on('connect', () => {
      console.log('🔌 Socket connected');
      setConnected(true);
      
      // Send authentication after connection
      newSocket.emit('authenticate', { token: token });
    });

    newSocket.on('auth_error', (error) => {
      console.error('❌ Socket auth error:', error);
      setConnected(false);
      setConnectionConfirmed(false);
    });

    newSocket.on('connection_confirmed', (data) => {
      console.log('✅ Socket connection confirmed');
      setConnectionConfirmed(true);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
      setConnected(false);
      setConnectionConfirmed(false);
      
      // In PWA mode, try to reconnect more aggressively
      if (typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches) {
        console.log('🔄 PWA mode detected, attempting reconnection...');
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
      setConnected(false);
      setConnectionConfirmed(false);
    });

    // Add reconnection event handlers
    newSocket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 Socket reconnected after ${attemptNumber} attempts`);
      setConnected(true);
    });

    newSocket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`🔄 Socket reconnection attempt ${attemptNumber}`);
    });

    newSocket.on('reconnect_error', (error) => {
      console.error('❌ Socket reconnection error:', error);
    });

    newSocket.on('reconnect_failed', () => {
      console.error('❌ Socket reconnection failed');
      setConnected(false);
      setConnectionConfirmed(false);
    });

    setSocket(newSocket);
    setIsInitialized(true); // Mark as initialized once socket is set
    
    // Update the global socket event manager
    getSocketEventManager(newSocket);

    return () => {
      newSocket.close();
      setSocket(null);
      setConnected(false);
      setConnectionConfirmed(false);
    };
  }, []); // Empty dependency array - only run once

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    socket,
    connected,
    connectionConfirmed
  }), [socket, connected, connectionConfirmed]);

  // Don't render children until socket initialization is complete
  // This prevents components from mounting before socket is ready
  if (!isInitialized) {
    return null;
  }

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
}

// Hook to use socket context
export function useSocket() {
  const context = useContext(SocketContext);
  
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  
  return context;
}

