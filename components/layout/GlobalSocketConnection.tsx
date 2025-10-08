'use client';

import { useEffect } from 'react';
import { useSocket } from '@/lib/contexts/SocketContext';
import { useAuth } from '@/lib/contexts/AuthContext';

export default function GlobalSocketConnection() {
  const { socket, connected } = useSocket();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    // Socket connection is managed by SocketProvider
  }, [isAuthenticated, connected, socket]);

  // This component doesn't render anything, it just maintains the socket connection
  return null;
}

