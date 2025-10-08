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
      reconnectionAttempts: 3,
      reconnectionDelay: 500,
      reconnectionDelayMax: 2000,
      autoConnect: true,
      upgrade: true,
      rememberUpgrade: true,
      multiplex: true
    });

    newSocket.on('connect', () => {
      setConnected(true);
      
      // Send authentication after connection
      newSocket.emit('authenticate', { token: token });
    });

    newSocket.on('auth_error', (error) => {
      setConnected(false);
      setConnectionConfirmed(false);
    });

    newSocket.on('connection_confirmed', (data) => {
      setConnectionConfirmed(true);
    });

    newSocket.on('disconnect', (reason) => {
      setConnected(false);
      setConnectionConfirmed(false);
    });

    newSocket.on('connect_error', (error) => {
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

