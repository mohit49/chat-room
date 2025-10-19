'use client';

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';

interface BroadcasterInfo {
  userId: string;
  username: string;
}

interface VoiceBroadcastContextType {
  isBroadcasting: boolean;
  isListening: boolean;
  currentBroadcaster: BroadcasterInfo | null;
  isMuted: boolean;
  startBroadcast: () => Promise<void>;
  stopBroadcast: () => void;
  toggleBroadcast: () => Promise<void>;
  toggleMute: () => void;
  toggleListen: () => void;
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
  userRole?: 'admin' | 'editor' | 'viewer' | null;
}

export const VoiceBroadcastProvider = ({ children, roomId, userRole }: VoiceBroadcastProviderProps) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [isListening, setIsListening] = useState(true); // Auto-listen when broadcast starts
  const [currentBroadcaster, setCurrentBroadcaster] = useState<BroadcasterInfo | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);

  const canBroadcast = userRole === 'admin';

  const startBroadcast = async () => {
    if (!canBroadcast || isBroadcasting || !socket) return;

    try {
      console.log('🎤 Starting broadcast...');
      
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000
        } 
      });

      mediaStreamRef.current = stream;
      setIsBroadcasting(true);
      
      // Set current broadcaster info
      setCurrentBroadcaster({
        userId: user?.id || '',
        username: user?.username || user?.mobileNumber || 'Unknown'
      });

      // Emit broadcast start event via socket
      socket.emit('voice_broadcast_start', {
        roomId,
        userId: user?.id,
        username: user?.username || user?.mobileNumber
      });

      console.log('✅ Voice broadcast started');
    } catch (error) {
      console.error('❌ Error starting broadcast:', error);
      alert('Failed to start voice broadcast. Please check microphone permissions.');
      setIsBroadcasting(false);
    }
  };

  const stopBroadcast = () => {
    if (!isBroadcasting || !socket) return;

    // Stop media stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    setIsBroadcasting(false);
    setCurrentBroadcaster(null);

    // Emit broadcast stop event via socket
    socket.emit('voice_broadcast_stop', {
      roomId,
      userId: user?.id
    });

    console.log('🎤 Stopped voice broadcast');
  };

  const toggleBroadcast = async () => {
    if (isBroadcasting) {
      stopBroadcast();
    } else {
      await startBroadcast();
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (audioElementRef.current) {
      audioElementRef.current.muted = !isMuted;
    }
    console.log('🔇 Audio muted:', !isMuted);
  };

  const toggleListen = () => {
    setIsListening(!isListening);
    if (audioElementRef.current) {
      if (isListening) {
        audioElementRef.current.pause();
      } else {
        audioElementRef.current.play();
      }
    }
    console.log('🎧 Listening:', !isListening);
  };

  // Listen for broadcast events from socket
  useEffect(() => {
    if (!socket) return;

    socket.on('voice_broadcast_started', (data: { userId: string; username: string; roomId: string }) => {
      if (data.roomId === roomId && data.userId !== user?.id) {
        console.log('📻 Broadcast started by:', data.username);
        setCurrentBroadcaster({
          userId: data.userId,
          username: data.username
        });
        setIsListening(true);
      }
    });

    socket.on('voice_broadcast_stopped', (data: { userId: string; roomId: string }) => {
      if (data.roomId === roomId) {
        console.log('📻 Broadcast stopped');
        setCurrentBroadcaster(null);
        setIsListening(false);
        
        // Stop any playing audio
        if (audioElementRef.current) {
          audioElementRef.current.pause();
          audioElementRef.current.srcObject = null;
        }
      }
    });

    return () => {
      socket.off('voice_broadcast_started');
      socket.off('voice_broadcast_stopped');
    };
  }, [socket, roomId, user?.id]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isBroadcasting) {
        stopBroadcast();
      }
    };
  }, []);

  return (
    <VoiceBroadcastContext.Provider value={{
      isBroadcasting,
      isListening,
      currentBroadcaster,
      isMuted,
      startBroadcast,
      stopBroadcast,
      toggleBroadcast,
      toggleMute,
      toggleListen,
      canBroadcast
    }}>
      {children}
    </VoiceBroadcastContext.Provider>
  );
};
