'use client';

import { useEffect, useRef } from 'react';
import { useSocket } from '@/lib/contexts/SocketContext';
import { getSocketEventManager, SocketEventHandlers } from '@/lib/socket/socketEvents';

export const useSocketEvents = (handlers: SocketEventHandlers, componentId: string) => {
  const { socket } = useSocket();
  const eventManagerRef = useRef<ReturnType<typeof getSocketEventManager> | null>(null);

  useEffect(() => {
    if (!socket) return;

    // Get or create event manager once
    if (!eventManagerRef.current) {
      eventManagerRef.current = getSocketEventManager(socket);
    }
    
    // Register handlers - this will update if handlers change
    eventManagerRef.current.registerHandlers(componentId, handlers);

    // Cleanup on unmount
    return () => {
      eventManagerRef.current?.unregisterHandlers(componentId);
    };
  }, [socket, handlers, componentId]);

  // Return the event manager for emitting events
  if (!eventManagerRef.current && socket) {
    eventManagerRef.current = getSocketEventManager(socket);
  }
  return eventManagerRef.current || getSocketEventManager();
};
