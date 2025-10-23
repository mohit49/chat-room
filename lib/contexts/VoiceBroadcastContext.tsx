'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useBroadcast } from './BroadcastContext';

interface BroadcasterInfo {
  userId: string;
  username: string;
}

interface VoiceBroadcastContextType {
  isBroadcasting: boolean;
  isListening: boolean;
  currentBroadcaster: BroadcasterInfo | null;
  isMuted: boolean;
  isPaused: boolean;
  noiseCancellationLevel: 'off' | 'low' | 'medium' | 'high';
  startBroadcast: () => Promise<void>;
  stopBroadcast: () => void;
  pauseBroadcast: () => void;
  resumeBroadcast: () => void;
  toggleBroadcast: () => Promise<void>;
  toggleMute: () => void;
  toggleListen: () => void;
  setNoiseCancellationLevel: (level: 'off' | 'low' | 'medium' | 'high') => void;
  canBroadcast: boolean;
}

const VoiceBroadcastContext = createContext<VoiceBroadcastContextType | undefined>(undefined);

export const useVoiceBroadcast = () => {
  const context = useContext(VoiceBroadcastContext);
  if (context === undefined) {
    throw new Error('useVoiceBroadcast must be used within a VoiceBroadcastProvider');
  }
  return context;
};

interface VoiceBroadcastProviderProps {
  children: ReactNode;
  roomId: string;
  roomName?: string;
  userRole?: 'admin' | 'editor' | 'viewer' | null;
}

export const VoiceBroadcastProvider = ({ children, roomId, roomName = 'Room', userRole }: VoiceBroadcastProviderProps) => {
  const globalBroadcast = useBroadcast();

  // Wrapper functions that use the global context
  const startBroadcast = async () => {
    await globalBroadcast.startBroadcast(roomId, roomName, userRole || undefined);
  };

  const stopBroadcast = () => {
    globalBroadcast.stopBroadcast();
  };

  const pauseBroadcast = () => {
    globalBroadcast.pauseBroadcast();
  };

  const resumeBroadcast = () => {
    globalBroadcast.resumeBroadcast();
  };

  const toggleBroadcast = async () => {
    if (globalBroadcast.isBroadcasting && globalBroadcast.activeBroadcast?.roomId === roomId) {
      stopBroadcast();
    } else {
      await startBroadcast();
    }
  };

  const toggleMute = () => {
    globalBroadcast.toggleMute();
  };

  const toggleListen = () => {
    globalBroadcast.toggleListen();
  };

  const setNoiseCancellationLevel = (level: 'off' | 'low' | 'medium' | 'high') => {
    globalBroadcast.setNoiseCancellationLevel(level);
  };

  // Check if this room is currently broadcasting
  const isBroadcasting = globalBroadcast.isBroadcasting && globalBroadcast.activeBroadcast?.roomId === roomId;
  
  // Current broadcaster info (only if broadcasting in this room)
  const currentBroadcaster = globalBroadcast.activeBroadcast?.roomId === roomId 
    ? { userId: globalBroadcast.activeBroadcast.userId, username: globalBroadcast.activeBroadcast.username }
    : null;

  // Can broadcast if user role is admin
  const canBroadcast = globalBroadcast.canBroadcast(roomId, userRole || undefined);

  return (
    <VoiceBroadcastContext.Provider value={{
      isBroadcasting,
      isListening: globalBroadcast.isListening,
      currentBroadcaster,
      isMuted: globalBroadcast.isMuted,
      isPaused: globalBroadcast.isPaused,
      noiseCancellationLevel: globalBroadcast.noiseCancellationLevel,
      startBroadcast,
      stopBroadcast,
      pauseBroadcast,
      resumeBroadcast,
      toggleBroadcast,
      toggleMute,
      toggleListen,
      setNoiseCancellationLevel,
      canBroadcast
    }}>
      {children}
    </VoiceBroadcastContext.Provider>
  );
};
