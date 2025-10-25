'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useSocket } from '@/lib/contexts/SocketContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Send, 
  X, 
  SkipForward,
  SkipBack, 
  Settings, 
  Loader2,
  MessageSquare,
  Phone,
  PhoneOff,
  Maximize2,
  Minimize2,
  Sparkles,
  Eye
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getCountries, getCitiesByCountry, Country, City } from '@/lib/api/location';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  messageType: 'text' | 'image' | 'audio';
  timestamp: Date;
}

interface Partner {
  id: string;
  username: string;
  profile: {
    profilePicture?: any;
    gender: string;
    location: {
      city?: string;
      state?: string;
      country?: string;
    };
  };
}

type ConnectionStatus = 'idle' | 'searching' | 'connecting' | 'connected' | 'disconnected';

export default function RandomChatWidget() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { toast } = useToast();
  const router = useRouter();

  // State
  const [status, setStatus] = useState<ConnectionStatus>('idle');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [partner, setPartner] = useState<Partner | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // History tracking for previous connections
  const [chatHistory, setChatHistory] = useState<Array<{ partnerId: string; partnerUsername: string }>>([]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1);
  
  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    gender: 'any',
    country: 'any',
    state: '',
    city: 'any'
  });
  
  // Location data
  const [countries, setCountries] = useState<Country[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCountryCode, setSelectedCountryCode] = useState('any');

  // Video/Audio state
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [remoteVideoEnabled, setRemoteVideoEnabled] = useState(false);
  const [remoteAudioEnabled, setRemoteAudioEnabled] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [localVideoEnlarged, setLocalVideoEnlarged] = useState(false);
  
  // Face filters state
  const [activeFilter, setActiveFilter] = useState<'none' | 'blur' | 'grayscale' | 'sepia' | 'vintage' | 'warm'>('none');
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const filterCanvasRef = useRef<HTMLCanvasElement>(null);
  const filterProcessingRef = useRef<number | null>(null);

  // WebRTC Configuration
  const rtcConfiguration: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };

  // Auto-scroll messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load countries on mount
  useEffect(() => {
    const loadCountries = async () => {
      const countriesList = await getCountries();
      setCountries(countriesList);
    };
    loadCountries();
  }, []);

  // Load cities when country changes
  useEffect(() => {
    const loadCities = async () => {
      if (selectedCountryCode && selectedCountryCode !== 'any') {
        const citiesList = await getCitiesByCountry(selectedCountryCode);
        setCities(citiesList);
      } else {
        setCities([]);
      }
    };
    loadCities();
  }, [selectedCountryCode]);

  // Handle country change
  const handleCountryChange = (countryCode: string) => {
    setSelectedCountryCode(countryCode);
    
    if (countryCode === 'any') {
      setFilters({
        ...filters,
        country: 'any',
        city: 'any',
        state: ''
      });
    } else {
      const country = countries.find(c => c.code === countryCode);
      setFilters({
        ...filters,
        country: country?.name || 'any',
        city: 'any', // Reset city when country changes
        state: ''
      });
    }
  };

  // Handle city change
  const handleCityChange = (cityName: string) => {
    if (cityName === 'any') {
      setFilters({
        ...filters,
        city: 'any',
        state: ''
      });
    } else {
      const city = cities.find(c => c.name === cityName);
      setFilters({
        ...filters,
        city: cityName,
        state: city?.state || ''
      });
    }
  };

  // Initialize local media
  const initializeMedia = useCallback(async () => {
    try {
      // If there's an existing stream, stop it first
      if (localStreamRef.current) {
        console.log('🛑 Stopping existing stream before reinitializing...');
        localStreamRef.current.getTracks().forEach(track => {
          track.stop();
          console.log(`Stopped ${track.kind} track:`, track.id);
        });
        localStreamRef.current = null;
      }

      console.log('🎥 Initializing media devices...');
      
      let stream: MediaStream | null = null;
      let hasVideo = true;
      let hasAudio = true;

      try {
        // Try to get both video and audio
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640, max: 640 },
            height: { ideal: 480, max: 480 },
            frameRate: { ideal: 24, max: 30 },
            facingMode: 'user'
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
      } catch (error) {
        console.warn('⚠️ Could not get video+audio, trying audio only...', error);
        hasVideo = false;
        
        try {
          // Try audio only
          stream = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            }
          });
        } catch (audioError) {
          console.warn('⚠️ Could not get audio either...', audioError);
          hasAudio = false;
          
          // Create empty stream as fallback
          stream = new MediaStream();
          
          toast({
            title: 'No Camera/Microphone',
            description: 'Continuing with audio-only mode. Partner will see your avatar.',
            variant: 'default',
          });
        }
      }

      if (!stream) {
        throw new Error('Could not initialize any media');
      }

      console.log('✅ Media stream obtained:', {
        hasVideo,
        hasAudio,
        videoTracks: stream.getVideoTracks().length,
        audioTracks: stream.getAudioTracks().length,
        videoSettings: stream.getVideoTracks()[0]?.getSettings()
      });

      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        console.log('📺 Local video srcObject set:', {
          streamId: stream.id,
          streamActive: stream.active,
          hasVideo,
          hasAudio,
          videoElement: localVideoRef.current,
          videoSrc: localVideoRef.current.src || 'MediaStream (no URL)',
        });
        // Ensure video plays
        if (hasVideo) {
          localVideoRef.current.play().catch(e => console.error('Error playing local video:', e));
        }
      }

      // Set initial states based on tracks
      stream.getVideoTracks().forEach(track => {
        track.enabled = videoEnabled;
        console.log('📹 Video track enabled:', track.enabled, 'ID:', track.id);
      });
      stream.getAudioTracks().forEach(track => {
        track.enabled = audioEnabled;
        console.log('🎤 Audio track enabled:', track.enabled, 'ID:', track.id);
      });

      // Update video enabled state if no video track
      if (!hasVideo) {
        setVideoEnabled(false);
      }

      return stream;
    } catch (error) {
      console.error('❌ Error accessing media devices:', error);
      
      // Clean up if initialization failed
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }
      
      toast({
        title: 'Media Error',
        description: 'Could not access camera or microphone. You can still chat via text.',
        variant: 'destructive',
      });
      return null;
    }
  }, [videoEnabled, audioEnabled, toast]);

  // Create WebRTC peer connection
  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection(rtcConfiguration);

    // Add local stream tracks with proper sender configuration
    if (localStreamRef.current) {
      console.log('➕ Adding local tracks to peer connection...');
      console.log('📊 Local stream details:', {
        streamId: localStreamRef.current.id,
        streamActive: localStreamRef.current.active,
        tracks: localStreamRef.current.getTracks().map(t => ({
          kind: t.kind,
          id: t.id,
          enabled: t.enabled,
          readyState: t.readyState
        }))
      });
      
      localStreamRef.current.getTracks().forEach(track => {
        const sender = pc.addTrack(track, localStreamRef.current!);
        console.log(`✅ Added ${track.kind} track:`, {
          trackId: track.id,
          trackEnabled: track.enabled,
          trackReadyState: track.readyState,
          sender: sender
        });
        
        // Apply bandwidth constraints for video
        if (track.kind === 'video' && sender) {
          const parameters = sender.getParameters();
          if (!parameters.encodings) {
            parameters.encodings = [{}];
          }
          // Set max bitrate for smoother streaming (500 kbps for video)
          parameters.encodings[0].maxBitrate = 500000; // 500 kbps
          sender.setParameters(parameters)
            .then(() => console.log('✅ Video bitrate limited to 500 kbps'))
            .catch(e => console.error('Failed to set parameters:', e));
        }
      });
    } else {
      console.warn('⚠️ No local stream available when creating peer connection');
    }

    // Handle incoming tracks
    pc.ontrack = (event) => {
      console.log('📹 Received remote track:', event.track.kind, event.streams);
      console.log('📊 Remote track details:', {
        trackId: event.track.id,
        trackKind: event.track.kind,
        trackEnabled: event.track.enabled,
        trackMuted: event.track.muted,
        trackReadyState: event.track.readyState,
        streamId: event.streams[0]?.id,
        streamActive: event.streams[0]?.active,
        streamTracks: event.streams[0]?.getTracks().map(t => ({
          kind: t.kind,
          id: t.id,
          enabled: t.enabled
        }))
      });
      
      if (remoteVideoRef.current && event.streams[0]) {
        console.log('✅ Setting remote video srcObject');
        remoteVideoRef.current.srcObject = event.streams[0];
        console.log('📺 Remote video srcObject set:', {
          streamId: event.streams[0].id,
          streamActive: event.streams[0].active,
          videoElement: remoteVideoRef.current,
          videoSrc: remoteVideoRef.current.src || 'MediaStream (no URL)',
          srcObject: remoteVideoRef.current.srcObject
        });
        // Ensure remote video plays
        remoteVideoRef.current.play().catch(e => {
          console.error('Error playing remote video:', e);
          // Try again after a short delay
          setTimeout(() => {
            if (remoteVideoRef.current) {
              remoteVideoRef.current.play().catch(console.error);
            }
          }, 500);
        });
      } else {
        console.warn('⚠️ Remote video ref or stream not available');
      }

      if (event.track.kind === 'video') {
        console.log('✅ Remote video track received');
        setRemoteVideoEnabled(true);
      } else if (event.track.kind === 'audio') {
        console.log('✅ Remote audio track received');
        setRemoteAudioEnabled(true);
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socket && sessionId) {
        socket.emit('random_chat_ice_candidate', {
          sessionId,
          candidate: event.candidate,
        });
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log('🔗 Peer Connection state:', pc.connectionState);
      if (pc.connectionState === 'connected') {
        console.log('✅ WebRTC Connected!');
        setStatus('connected');
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        console.log('❌ WebRTC Disconnected/Failed');
        handlePartnerDisconnected();
      }
    };

    // Handle ICE connection state changes (additional check)
    pc.oniceconnectionstatechange = () => {
      console.log('🧊 ICE Connection state:', pc.iceConnectionState);
      if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
        console.log('✅ ICE Connected!');
        setStatus('connected');
      } else if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
        console.log('❌ ICE Failed/Disconnected');
      }
    };

    // Log ICE gathering state
    pc.onicegatheringstatechange = () => {
      console.log('📊 ICE Gathering state:', pc.iceGatheringState);
    };

    // Log signaling state
    pc.onsignalingstatechange = () => {
      console.log('📡 Signaling state:', pc.signalingState);
    };

    peerConnectionRef.current = pc;
    return pc;
  }, [socket, sessionId]);

  // Start call (create offer)
  const startCall = useCallback(async () => {
    if (!socket || !sessionId) return;

    console.log('📞 Starting call as CALLER (creating offer)...');
    
    // Create peer connection and store it
    const pc = createPeerConnection();
    
    // Add a small delay to ensure ontrack handler is registered
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      
      // Modify SDP to limit bandwidth
      if (offer.sdp) {
        offer.sdp = offer.sdp.replace(/b=AS:(\d+)/g, 'b=AS:500'); // Limit to 500 kbps
        offer.sdp = offer.sdp.replace(/a=mid:(\d+)\r\n/g, 'a=mid:$1\r\nb=AS:500\r\n');
        console.log('📊 SDP modified to limit bandwidth');
      }
      
      await pc.setLocalDescription(offer);

      socket.emit('random_chat_offer', {
        sessionId,
        offer: pc.localDescription,
      });
      console.log('📤 Offer sent to peer');
    } catch (error) {
      console.error('❌ Error creating offer:', error);
    }
  }, [socket, sessionId, createPeerConnection]);

  // Handle incoming offer
  const handleOffer = useCallback(async (data: { offer: RTCSessionDescriptionInit }) => {
    if (!socket || !sessionId) return;

    console.log('📥 Received offer from peer - I am ANSWERER');
    
    // Create or reuse peer connection
    let pc = peerConnectionRef.current;
    if (!pc) {
      console.log('Creating new peer connection for answerer');
      pc = createPeerConnection();
    } else {
      console.log('Reusing existing peer connection');
    }
    
    // Add a small delay to ensure ontrack handler is registered
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      console.log('Setting remote description (offer)...');
      await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
      console.log('✅ Remote description set');
      
      console.log('Creating answer...');
      const answer = await pc.createAnswer();
      
      // Modify SDP to limit bandwidth
      if (answer.sdp) {
        answer.sdp = answer.sdp.replace(/b=AS:(\d+)/g, 'b=AS:500'); // Limit to 500 kbps
        answer.sdp = answer.sdp.replace(/a=mid:(\d+)\r\n/g, 'a=mid:$1\r\nb=AS:500\r\n');
        console.log('📊 Answer SDP modified to limit bandwidth');
      }
      
      await pc.setLocalDescription(answer);
      console.log('✅ Local description (answer) set');

      socket.emit('random_chat_answer', {
        sessionId,
        answer: pc.localDescription,
      });
      console.log('📤 Answer sent to peer');
      
      // Log connection state
      console.log('📊 Peer connection state after answer:', {
        connectionState: pc.connectionState,
        iceConnectionState: pc.iceConnectionState,
        signalingState: pc.signalingState
      });
    } catch (error) {
      console.error('❌ Error handling offer:', error);
    }
  }, [socket, sessionId, createPeerConnection]);

  // Handle incoming answer
  const handleAnswer = useCallback(async (data: { answer: RTCSessionDescriptionInit }) => {
    if (!peerConnectionRef.current) return;

    console.log('📥 Received answer');
    try {
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
    } catch (error) {
      console.error('❌ Error handling answer:', error);
    }
  }, []);

  // Handle ICE candidate
  const handleIceCandidate = useCallback(async (data: { candidate: RTCIceCandidateInit }) => {
    if (!peerConnectionRef.current) return;

    try {
      await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
    } catch (error) {
      console.error('❌ Error adding ICE candidate:', error);
    }
  }, []);

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    socket.on('random_chat_searching', () => {
      console.log('🔍 Searching for match...');
      setStatus('searching');
    });

    socket.on('random_chat_match_found', async (data: { sessionId: string; partner: Partner }) => {
      console.log('🎉 Match found!', data);
      setSessionId(data.sessionId);
      setPartner(data.partner);
      setStatus('connecting');
      setMessages([]);
      
      // Add to history when a new match is found (not from previous)
      setChatHistory(prev => {
        // Only add if this is a new forward connection
        const newHistory = [...prev];
        newHistory.push({
          partnerId: data.partner.id,
          partnerUsername: data.partner.username
        });
        return newHistory;
      });
      setCurrentHistoryIndex(prev => prev + 1);

      // Check if media is already initialized
      if (!localStreamRef.current) {
        console.log('📹 Media not initialized, initializing now...');
        await initializeMedia();
      } else {
        console.log('📹 Media already initialized, reusing existing stream');
      }
      
      // Small delay to ensure both peers are ready
      setTimeout(() => {
        startCall();
      }, 1000);

      toast({
        title: 'Match Found!',
        description: `Connected with ${data.partner.username}`,
      });
    });

    socket.on('random_chat_connected', () => {
      console.log('✅ Chat connected');
      setStatus('connected');
    });

    socket.on('random_chat_message', (data: { message: Message }) => {
      setMessages(prev => [...prev, data.message]);
    });

    socket.on('random_chat_typing', (data: { isTyping: boolean }) => {
      setIsTyping(data.isTyping);
    });

    socket.on('random_chat_partner_disconnected', () => {
      handlePartnerDisconnected();
    });

    socket.on('random_chat_partner_skipped', () => {
      handlePartnerDisconnected();
      toast({
        title: 'Partner Skipped',
        description: 'Your partner skipped the match',
      });
    });

    socket.on('random_chat_skipped', () => {
      setStatus('searching');
      toast({
        title: 'Match Skipped',
        description: 'Searching for a new match...',
      });
    });

    socket.on('random_chat_exited', () => {
      setStatus('idle');
      cleanupConnection();
    });

    socket.on('random_chat_error', (data: { error: string }) => {
      toast({
        title: 'Error',
        description: data.error,
        variant: 'destructive',
      });
    });

    // WebRTC signaling
    socket.on('random_chat_offer', handleOffer);
    socket.on('random_chat_answer', handleAnswer);
    socket.on('random_chat_ice_candidate', handleIceCandidate);

    return () => {
      socket.off('random_chat_searching');
      socket.off('random_chat_match_found');
      socket.off('random_chat_connected');
      socket.off('random_chat_message');
      socket.off('random_chat_typing');
      socket.off('random_chat_partner_disconnected');
      socket.off('random_chat_partner_skipped');
      socket.off('random_chat_skipped');
      socket.off('random_chat_exited');
      socket.off('random_chat_error');
      socket.off('random_chat_offer');
      socket.off('random_chat_answer');
      socket.off('random_chat_ice_candidate');
    };
  }, [socket, handleOffer, handleAnswer, handleIceCandidate, initializeMedia, startCall, toast]);

  // Cleanup connection
  const cleanupConnection = useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    setSessionId(null);
    setPartner(null);
    setMessages([]);
    setRemoteVideoEnabled(false);
    setRemoteAudioEnabled(false);
  }, []);

  // Handle partner disconnected
  const handlePartnerDisconnected = useCallback(() => {
    toast({
      title: 'Partner Disconnected',
      description: 'Your partner has left the chat',
    });

    cleanupConnection();
    setStatus('disconnected');

    // Auto search for new match after 2 seconds
    setTimeout(() => {
      if (socket) {
        // Prepare filters - exclude 'any' values and empty values
        const cleanFilters: any = {};
        if (filters.gender && filters.gender !== 'any') {
          cleanFilters.gender = filters.gender;
        }
        if (filters.country && selectedCountryCode && selectedCountryCode !== 'any') {
          cleanFilters.country = filters.country;
        }
        if (filters.city && filters.city !== 'any') {
          cleanFilters.city = filters.city;
        }
        if (filters.state) {
          cleanFilters.state = filters.state;
        }
        
        socket.emit('random_chat_join_queue', { filters: cleanFilters });
      }
    }, 2000);
  }, [socket, filters, selectedCountryCode, cleanupConnection, toast]);

  // Start random chat
  const startRandomChat = useCallback(async () => {
    if (!socket) return;

    // Only initialize media if not already initialized
    if (!localStreamRef.current) {
      console.log('📹 Initializing media for first time...');
      await initializeMedia();
    } else {
      console.log('📹 Media already initialized, skipping initialization');
    }
    
    // Prepare filters - exclude 'any' values and empty values
    const cleanFilters: any = {};
    if (filters.gender && filters.gender !== 'any') {
      cleanFilters.gender = filters.gender;
    }
    if (filters.country && selectedCountryCode && selectedCountryCode !== 'any') {
      cleanFilters.country = filters.country;
    }
    if (filters.city && filters.city !== 'any') {
      cleanFilters.city = filters.city;
    }
    if (filters.state) {
      cleanFilters.state = filters.state;
    }
    
    socket.emit('random_chat_join_queue', { filters: cleanFilters });
    setStatus('searching');
  }, [socket, filters, selectedCountryCode, initializeMedia]);

  // Stop random chat
  const stopRandomChat = useCallback(() => {
    if (!socket) return;

    if (status === 'searching') {
      socket.emit('random_chat_leave_queue');
    } else if (sessionId) {
      socket.emit('random_chat_exit');
    }

    cleanupConnection();
    setStatus('idle');
  }, [socket, status, sessionId, cleanupConnection]);

  // Skip current match
  const skipMatch = useCallback(() => {
    if (!socket || !sessionId) return;

    socket.emit('random_chat_skip');
    cleanupConnection();
    setStatus('searching');
  }, [socket, sessionId, cleanupConnection]);

  // Next match
  const nextMatch = useCallback(() => {
    if (!socket || !sessionId) return;

    socket.emit('random_chat_next');
    cleanupConnection();
    setStatus('searching');
  }, [socket, sessionId, cleanupConnection]);

  // Previous match
  const previousMatch = useCallback(() => {
    if (!socket || currentHistoryIndex <= 0) return;
    
    // Get the previous partner from history
    const previousIndex = currentHistoryIndex - 1;
    const previousPartner = chatHistory[previousIndex];
    
    if (!previousPartner) return;
    
    console.log(`⏮️ Requesting previous match: ${previousPartner.partnerUsername}`);
    
    // Emit event to reconnect with previous partner
    socket.emit('random_chat_previous', {
      partnerId: previousPartner.partnerId
    });
    
    cleanupConnection();
    setStatus('searching');
    setCurrentHistoryIndex(previousIndex);
  }, [socket, currentHistoryIndex, chatHistory, cleanupConnection]);

  // Send message
  const sendMessage = useCallback(() => {
    if (!socket || !sessionId || !newMessage.trim()) return;

    const messageData = {
      sessionId,
      message: newMessage.trim(),
      messageType: 'text' as const,
    };

    socket.emit('random_chat_message', messageData);
    setNewMessage('');

    // Clear typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    socket.emit('random_chat_typing', { sessionId, isTyping: false });
  }, [socket, sessionId, newMessage]);

  // Handle typing
  const handleTyping = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);

    if (!socket || !sessionId) return;

    // Send typing indicator
    socket.emit('random_chat_typing', { sessionId, isTyping: true });

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('random_chat_typing', { sessionId, isTyping: false });
    }, 1000);
  }, [socket, sessionId]);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideoEnabled(videoTrack.enabled);
      }
    }
  }, []);

  // Toggle audio
  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setAudioEnabled(audioTrack.enabled);
      }
    }
  }, []);

  // Apply video filter
  const applyVideoFilter = useCallback(() => {
    const canvas = filterCanvasRef.current;
    const video = localVideoRef.current;
    
    if (!canvas || !video || !videoEnabled) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Apply filter based on activeFilter
    switch (activeFilter) {
      case 'blur':
        ctx.filter = 'blur(10px)';
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        ctx.filter = 'none';
        break;
        
      case 'grayscale':
        ctx.filter = 'grayscale(100%)';
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        ctx.filter = 'none';
        break;
        
      case 'sepia':
        ctx.filter = 'sepia(100%)';
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        ctx.filter = 'none';
        break;
        
      case 'vintage':
        ctx.filter = 'sepia(50%) contrast(120%) brightness(90%)';
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        ctx.filter = 'none';
        break;
        
      case 'warm':
        // Draw image first
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        // Apply warm overlay
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.min(255, data[i] * 1.1); // Increase red
          data[i + 2] = data[i + 2] * 0.9; // Decrease blue
        }
        ctx.putImageData(imageData, 0, 0);
        break;
        
      case 'none':
      default:
        // No filter
        break;
    }
    
    // Continue processing
    filterProcessingRef.current = requestAnimationFrame(applyVideoFilter);
  }, [activeFilter, videoEnabled]);

  // Start/stop filter processing when filter changes
  useEffect(() => {
    if (activeFilter !== 'none' && videoEnabled) {
      // Start processing
      applyVideoFilter();
    } else {
      // Stop processing
      if (filterProcessingRef.current) {
        cancelAnimationFrame(filterProcessingRef.current);
        filterProcessingRef.current = null;
      }
    }
    
    return () => {
      if (filterProcessingRef.current) {
        cancelAnimationFrame(filterProcessingRef.current);
      }
    };
  }, [activeFilter, videoEnabled, applyVideoFilter]);

  // Toggle video size
  const toggleVideoSize = useCallback(() => {
    setLocalVideoEnlarged(!localVideoEnlarged);
  }, [localVideoEnlarged]);

  // Exit to home
  const exitToHome = useCallback(() => {
    stopRandomChat();
    router.push('/home');
  }, [stopRandomChat, router]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupConnection();
      if (socket && (status === 'searching' || sessionId)) {
        socket.emit('random_chat_exit');
      }
    };
  }, []);

  return (
    <div className="h-full w-full flex flex-col bg-black" suppressHydrationWarning>
      {/* Top Bar */}
      <div className="bg-gray-900 text-white p-4 flex items-center justify-between border-b border-gray-800" suppressHydrationWarning>
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">Random Connect</h1>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              status === 'connected' ? 'bg-green-500' :
              status === 'searching' || status === 'connecting' ? 'bg-yellow-500' :
              'bg-gray-500'
            }`} />
            <span className="text-sm text-gray-300">
              {status === 'idle' && 'Not Connected'}
              {status === 'searching' && 'Searching...'}
              {status === 'connecting' && 'Connecting...'}
              {status === 'connected' && `Connected with ${partner?.username}`}
              {status === 'disconnected' && 'Disconnected'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Filters - Always show toggle button */}
          {(status === 'idle' || status === 'searching') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Settings className="h-4 w-4 mr-2" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
          )}

          {/* Action buttons based on status */}
          {status === 'idle' && (
            <Button onClick={startRandomChat} className="bg-indigo-600 hover:bg-indigo-700">
              Start Random Chat
            </Button>
          )}

          {status === 'searching' && (
            <Button variant="destructive" onClick={stopRandomChat}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          )}

          {(status === 'connecting' || status === 'connected') && (
            <>
              <Button variant="outline" size="sm" onClick={skipMatch}>
                <SkipForward className="h-4 w-4 mr-2" />
                Skip
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={previousMatch}
                disabled={currentHistoryIndex <= 0}
              >
                <SkipBack className="h-4 w-4 mr-2" />
                Previous
              </Button>
              <Button variant="outline" size="sm" onClick={nextMatch}>
                Next
              </Button>
              <Button variant="destructive" size="sm" onClick={stopRandomChat}>
                Exit
              </Button>
            </>
          )}

          <Button variant="ghost" size="sm" onClick={exitToHome}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filters Panel - Show when filters are toggled and not in active chat */}
      {showFilters && (status === 'idle' || status === 'searching') && (
        <div className="bg-gray-800 p-4 border-b border-gray-700" suppressHydrationWarning>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl" suppressHydrationWarning>
            <Select
              value={filters.gender}
              onValueChange={(value) => setFilters({ ...filters, gender: value })}
            >
              <SelectTrigger className="bg-gray-700 border-gray-600">
                <SelectValue placeholder="Gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any Gender</SelectItem>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={selectedCountryCode}
              onValueChange={handleCountryChange}
            >
              <SelectTrigger className="bg-gray-700 border-gray-600">
                <SelectValue placeholder="Select Country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any Country</SelectItem>
                {countries.map((country) => (
                  <SelectItem key={country.code} value={country.code}>
                    {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.city}
              onValueChange={handleCityChange}
              disabled={!selectedCountryCode || selectedCountryCode === 'any'}
            >
              <SelectTrigger className="bg-gray-700 border-gray-600">
                <SelectValue placeholder={selectedCountryCode && selectedCountryCode !== 'any' ? "Select City" : "Select Country First"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any City</SelectItem>
                {cities.map((city, index) => (
                  <SelectItem key={`${city.name}-${index}`} value={city.name}>
                    {city.name}{city.state && `, ${city.state}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Area */}
        <div className="flex-1 relative bg-black">
          {/* Remote Video */}
          <div className="relative w-full h-full">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              muted={false}
              className="w-full h-full object-contain"
              onLoadedMetadata={() => console.log('🎥 Remote video metadata loaded')}
              onPlay={() => console.log('▶️ Remote video playing')}
              onError={(e) => console.error('❌ Remote video error:', e)}
            />
            
            {/* Show avatar/placeholder when no remote video */}
            {!remoteVideoEnabled && partner && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                <Avatar className="h-32 w-32 mb-4 border-4 border-indigo-500">
                  <AvatarImage 
                    src={
                      partner.profile.profilePicture?.type === 'upload' 
                        ? partner.profile.profilePicture.url 
                        : partner.profile.profilePicture?.type === 'avatar'
                        ? `https://api.dicebear.com/7.x/${partner.profile.profilePicture.avatarStyle?.toLowerCase().replace(/\s+/g, '-')}/svg?seed=${partner.profile.profilePicture.seed || partner.username}`
                        : undefined
                    }
                  />
                  <AvatarFallback className="text-4xl bg-indigo-600">
                    {partner.username[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <h3 className="text-2xl font-bold text-white mb-2">{partner.username}</h3>
                <p className="text-gray-400 flex items-center gap-2">
                  <VideoOff className="h-5 w-5" />
                  Camera Off - Audio Only
                </p>
              </div>
            )}
          </div>

          {/* Local Video (Picture-in-Picture or Enlarged) */}
          <div className={`absolute ${
            localVideoEnlarged 
              ? 'inset-0 z-10' 
              : 'top-4 right-4 w-48 h-36 z-20'
          } bg-gray-900 rounded-lg overflow-hidden shadow-xl border-2 border-gray-700 transition-all duration-300`}>
            <div className="relative w-full h-full">
              {/* Video element (hidden when filter is active) */}
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${activeFilter !== 'none' ? 'hidden' : ''}`}
                onLoadedMetadata={() => console.log('🎥 Local video metadata loaded')}
                onPlay={() => console.log('▶️ Local video playing')}
                onError={(e) => console.error('❌ Local video error:', e)}
              />
              
              {/* Canvas for filtered video */}
              <canvas
                ref={filterCanvasRef}
                className={`w-full h-full object-cover ${activeFilter === 'none' ? 'hidden' : ''}`}
              />
              
              {!videoEnabled && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                  <VideoOff className="h-8 w-8 text-gray-400" />
                </div>
              )}
              
              {/* Video Controls Overlay (on enlarged view) */}
              {localVideoEnlarged && (
                <div className="absolute top-4 right-4 flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={toggleVideoSize}
                    className="rounded-full"
                  >
                    <Minimize2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
              
              {/* Enlarge button (on small view) */}
              {!localVideoEnlarged && (status === 'connecting' || status === 'connected') && (
                <div className="absolute bottom-2 right-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={toggleVideoSize}
                    className="rounded-full w-8 h-8 p-0"
                  >
                    <Maximize2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Status Overlay */}
          {(status === 'idle' || status === 'searching' || status === 'disconnected') && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80">
              <div className="text-center text-white">
                {status === 'idle' && (
                  <>
                    <Video className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                    <h2 className="text-2xl font-bold mb-2">Welcome to Random Connect</h2>
                    <p className="text-gray-400 mb-4">Connect with random people online</p>
                    <Button onClick={startRandomChat} size="lg" className="bg-indigo-600 hover:bg-indigo-700">
                      Start Random Chat
                    </Button>
                  </>
                )}
                {status === 'searching' && (
                  <>
                    <Loader2 className="h-16 w-16 mx-auto mb-4 animate-spin text-indigo-500" />
                    <h2 className="text-2xl font-bold mb-2">Searching for a match...</h2>
                    <p className="text-gray-400">Please wait while we find someone for you</p>
                  </>
                )}
                {status === 'disconnected' && (
                  <>
                    <PhoneOff className="h-16 w-16 mx-auto mb-4 text-red-500" />
                    <h2 className="text-2xl font-bold mb-2">Disconnected</h2>
                    <p className="text-gray-400 mb-4">Searching for a new match...</p>
                    <Loader2 className="h-8 w-8 mx-auto animate-spin text-indigo-500" />
                  </>
                )}
              </div>
            </div>
          )}

          {/* Video Controls */}
          {(status === 'connecting' || status === 'connected') && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2">
              <Button
                size="lg"
                variant={videoEnabled ? 'default' : 'destructive'}
                onClick={toggleVideo}
                className="rounded-full w-14 h-14"
              >
                {videoEnabled ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
              </Button>

              <Button
                size="lg"
                variant={audioEnabled ? 'default' : 'destructive'}
                onClick={toggleAudio}
                className="rounded-full w-14 h-14"
              >
                {audioEnabled ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
              </Button>

              <Button
                size="lg"
                variant="outline"
                onClick={() => setShowChat(!showChat)}
                className="rounded-full w-14 h-14"
              >
                <MessageSquare className="h-6 w-6" />
              </Button>
              
              {/* Filter Menu Button */}
              <div className="relative">
                <Button
                  size="lg"
                  variant={activeFilter !== 'none' ? 'default' : 'outline'}
                  onClick={() => setShowFilterMenu(!showFilterMenu)}
                  className="rounded-full w-14 h-14"
                >
                  <Sparkles className="h-6 w-6" />
                </Button>
                
                {/* Filter Dropdown Menu */}
                {showFilterMenu && (
                  <div className="absolute bottom-16 left-0 bg-gray-800 rounded-lg shadow-xl p-2 min-w-[200px] border border-gray-700">
                    <div className="space-y-1">
                      <button
                        onClick={() => {
                          setActiveFilter('none');
                          setShowFilterMenu(false);
                        }}
                        className={`w-full text-left px-4 py-2 rounded hover:bg-gray-700 text-white ${
                          activeFilter === 'none' ? 'bg-gray-700' : ''
                        }`}
                      >
                        No Filter
                      </button>
                      <button
                        onClick={() => {
                          setActiveFilter('blur');
                          setShowFilterMenu(false);
                        }}
                        className={`w-full text-left px-4 py-2 rounded hover:bg-gray-700 text-white flex items-center gap-2 ${
                          activeFilter === 'blur' ? 'bg-gray-700' : ''
                        }`}
                      >
                        <Eye className="h-4 w-4" />
                        Blur Face
                      </button>
                      <button
                        onClick={() => {
                          setActiveFilter('grayscale');
                          setShowFilterMenu(false);
                        }}
                        className={`w-full text-left px-4 py-2 rounded hover:bg-gray-700 text-white ${
                          activeFilter === 'grayscale' ? 'bg-gray-700' : ''
                        }`}
                      >
                        Grayscale
                      </button>
                      <button
                        onClick={() => {
                          setActiveFilter('sepia');
                          setShowFilterMenu(false);
                        }}
                        className={`w-full text-left px-4 py-2 rounded hover:bg-gray-700 text-white ${
                          activeFilter === 'sepia' ? 'bg-gray-700' : ''
                        }`}
                      >
                        Sepia
                      </button>
                      <button
                        onClick={() => {
                          setActiveFilter('vintage');
                          setShowFilterMenu(false);
                        }}
                        className={`w-full text-left px-4 py-2 rounded hover:bg-gray-700 text-white ${
                          activeFilter === 'vintage' ? 'bg-gray-700' : ''
                        }`}
                      >
                        Vintage
                      </button>
                      <button
                        onClick={() => {
                          setActiveFilter('warm');
                          setShowFilterMenu(false);
                        }}
                        className={`w-full text-left px-4 py-2 rounded hover:bg-gray-700 text-white ${
                          activeFilter === 'warm' ? 'bg-gray-700' : ''
                        }`}
                      >
                        Warm Tone
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Chat Sidebar */}
        {showChat && (status === 'connecting' || status === 'connected') && (
          <div className="w-80 bg-gray-900 border-l border-gray-800 flex flex-col">
            {/* Partner Info */}
            {partner && (
              <div className="p-4 border-b border-gray-800">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage 
                      src={
                        partner.profile.profilePicture?.type === 'upload' 
                          ? partner.profile.profilePicture.url 
                          : partner.profile.profilePicture?.type === 'avatar'
                          ? `https://api.dicebear.com/7.x/${partner.profile.profilePicture.avatarStyle?.toLowerCase().replace(/\s+/g, '-')}/svg?seed=${partner.profile.profilePicture.seed || partner.username}`
                          : undefined
                      }
                    />
                    <AvatarFallback>{partner.username[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-white">{partner.username}</p>
                    <p className="text-xs text-gray-400">
                      {partner.profile.location.city && `${partner.profile.location.city}, `}
                      {partner.profile.location.country}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        msg.senderId === user?.id
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-800 text-white'
                      }`}
                    >
                      <p className="text-sm">{msg.message}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(msg.timestamp).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-gray-800 text-white rounded-lg p-3">
                      <p className="text-sm text-gray-400">Typing...</p>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-800">
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={handleTyping}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message..."
                  className="bg-gray-800 border-gray-700 text-white"
                />
                <Button onClick={sendMessage} size="icon" className="shrink-0">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

