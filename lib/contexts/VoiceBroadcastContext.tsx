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
  noiseCancellationLevel: 'off' | 'low' | 'medium' | 'high';
  startBroadcast: () => Promise<void>;
  stopBroadcast: () => void;
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
  userRole?: 'admin' | 'editor' | 'viewer' | null;
}

// Global state to track which room user is currently listening to
let globalActiveListeningRoom: string | null = null;
let globalListeningAudioContext: AudioContext | null = null;

export const VoiceBroadcastProvider = ({ children, roomId, userRole }: VoiceBroadcastProviderProps) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [isListening, setIsListening] = useState(false); // MANUAL PLAY - User must click Play
  const [currentBroadcaster, setCurrentBroadcaster] = useState<BroadcasterInfo | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [noiseCancellationLevel, setNoiseCancellationLevel] = useState<'off' | 'low' | 'medium' | 'high'>('high');
  
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const noiseGateRef = useRef<GainNode | null>(null);
  const compressorRef = useRef<DynamicsCompressorNode | null>(null);

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
      
      // Get noise cancellation settings based on level
      const getAudioConstraints = () => {
        const baseConstraints = {
          sampleRate: 48000,
          channelCount: 1
        };

        switch (noiseCancellationLevel) {
          case 'high':
            return {
              ...baseConstraints,
              echoCancellation: { ideal: true },
              noiseSuppression: { ideal: true },
              autoGainControl: { ideal: true },
              // Advanced constraints for better quality
              sampleSize: 16,
              latency: 0.01 // 10ms latency
            };
          case 'medium':
            return {
              ...baseConstraints,
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            };
          case 'low':
            return {
              ...baseConstraints,
              echoCancellation: true,
              noiseSuppression: false,
              autoGainControl: true
            };
          case 'off':
            return {
              ...baseConstraints,
              echoCancellation: false,
              noiseSuppression: false,
              autoGainControl: false
            };
        }
      };

      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: getAudioConstraints()
      });

      mediaStreamRef.current = stream;
      
      // Set up advanced audio processing
      const audioContext = new AudioContext({ sampleRate: 48000 });
      audioContextRef.current = audioContext;
      
      const source = audioContext.createMediaStreamSource(stream);
      
      // Add noise gate to cut off low-level background noise
      const noiseGate = audioContext.createGain();
      noiseGateRef.current = noiseGate;
      
      // Add compressor for consistent volume levels
      const compressor = audioContext.createDynamicsCompressor();
      compressorRef.current = compressor;
      compressor.threshold.value = -50;
      compressor.knee.value = 40;
      compressor.ratio.value = 12;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.25;
      
      // Add high-pass filter to remove low-frequency noise
      const highPassFilter = audioContext.createBiquadFilter();
      highPassFilter.type = 'highpass';
      highPassFilter.frequency.value = 80; // Cut frequencies below 80Hz
      highPassFilter.Q.value = 1;
      
      // Add low-pass filter to remove high-frequency noise
      const lowPassFilter = audioContext.createBiquadFilter();
      lowPassFilter.type = 'lowpass';
      lowPassFilter.frequency.value = 8000; // Cut frequencies above 8kHz
      lowPassFilter.Q.value = 1;
      
      // Connect audio processing chain
      source.connect(highPassFilter);
      highPassFilter.connect(lowPassFilter);
      lowPassFilter.connect(noiseGate);
      noiseGate.connect(compressor);
      
      // Create processor for streaming
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      compressor.connect(processor);
      processor.connect(audioContext.destination);

      // Apply noise gate threshold based on level
      const noiseGateThreshold = {
        'off': 0,
        'low': 0.01,
        'medium': 0.02,
        'high': 0.03
      }[noiseCancellationLevel];

      processor.onaudioprocess = (e) => {
        const audioData = e.inputBuffer.getChannelData(0);
        
        // Apply noise gate: mute audio below threshold
        const processedData = new Float32Array(audioData.length);
        for (let i = 0; i < audioData.length; i++) {
          if (Math.abs(audioData[i]) > noiseGateThreshold) {
            processedData[i] = audioData[i];
          } else {
            processedData[i] = 0; // Silence below threshold
          }
        }
        
        // Convert to array and send via socket
        const audioArray = Array.from(processedData);
        socket.emit('audio_stream', {
          roomId,
          audioData: audioArray
        });
      };

      peerConnectionRef.current = processor as any;

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

      console.log('✅ Voice broadcast started with advanced noise cancellation:', noiseCancellationLevel);
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

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Disconnect audio processor
    if (peerConnectionRef.current) {
      (peerConnectionRef.current as any).disconnect?.();
      peerConnectionRef.current = null;
    }

    // Reset audio nodes
    noiseGateRef.current = null;
    compressorRef.current = null;

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
    const newListeningState = !isListening;
    
    // If starting to listen, check if another room is active
    if (newListeningState) {
      if (globalActiveListeningRoom && globalActiveListeningRoom !== roomId) {
        console.log('⚠️ Stopping broadcast from room:', globalActiveListeningRoom);
        console.log('🔄 Starting broadcast from room:', roomId);
        
        // Stop previous audio context
        if (globalListeningAudioContext) {
          globalListeningAudioContext.close();
          globalListeningAudioContext = null;
        }
      }
      
      // Set this room as active listening room
      globalActiveListeningRoom = roomId;
      console.log('🎯 Active listening room set to:', roomId);
    } else {
      // If stopping, clear if this was the active room
      if (globalActiveListeningRoom === roomId) {
        globalActiveListeningRoom = null;
        if (globalListeningAudioContext) {
          globalListeningAudioContext.close();
          globalListeningAudioContext = null;
        }
        console.log('🎯 Cleared active listening room');
      }
    }
    
    setIsListening(newListeningState);
    console.log('🎧 Listening:', newListeningState);
  };

  // Listen for broadcast events from socket
  useEffect(() => {
    if (!socket) return;

    let audioContext: AudioContext | null = null;
    let audioBufferQueue: Float32Array[] = [];
    let isPlaying = false;

    socket.on('voice_broadcast_started', (data: { userId: string; username: string; roomId: string }) => {
      if (data.roomId === roomId && data.userId !== user?.id) {
        console.log('📻 Broadcast started by:', data.username, 'in room:', data.roomId);
        
        // Show broadcaster info but DON'T auto-play
        setCurrentBroadcaster({
          userId: data.userId,
          username: data.username
        });
        
        // Initialize audio context but keep paused (user must click Play)
        if (!audioContext) {
          audioContext = new AudioContext({ sampleRate: 48000 });
        }
        
        console.log('📻 Broadcast notification received. Click Play to listen.');
      }
    });

    socket.on('audio_stream', (data: { roomId: string; audioData: number[] }) => {
      // Only play audio if this is the active listening room
      if (data.roomId === roomId && 
          data.roomId === globalActiveListeningRoom && 
          audioContext && 
          isListening && 
          !isMuted) {
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
        console.log('📻 Broadcast stopped in room:', roomId);
        setCurrentBroadcaster(null);
        setIsListening(false);
        
        // Stop and cleanup audio context
        if (audioContext) {
          audioContext.close();
          audioContext = null;
        }
        
        // Clear global listening room if it was this room
        if (globalActiveListeningRoom === roomId) {
          globalActiveListeningRoom = null;
          globalListeningAudioContext = null;
          console.log('🎯 Cleared active listening room');
        }
        
        audioBufferQueue = [];
        isPlaying = false;
      }
    });

    return () => {
      socket.off('voice_broadcast_started');
      socket.off('voice_broadcast_stopped');
      socket.off('audio_stream');
      
      // Cleanup audio context
      if (audioContext) {
        audioContext.close();
      }
      
      // Clear global listening room if it was this room
      if (globalActiveListeningRoom === roomId) {
        globalActiveListeningRoom = null;
        if (globalListeningAudioContext) {
          globalListeningAudioContext.close();
          globalListeningAudioContext = null;
        }
        console.log('🧹 Cleanup: Cleared active listening room on unmount');
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
      noiseCancellationLevel,
      startBroadcast,
      stopBroadcast,
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
