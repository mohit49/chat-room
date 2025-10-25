'use client';

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';

interface BroadcasterInfo {
  userId: string;
  username: string;
  roomId: string;
  roomName: string;
}

interface BroadcastContextType {
  activeBroadcast: BroadcasterInfo | null;
  isBroadcasting: boolean;
  isPaused: boolean;
  isListening: boolean;
  isMuted: boolean;
  noiseCancellationLevel: 'off' | 'low' | 'medium' | 'high';
  startBroadcast: (roomId: string, roomName: string, userRole?: string) => Promise<void>;
  stopBroadcast: () => void;
  pauseBroadcast: () => void;
  resumeBroadcast: () => void;
  toggleMute: () => void;
  toggleListen: () => void;
  setNoiseCancellationLevel: (level: 'off' | 'low' | 'medium' | 'high') => void;
  canBroadcast: (roomId: string, userRole?: string) => boolean;
}

const BroadcastContext = createContext<BroadcastContextType | undefined>(undefined);

export const useBroadcast = () => {
  const context = useContext(BroadcastContext);
  if (context === undefined) {
    throw new Error('useBroadcast must be used within a BroadcastProvider');
  }
  return context;
};

interface BroadcastProviderProps {
  children: ReactNode;
}

export const BroadcastProvider = ({ children }: BroadcastProviderProps) => {
  const { socket } = useSocket();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeBroadcast, setActiveBroadcast] = useState<BroadcasterInfo | null>(null);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [noiseCancellationLevel, setNoiseCancellationLevel] = useState<'off' | 'low' | 'medium' | 'high'>('high');
  
  // Audio processing refs
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [processorNode, setProcessorNode] = useState<ScriptProcessorNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorNodeRef = useRef<ScriptProcessorNode | null>(null);
  
  // Audio playback refs for listeners
  const listeningAudioContextRef = useRef<AudioContext | null>(null);
  const audioBufferQueueRef = useRef<Float32Array[]>([]);
  const isPlayingRef = useRef(false);

  // Check if user can broadcast
  const canBroadcast = (roomId: string, userRole?: string): boolean => {
    // Only admin can broadcast
    if (userRole !== 'admin') return false;
    
    // If already broadcasting in another room, don't allow
    if (isBroadcasting && activeBroadcast?.roomId !== roomId) {
      alert('You are already broadcasting in another room. Please stop that broadcast first.');
      return false;
    }
    
    return true;
  };

  const startBroadcast = async (roomId: string, roomName: string, userRole: string = 'admin') => {
    if (!user || !socket) return;
    
    // Check if can broadcast
    if (!canBroadcast(roomId, userRole)) return;
    
    // If already broadcasting in same room, don't start again
    if (isBroadcasting && activeBroadcast?.roomId === roomId) {
      console.log('Already broadcasting in this room');
      return;
    }

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
          sampleRate: 16000, // ✅ OPTIMIZED: Reduced from 48000 Hz to 16000 Hz for voice (84% smaller)
          channelCount: 1
        };

        switch (noiseCancellationLevel) {
          case 'high':
            return {
              ...baseConstraints,
              echoCancellation: { ideal: true },
              noiseSuppression: { ideal: true },
              autoGainControl: { ideal: true },
              sampleSize: 16,
              latency: 0.01
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
      setMediaStream(stream);
      
      // Set up audio processing with optimized sample rate
      const audioCtx = new AudioContext({ sampleRate: 16000 }); // ✅ OPTIMIZED: 16kHz for voice
      audioContextRef.current = audioCtx;
      setAudioContext(audioCtx);
      
      const source = audioCtx.createMediaStreamSource(stream);
      
      // Add noise gate
      const noiseGate = audioCtx.createGain();
      
      // Add compressor
      const compressor = audioCtx.createDynamicsCompressor();
      compressor.threshold.value = -50;
      compressor.knee.value = 40;
      compressor.ratio.value = 12;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.25;
      
      // Add filters optimized for voice
      const highPassFilter = audioCtx.createBiquadFilter();
      highPassFilter.type = 'highpass';
      highPassFilter.frequency.value = 200; // ✅ OPTIMIZED: 200Hz for voice (was 80Hz)
      highPassFilter.Q.value = 1;
      
      const lowPassFilter = audioCtx.createBiquadFilter();
      lowPassFilter.type = 'lowpass';
      lowPassFilter.frequency.value = 3400; // ✅ OPTIMIZED: 3.4kHz for voice (was 8kHz)
      lowPassFilter.Q.value = 1;
      
      // Connect audio chain
      source.connect(highPassFilter);
      highPassFilter.connect(lowPassFilter);
      lowPassFilter.connect(noiseGate);
      noiseGate.connect(compressor);
      
      // Create processor with smaller buffer size for lower latency
      const processor = audioCtx.createScriptProcessor(2048, 1, 1); // ✅ OPTIMIZED: 2048 samples (was 4096)
      compressor.connect(processor);
      processor.connect(audioCtx.destination);

      // Apply noise gate threshold
      const noiseGateThreshold = {
        'off': 0,
        'low': 0.01,
        'medium': 0.02,
        'high': 0.03
      }[noiseCancellationLevel];

      processor.onaudioprocess = (e) => {
        // Only process if not paused
        if (!isPaused && socket) {
          const audioData = e.inputBuffer.getChannelData(0);
          
          // Apply noise gate
          const processedData = new Float32Array(audioData.length);
          for (let i = 0; i < audioData.length; i++) {
            if (Math.abs(audioData[i]) > noiseGateThreshold) {
              processedData[i] = audioData[i];
            } else {
              processedData[i] = 0;
            }
          }
          
          // ✅ OPTIMIZED: Convert to Int16Array for smaller size (50% reduction)
          // Float32 = 4 bytes per sample, Int16 = 2 bytes per sample
          const int16Data = new Int16Array(processedData.length);
          for (let i = 0; i < processedData.length; i++) {
            // Convert float (-1 to 1) to int16 (-32768 to 32767)
            int16Data[i] = Math.max(-32768, Math.min(32767, Math.floor(processedData[i] * 32767)));
          }
          
          // Send via socket as array
          socket.emit('audio_stream', {
            roomId,
            audioData: Array.from(int16Data),
            format: 'int16' // ✅ Indicate the format
          });
        }
      };

      processorNodeRef.current = processor;
      setProcessorNode(processor);
      setIsBroadcasting(true);
      
      // Set active broadcast info
      console.log('🌐 BroadcastContext: Setting active broadcast with roomName:', roomName);
      setActiveBroadcast({
        userId: user.id || '',
        username: user.username || user.mobileNumber || 'Unknown',
        roomId,
        roomName
      });

      // Emit broadcast start event via socket
      socket.emit('voice_broadcast_start', {
        roomId,
        userId: user.id,
        username: user.username || user.mobileNumber
      });

      console.log('✅ Global broadcast started:', roomName);
    } catch (error) {
      console.error('❌ Error starting global broadcast:', error);
      
      if ((error as any).name === 'NotAllowedError') {
        alert('Microphone permission denied. Please allow microphone access.');
      } else if ((error as any).name === 'NotFoundError') {
        alert('No microphone found. Please connect a microphone.');
      } else {
        alert('Failed to start voice broadcast. Please check microphone permissions.');
      }
      
      setIsBroadcasting(false);
    }
  };

  const stopBroadcast = () => {
    if (!isBroadcasting) return;

    console.log('🛑 Stopping broadcast...');

    // Stop media stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
      setMediaStream(null);
    }

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
      setAudioContext(null);
    }

    // Disconnect processor
    if (processorNodeRef.current) {
      processorNodeRef.current.disconnect();
      processorNodeRef.current = null;
      setProcessorNode(null);
    }

    setIsBroadcasting(false);
    setIsPaused(false);

    // Emit broadcast stop event via socket
    if (socket && activeBroadcast) {
      socket.emit('voice_broadcast_stop', {
        roomId: activeBroadcast.roomId,
        userId: user?.id
      });
    }

    setActiveBroadcast(null);
    console.log('🎤 Stopped global broadcast');
  };

  const pauseBroadcast = () => {
    if (!isBroadcasting || isPaused) return;
    setIsPaused(true);
    console.log('⏸️ Global: Paused broadcast');
  };

  const resumeBroadcast = () => {
    if (!isBroadcasting || !isPaused) return;
    setIsPaused(false);
    console.log('▶️ Global: Resumed broadcast');
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    console.log('🔇 Audio muted:', !isMuted);
  };

  const toggleListen = async () => {
    const newListeningState = !isListening;
    
    if (newListeningState) {
      // Start listening - initialize audio context FIRST before setting state
      try {
        console.log('🎧 Starting listening process...');
        
        // Create audio context first
        if (!listeningAudioContextRef.current) {
          listeningAudioContextRef.current = new AudioContext({ sampleRate: 16000 }); // ✅ OPTIMIZED: 16kHz for voice
          console.log('🎧 Audio context created for listening');
        }
        
        // Resume audio context if it's suspended (required by browsers)
        if (listeningAudioContextRef.current.state === 'suspended') {
          await listeningAudioContextRef.current.resume();
          console.log('🎧 Audio context resumed');
        }
        
        console.log('🎧 Audio context ready - State:', listeningAudioContextRef.current.state);
        
        // Join the room channel if we have an active broadcast
        if (activeBroadcast && socket) {
          console.log('🔌 Joining room channel for listening:', activeBroadcast.roomId);
          socket.emit('join_room', activeBroadcast.roomId);
        }
        
        // Only set listening to true AFTER audio context is ready
        setIsListening(true);
        console.log('✅ Listening enabled');
      } catch (error) {
        console.error('❌ Failed to initialize audio context:', error);
        setIsListening(false);
        return;
      }
    } else {
      // Stop listening
      console.log('🎧 Stopping listening');
      setIsListening(false);
      
      // Leave the room channel when stopping listening
      if (activeBroadcast && socket) {
        console.log('🔌 Leaving room channel:', activeBroadcast.roomId);
        socket.emit('leave_room', activeBroadcast.roomId);
      }
    }
  };

  // Listen for broadcast events from other users
  useEffect(() => {
    if (!socket) return;

    socket.on('voice_broadcast_started', (data: { userId: string; username: string; roomId: string }) => {
      if (data.userId !== user?.id) {
        console.log('📻 Remote broadcast started by:', data.username);
        // Note: We need room name here. For now, we'll get it from the client side
        setActiveBroadcast({
          userId: data.userId,
          username: data.username,
          roomId: data.roomId,
          roomName: 'Room' // This will be updated by the component that knows the room name
        });
        
        // DON'T auto-enable listening - let user click Play button
        console.log('📻 Broadcast notification received. User must click Play to listen.');
      }
    });

    // Handle broadcast errors from server
    socket.on('broadcast_error', (data: { error: string }) => {
      console.error('❌ Broadcast error from server:', data.error);
      
      // Clean up broadcast state
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
        setMediaStream(null);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
        setAudioContext(null);
      }
      if (processorNodeRef.current) {
        processorNodeRef.current.disconnect();
        processorNodeRef.current = null;
        setProcessorNode(null);
      }
      
      setIsBroadcasting(false);
      setIsPaused(false);
      setActiveBroadcast(null);
      
      toast({
        title: "Broadcast Error",
        description: data.error || "Failed to start broadcast. Only admins can broadcast.",
        variant: "destructive",
      });
    });

    // Handle incoming audio stream
    socket.on('audio_stream', (data: { roomId: string; audioData: number[]; format?: string }) => {
      console.log('🔊 Received audio stream:', {
        roomId: data.roomId,
        dataLength: data.audioData?.length,
        format: data.format || 'float32',
        isListening,
        isMuted,
        activeBroadcastRoomId: activeBroadcast?.roomId,
        isOwnBroadcast: activeBroadcast?.userId === user?.id,
        hasAudioContext: !!listeningAudioContextRef.current
      });

      // Only play if listening is enabled and not muted
      if (isListening && !isMuted && activeBroadcast?.roomId === data.roomId && activeBroadcast.userId !== user?.id) {
        try {
          let audioCtx = listeningAudioContextRef.current;
          
          // Safety check: Create audio context if it doesn't exist
          if (!audioCtx) {
            console.warn('⚠️ Audio context missing! Creating it now (this should not happen)...');
            audioCtx = new AudioContext({ sampleRate: 16000 }); // ✅ OPTIMIZED: Match sender's 16kHz
            listeningAudioContextRef.current = audioCtx;
            
            // Try to resume if suspended
            if (audioCtx.state === 'suspended') {
              audioCtx.resume().then(() => {
                console.log('🎧 Emergency audio context created and resumed');
              }).catch(err => {
                console.error('❌ Failed to resume emergency audio context:', err);
              });
            }
          }

          if (audioCtx.state !== 'running') {
            console.warn('⚠️ Audio context state is not running:', audioCtx.state);
            if (audioCtx.state === 'suspended') {
              audioCtx.resume().then(() => {
                console.log('🎧 Audio context resumed from suspended state');
              }).catch(err => {
                console.error('❌ Failed to resume audio context:', err);
              });
            }
            return;
          }

          // ✅ OPTIMIZED: Convert Int16 back to Float32 for playback
          let audioData: Float32Array;
          if (data.format === 'int16') {
            // Convert Int16 (-32768 to 32767) back to Float32 (-1 to 1)
            audioData = new Float32Array(data.audioData.length);
            for (let i = 0; i < data.audioData.length; i++) {
              audioData[i] = data.audioData[i] / 32767;
            }
          } else {
            // Legacy format (Float32)
            audioData = new Float32Array(data.audioData);
          }
          
          console.log('🎵 Playing audio chunk:', {
            sampleRate: audioCtx.sampleRate,
            audioDataLength: audioData.length,
            duration: audioData.length / audioCtx.sampleRate,
            contextState: audioCtx.state,
            format: data.format || 'float32'
          });
          
          // Create audio buffer
          const audioBuffer = audioCtx.createBuffer(1, audioData.length, audioCtx.sampleRate);
          audioBuffer.getChannelData(0).set(audioData);
          
          // Create buffer source and play
          const source = audioCtx.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(audioCtx.destination);
          source.start(0);
          
          source.onended = () => {
            console.log('✅ Audio chunk playback completed');
          };
          
          isPlayingRef.current = true;
        } catch (error) {
          console.error('❌ Error playing audio stream:', error);
        }
      } else {
        if (!isListening) {
          console.log('⏸️ Not listening - audio stream ignored');
        } else if (isMuted) {
          console.log('🔇 Muted - audio stream ignored');
        } else if (activeBroadcast?.userId === user?.id) {
          console.log('🎤 Own broadcast - audio stream ignored');
        }
      }
    });

    socket.on('voice_broadcast_stopped', (data: { userId: string; roomId: string }) => {
      console.log('📻 Remote broadcast stopped');
      
      // Show notification if user was listening
      if (isListening && activeBroadcast?.roomId === data.roomId) {
        const broadcasterName = activeBroadcast.username || 'The broadcaster';
        toast({
          title: "Broadcast Ended",
          description: `${broadcasterName} has ended the broadcast.`,
          variant: "default",
        });
      }
      
      setActiveBroadcast(null);
      setIsListening(false);
      
      // Cleanup listening audio context
      if (listeningAudioContextRef.current) {
        listeningAudioContextRef.current.close();
        listeningAudioContextRef.current = null;
      }
      audioBufferQueueRef.current = [];
      isPlayingRef.current = false;
    });

    return () => {
      socket.off('voice_broadcast_started');
      socket.off('voice_broadcast_stopped');
      socket.off('audio_stream');
      socket.off('broadcast_error');
      
      // Cleanup audio context on unmount
      if (listeningAudioContextRef.current) {
        listeningAudioContextRef.current.close();
        listeningAudioContextRef.current = null;
      }
    };
  }, [socket, user?.id, isListening, isMuted, activeBroadcast]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isBroadcasting) {
        stopBroadcast();
      }
    };
  }, []);

  return (
    <BroadcastContext.Provider value={{
      activeBroadcast,
      isBroadcasting,
      isPaused,
      isListening,
      isMuted,
      noiseCancellationLevel,
      startBroadcast,
      stopBroadcast,
      pauseBroadcast,
      resumeBroadcast,
      toggleMute,
      toggleListen,
      setNoiseCancellationLevel,
      canBroadcast
    }}>
      {children}
    </BroadcastContext.Provider>
  );
};


