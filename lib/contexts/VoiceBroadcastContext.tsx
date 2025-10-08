'use client';

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface VoiceBroadcastContextType {
  isBroadcasting: boolean;
  isListening: boolean;
  broadcasters: string[];
  startBroadcast: () => Promise<void>;
  stopBroadcast: () => void;
  toggleBroadcast: () => Promise<void>;
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
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [broadcasters, setBroadcasters] = useState<string[]>([]);
  
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const audioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map());

  const canBroadcast = userRole === 'admin';

  const startBroadcast = async () => {
    if (!canBroadcast || isBroadcasting) return;

    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });

      mediaStreamRef.current = stream;

      // Set up audio context for processing
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const microphone = audioContext.createMediaStreamSource(stream);
      microphoneRef.current = microphone;
      microphone.connect(analyser);

      // Create audio element for playback
      const audioElement = new Audio();
      audioElement.srcObject = stream;
      audioElement.autoplay = true;
      audioElement.volume = 0.8;

      // Store audio element
      if (user?.id) {
        audioElementsRef.current.set(user.id, audioElement);
      }

      setIsBroadcasting(true);
      console.log('🎤 Started voice broadcast');
      
      // For now, just show a notification that broadcast started
      // In a full implementation, this would connect to WebRTC peers
      alert('Voice broadcast started! (Note: This is a demo implementation)');
    } catch (error) {
      console.error('Error starting broadcast:', error);
      alert('Failed to start voice broadcast. Please check microphone permissions.');
    }
  };

  const stopBroadcast = () => {
    if (!isBroadcasting) return;

    // Stop media stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Clean up audio elements
    if (user?.id) {
      const audioElement = audioElementsRef.current.get(user.id);
      if (audioElement) {
        audioElement.pause();
        audioElement.srcObject = null;
        audioElementsRef.current.delete(user.id);
      }
    }

    setIsBroadcasting(false);
    console.log('🎤 Stopped voice broadcast');
    
    // Show notification that broadcast stopped
    alert('Voice broadcast stopped!');
  };

  const toggleBroadcast = async () => {
    if (isBroadcasting) {
      stopBroadcast();
    } else {
      await startBroadcast();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopBroadcast();
    };
  }, []);

  return (
    <VoiceBroadcastContext.Provider value={{
      isBroadcasting,
      isListening,
      broadcasters,
      startBroadcast,
      stopBroadcast,
      toggleBroadcast,
      canBroadcast
    }}>
      {children}
    </VoiceBroadcastContext.Provider>
  );
};
