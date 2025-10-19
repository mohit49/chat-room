'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { getAuthToken, isTokenExpired, removeAuthToken } from '@/lib/auth';
import { getSocketUrl } from '@/lib/utils/apiUrl';
import { getSocketEventManager } from '@/lib/socket/socketEvents';
import { SocketSessionManager } from '@/lib/utils/socketSession';

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  connectionConfirmed: boolean;
  sessionId: string;
  isUserOnline: (userId: string) => boolean;
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
  const [sessionId, setSessionId] = useState('');
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  // Function to check if a user is online
  const isUserOnline = useCallback((userId: string) => {
    return onlineUsers.has(userId);
  }, [onlineUsers]);

  useEffect(() => {
    const token = getAuthToken();
    
    if (!token) {
      // Clear socket on logout but keep session
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      setConnected(false);
      setConnectionConfirmed(false);
      setIsInitialized(true);
      return;
    }

    if (isTokenExpired(token)) {
      removeAuthToken();
      setConnected(false);
      setConnectionConfirmed(false);
      setIsInitialized(true);
      return;
    }

    // Get or create session ID
    const currentSessionId = SocketSessionManager.getSessionId();
    setSessionId(currentSessionId);

    // Check if we should reuse existing socket
    const userSession = SocketSessionManager.getUserSession();
    if (socket && userSession && SocketSessionManager.shouldReuseSocket(userSession.userId)) {
      // Reuse existing socket, just re-authenticate
      if (socket.connected) {
        socket.emit('authenticate', { token, sessionId: currentSessionId });
        return;
      }
    }

    // Create new socket connection
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
      withCredentials: true,
      // Include session ID in connection
      query: {
        sessionId: currentSessionId
      },
      // PWA-specific options
      ...(typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches && {
        transports: ['websocket', 'polling'],
      })
    });

    newSocket.on('connect', () => {
      console.log('🔌 Socket connected with session:', currentSessionId);
      setConnected(true);
      
      // Send authentication with session info
      newSocket.emit('authenticate', { 
        token, 
        sessionId: currentSessionId,
        reuseSession: SocketSessionManager.shouldReuseSocket(userSession?.userId || '')
      });
    });

    newSocket.on('auth_error', (error) => {
      console.error('❌ Socket auth error:', error);
      setConnected(false);
      setConnectionConfirmed(false);
    });

    newSocket.on('connection_confirmed', (data) => {
      console.log('✅ Socket connection confirmed for session:', data.sessionId);
      setConnectionConfirmed(true);
      
      // Store user session info
      if (data.userId && data.username) {
        SocketSessionManager.setUserSession(data.userId, data.username);
      }
    });

    // Handle online users updates
    newSocket.on('online_users_update', (users: string[]) => {
      console.log('👥 Online users update:', users);
      setOnlineUsers(new Set(users));
    });

    newSocket.on('user_online_status', (data: { userId: string; isOnline: boolean }) => {
      console.log('👤 User online status update:', data);
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        if (data.isOnline) {
          newSet.add(data.userId);
        } else {
          newSet.delete(data.userId);
        }
        return newSet;
      });
    });

    newSocket.on('socket_mapping_update', (data: { userId: string; newSocketId: string; oldSocketId?: string }) => {
      console.log('🔄 Socket mapping update:', data);
      // Socket mapping updated - user is still online with new socket
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        newSet.add(data.userId); // Ensure user stays online
        return newSet;
      });
    });

    newSocket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
      setConnected(false);
      setConnectionConfirmed(false);
      
      // Clear online users when disconnected (will be refreshed on reconnect)
      setOnlineUsers(new Set());
      
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
    connectionConfirmed,
    sessionId,
    isUserOnline
  }), [socket, connected, connectionConfirmed, sessionId, isUserOnline]);

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

