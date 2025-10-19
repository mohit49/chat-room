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
      
      // Check if HTTPS or localhost
      const isSecureContext = window.isSecureContext;
      if (!isSecureContext) {
        alert('⚠️ Voice broadcasting requires HTTPS or localhost. Please use a secure connection.');
        return;
      }
      
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

      // Set up audio streaming via socket
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);

      source.connect(processor);
      processor.connect(audioContext.destination);

      processor.onaudioprocess = (e) => {
        const audioData = e.inputBuffer.getChannelData(0);
        // Convert to array and send via socket
        const audioArray = Array.from(audioData);
        socket.emit('audio_stream', {
          roomId,
          audioData: audioArray
        });
      };

      peerConnectionRef.current = processor as any;

      console.log('✅ Voice broadcast started with audio streaming');
    } catch (error) {
      console.error('❌ Error starting broadcast:', error);
      
      if ((error as any).name === 'NotAllowedError') {
        alert('Microphone permission denied. Please allow microphone access.');
      } else if ((error as any).name === 'NotFoundError') {
        alert('No microphone found. Please connect a microphone.');
      } else if ((error as any).name === 'NotSupportedError') {
        alert('⚠️ Voice broadcasting requires HTTPS. Please use: https://your-domain.com');
      } else {
        alert('Failed to start voice broadcast. Please check microphone permissions and use HTTPS.');
      }
      
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

    let audioContext: AudioContext | null = null;
    let audioBufferQueue: Float32Array[] = [];
    let isPlaying = false;

    socket.on('voice_broadcast_started', (data: { userId: string; username: string; roomId: string }) => {
      if (data.roomId === roomId && data.userId !== user?.id) {
        console.log('📻 Broadcast started by:', data.username);
        setCurrentBroadcaster({
          userId: data.userId,
          username: data.username
        });
        setIsListening(true);

        // Initialize audio context for playback
        audioContext = new AudioContext({ sampleRate: 48000 });
        console.log('🎧 Audio context initialized for listening');
      }
    });

    socket.on('audio_stream', (data: { roomId: string; audioData: number[] }) => {
      if (data.roomId === roomId && audioContext && isListening && !isMuted) {
        try {
          // Convert received audio data back to Float32Array
          const audioData = new Float32Array(data.audioData);
          
          // Create audio buffer
          const audioBuffer = audioContext.createBuffer(1, audioData.length, audioContext.sampleRate);
          audioBuffer.getChannelData(0).set(audioData);
          
          // Create buffer source and play
          const source = audioContext.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(audioContext.destination);
          source.start(0);
          
          isPlaying = true;
        } catch (error) {
          console.error('Error playing audio stream:', error);
        }
      }
    });

    socket.on('voice_broadcast_stopped', (data: { userId: string; roomId: string }) => {
      if (data.roomId === roomId) {
        console.log('📻 Broadcast stopped');
        setCurrentBroadcaster(null);
        setIsListening(false);
        
        // Stop and cleanup audio context
        if (audioContext) {
          audioContext.close();
          audioContext = null;
        }
        
        audioBufferQueue = [];
        isPlaying = false;
      }
    });

    return () => {
      socket.off('voice_broadcast_started');
      socket.off('voice_broadcast_stopped');
      socket.off('audio_stream');
      
      if (audioContext) {
        audioContext.close();
      }
    };
  }, [socket, roomId, user?.id, isListening, isMuted]);

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
