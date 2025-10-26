'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
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
import { FaceFilter, FilterType } from './FaceFilter';

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
  const [activeFilter, setActiveFilter] = useState<FilterType>('none');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [filterEnabled, setFilterEnabled] = useState(false);

  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const filterCanvasRef = useRef<HTMLCanvasElement>(null);
  const filterProcessingRef = useRef<number | null>(null);
  const filteredStreamRef = useRef<MediaStream | null>(null);

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
        videoSettings: stream.getVideoTracks()[0]?.getSettings(),
        audioTrackDetails: stream.getAudioTracks().map(t => ({
          id: t.id,
          label: t.label,
          enabled: t.enabled,
          muted: t.muted,
          readyState: t.readyState
        }))
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
    console.log('🆕 Creating new RTCPeerConnection...');
    const pc = new RTCPeerConnection(rtcConfiguration);
    console.log('✅ RTCPeerConnection created:', {
      connectionState: pc.connectionState,
      iceConnectionState: pc.iceConnectionState,
      signalingState: pc.signalingState
    });

    // Add local stream tracks with proper sender configuration
    // Use filtered stream if filter is enabled, otherwise use original stream
    const streamToSend = (filterEnabled && filteredStreamRef.current) ? filteredStreamRef.current : localStreamRef.current;
    
    if (streamToSend) {
      console.log('➕ Adding local tracks to peer connection...');
      console.log('📊 Local stream details:', {
        streamId: streamToSend.id,
        streamActive: streamToSend.active,
        isFiltered: filterEnabled && filteredStreamRef.current === streamToSend,
        tracks: streamToSend.getTracks().map(t => ({
          kind: t.kind,
          id: t.id,
          enabled: t.enabled,
          readyState: t.readyState
        }))
      });
      
      streamToSend.getTracks().forEach(track => {
        const sender = pc.addTrack(track, streamToSend!);
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
          enabled: t.enabled,
          muted: t.muted
        }))
      });
      
      if (remoteVideoRef.current && event.streams[0]) {
        console.log('✅ Setting remote video srcObject');
        
        // Check if this is the first track or if we need to update
        if (!remoteVideoRef.current.srcObject) {
        remoteVideoRef.current.srcObject = event.streams[0];
          console.log('📺 Remote video srcObject set (NEW)');
        } else {
          // Stream already exists, just log
          console.log('📺 Remote video srcObject already set, track added to existing stream');
        }
        
        console.log('📺 Remote video element state:', {
          streamId: event.streams[0].id,
          streamActive: event.streams[0].active,
          videoElement: remoteVideoRef.current,
          videoSrc: remoteVideoRef.current.src || 'MediaStream (no URL)',
          srcObject: remoteVideoRef.current.srcObject,
          videoElementReadyState: remoteVideoRef.current.readyState,
          videoElementNetworkState: remoteVideoRef.current.networkState,
          muted: remoteVideoRef.current.muted,
          volume: remoteVideoRef.current.volume,
          audioTracks: (remoteVideoRef.current.srcObject as MediaStream)?.getAudioTracks().length || 0,
          videoTracks: (remoteVideoRef.current.srcObject as MediaStream)?.getVideoTracks().length || 0
        });
        
        // Add event listeners for debugging
        remoteVideoRef.current.onloadedmetadata = () => {
          console.log('🎥 Remote video metadata loaded:', {
            videoWidth: remoteVideoRef.current?.videoWidth,
            videoHeight: remoteVideoRef.current?.videoHeight,
            duration: remoteVideoRef.current?.duration
          });
        };
        
        remoteVideoRef.current.oncanplay = () => {
          console.log('▶️ Remote video can play');
        };
        
        remoteVideoRef.current.onplay = () => {
          console.log('▶️ Remote video started playing');
        };
        
        remoteVideoRef.current.onerror = (e) => {
          console.error('❌ Remote video error:', e);
          console.error('❌ Video error details:', {
            error: remoteVideoRef.current?.error,
            networkState: remoteVideoRef.current?.networkState,
            readyState: remoteVideoRef.current?.readyState
          });
        };
        
        // Ensure remote video plays
        remoteVideoRef.current.play().catch(e => {
          console.error('❌ Error playing remote video:', e);
          console.error('❌ Play error details:', {
            error: e,
            videoElement: remoteVideoRef.current,
            srcObject: remoteVideoRef.current?.srcObject,
            readyState: remoteVideoRef.current?.readyState
          });
          
          // Check if it's an autoplay policy issue
          if (e.name === 'NotAllowedError') {
            console.warn('⚠️ Autoplay blocked by browser policy. User interaction required.');
            toast({
              title: 'Click to Enable Audio/Video',
              description: 'Click anywhere on the screen to enable audio and video playback.',
              variant: 'default',
            });
          }
          
          // Try again after a short delay
          setTimeout(() => {
            if (remoteVideoRef.current) {
              console.log('🔄 Retrying remote video play...');
              remoteVideoRef.current.play().catch(retryError => {
                console.error('❌ Retry play failed:', retryError);
              });
            }
          }, 500);
        });
        
        // Ensure volume is at maximum and not muted
        if (remoteVideoRef.current) {
          remoteVideoRef.current.volume = 1.0;
          remoteVideoRef.current.muted = false;
          console.log('🔊 Remote video audio settings:', {
            volume: remoteVideoRef.current.volume,
            muted: remoteVideoRef.current.muted,
            audioTracks: (remoteVideoRef.current.srcObject as MediaStream)?.getAudioTracks().map(t => ({
              id: t.id,
              enabled: t.enabled,
              muted: t.muted,
              readyState: t.readyState
            }))
          });
        }
      } else {
        console.warn('⚠️ Remote video ref or stream not available:', {
          hasRemoteVideoRef: !!remoteVideoRef.current,
          hasStream: !!event.streams[0],
          streamCount: event.streams.length
        });
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
        console.log('🧊 Local ICE candidate generated:', {
          type: event.candidate.type,
          protocol: event.candidate.protocol,
          address: event.candidate.address,
          port: event.candidate.port,
          candidate: event.candidate.candidate
        });
        socket.emit('random_chat_ice_candidate', {
          sessionId,
          candidate: event.candidate,
        });
        console.log('📤 ICE candidate sent to peer');
      } else if (!event.candidate) {
        console.log('✅ ICE gathering complete (null candidate received)');
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
    console.log('💾 Peer connection stored in ref:', {
      hasRef: !!peerConnectionRef.current,
      connectionState: peerConnectionRef.current?.connectionState
    });
    return pc;
  }, [socket, sessionId, filterEnabled]);

  // Start call (create offer) - with sessionId parameter
  const startCallWithSessionId = useCallback(async (currentSessionId: string) => {
    console.log('📞 startCallWithSessionId() called with:', {
      hasSocket: !!socket,
      sessionId: currentSessionId,
      hasLocalStream: !!localStreamRef.current,
      localStreamActive: localStreamRef.current?.active
    });
    
    if (!socket || !currentSessionId) {
      console.error('❌ startCallWithSessionId() aborted: missing socket or sessionId', {
        socket: !!socket,
        sessionId: currentSessionId
      });
      return;
    }

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
        sessionId: currentSessionId,
        offer: pc.localDescription,
      });
      console.log('📤 Offer sent to peer');
    } catch (error) {
      console.error('❌ Error creating offer:', error);
    }
  }, [socket, createPeerConnection]);

  // Start call (create offer) - original function for backward compatibility
  const startCall = useCallback(async () => {
    if (!sessionId) {
      console.error('❌ startCall() aborted: no sessionId in state');
      return;
    }
    return startCallWithSessionId(sessionId);
  }, [sessionId, startCallWithSessionId]);

  // Handle incoming offer
  const handleOffer = useCallback(async (data: { offer: RTCSessionDescriptionInit }) => {
    console.log('📥 handleOffer() called with:', {
      hasSocket: !!socket,
      sessionId,
      hasOffer: !!data.offer,
      offerType: data.offer?.type
    });
    
    if (!socket || !sessionId) {
      console.error('❌ Cannot handle offer: socket or sessionId missing', { socket: !!socket, sessionId });
      return;
    }

    console.log('📥 Received offer from peer - I am ANSWERER');
    console.log('📊 Offer details:', data.offer);
    
    // Always create a new peer connection when receiving an offer
    // This ensures fresh state and proper track handling
    if (peerConnectionRef.current) {
      console.log('🧹 Closing existing peer connection before creating new one');
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    console.log('🆕 Creating new peer connection for answerer');
    const pc = createPeerConnection();
    console.log('✅ Peer connection created:', {
      hasConnection: !!pc,
      connectionState: pc?.connectionState,
      iceConnectionState: pc?.iceConnectionState
    });
    
    if (!localStreamRef.current) {
      console.error('❌ No local stream available when answering!');
      toast({
        title: 'Media Error',
        description: 'Could not access your media. Please reload the page.',
        variant: 'destructive',
      });
      return;
    }
    
    const localTracks = localStreamRef.current.getTracks();
    console.log('📊 Local tracks before answering:', {
      totalTracks: localTracks.length,
      tracks: localTracks.map(t => ({ kind: t.kind, id: t.id, enabled: t.enabled, readyState: t.readyState }))
    });

    try {
      console.log('📝 Setting remote description (offer)...');
      await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
      console.log('✅ Remote description set');
      
      console.log('📝 Creating answer...');
      const answer = await pc.createAnswer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      
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
        signalingState: pc.signalingState,
        localTracks: pc.getSenders().length,
        remoteTracks: pc.getReceivers().length
      });
    } catch (error) {
      console.error('❌ Error handling offer:', error);
      toast({
        title: 'Connection Error',
        description: 'Failed to establish WebRTC connection. Please try reconnecting.',
        variant: 'destructive',
      });
    }
  }, [socket, sessionId, createPeerConnection, toast]);

  // Handle incoming answer
  const handleAnswer = useCallback(async (data: { answer: RTCSessionDescriptionInit }) => {
    if (!peerConnectionRef.current) {
      console.error('❌ Cannot handle answer: No peer connection exists');
      return;
    }

    console.log('📥 Received answer from peer');
    console.log('📊 Answer details:', data.answer);
    console.log('📊 Current peer connection state:', {
      connectionState: peerConnectionRef.current.connectionState,
      iceConnectionState: peerConnectionRef.current.iceConnectionState,
      signalingState: peerConnectionRef.current.signalingState,
      localTracks: peerConnectionRef.current.getSenders().length,
      remoteTracks: peerConnectionRef.current.getReceivers().length
    });
    
    try {
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
      console.log('✅ Remote description (answer) set successfully');
      console.log('📊 Updated peer connection state:', {
        connectionState: peerConnectionRef.current.connectionState,
        iceConnectionState: peerConnectionRef.current.iceConnectionState,
        signalingState: peerConnectionRef.current.signalingState
      });
    } catch (error) {
      console.error('❌ Error handling answer:', error);
      toast({
        title: 'Connection Error',
        description: 'Failed to complete WebRTC connection. Please try reconnecting.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  // Handle ICE candidate
  const handleIceCandidate = useCallback(async (data: { candidate: RTCIceCandidateInit }) => {
    if (!peerConnectionRef.current) {
      console.warn('⚠️ Cannot add ICE candidate: No peer connection exists');
      return;
    }

    console.log('🧊 Received ICE candidate:', data.candidate);
    
    try {
      await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
      console.log('✅ ICE candidate added successfully');
    } catch (error) {
      console.error('❌ Error adding ICE candidate:', error);
      // Don't show toast for ICE candidate errors as they're not critical
    }
  }, []);

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    socket.on('random_chat_searching', () => {
      console.log('🔍 Searching for match...');
      setStatus('searching');
    });

    socket.on('random_chat_match_found', async (data: { sessionId: string; partner: Partner; isInitiator?: boolean }) => {
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
      
      // Only the initiator starts the call to avoid both sides creating offers
      // The backend should mark one user as the initiator
      const myId = user?.id; // Use 'id' instead of '_id'
      const partnerId = data.partner.id;
      
      // Fallback: if IDs are not available, use sessionId for deterministic initiation
      let shouldInitiateCall = false;
      if (myId && partnerId) {
        shouldInitiateCall = myId < partnerId;
      } else if (data.sessionId) {
        // Use sessionId as fallback - take first character modulo 2
        shouldInitiateCall = data.sessionId.charCodeAt(0) % 2 === 0;
        console.log('⚠️ Using sessionId fallback for call initiation:', {
          sessionId: data.sessionId,
          firstChar: data.sessionId[0],
          charCode: data.sessionId.charCodeAt(0),
          shouldInitiateCall
        });
      }
      
      console.log('📊 Call initiation decision:', {
        myId,
        partnerId,
        shouldInitiateCall,
        userExists: !!user,
        partnerExists: !!data.partner,
        myIdExists: !!myId,
        partnerIdExists: !!partnerId,
        reason: shouldInitiateCall ? 'My ID is lexicographically smaller' : 'Partner will initiate'
      });
      
      if (shouldInitiateCall) {
        console.log('📞 I will initiate the call (creating offer)');
        // Small delay to ensure both peers are ready
        setTimeout(() => {
          console.log('⏰ Timeout reached, calling startCall()...');
          // Pass sessionId directly to avoid state timing issues
          startCallWithSessionId(data.sessionId).catch(error => {
            console.error('❌ startCall() failed:', error);
          });
        }, 1000);
      } else {
        console.log('👂 I will wait for offer from partner');
        console.log('👂 Waiting for offer... (checking for offer handler)');
      }

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
  }, [socket, handleOffer, handleAnswer, handleIceCandidate, initializeMedia, startCallWithSessionId, toast]);

  // Cleanup connection
  const cleanupConnection = useCallback(() => {
    if (peerConnectionRef.current) {
      console.log('🧹 Closing peer connection:', {
        connectionState: peerConnectionRef.current.connectionState,
        iceConnectionState: peerConnectionRef.current.iceConnectionState,
        signalingState: peerConnectionRef.current.signalingState
      });
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
      console.log('✅ Peer connection closed and cleared');
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
        console.log('🔊 Audio toggled:', {
          enabled: audioTrack.enabled,
          trackId: audioTrack.id,
          trackLabel: audioTrack.label,
          trackMuted: audioTrack.muted,
          trackReadyState: audioTrack.readyState
        });
      } else {
        console.warn('⚠️ No audio track found in local stream');
      }
    } else {
      console.warn('⚠️ No local stream available for audio toggle');
    }
  }, []);

  // Create filtered stream from canvas
  useEffect(() => {
    if (filterEnabled && activeFilter !== 'none' && filterCanvasRef.current) {
      console.log('🎨 Creating filtered stream...', { filterEnabled, activeFilter, hasCanvas: !!filterCanvasRef.current });
      
    const canvas = filterCanvasRef.current;
      
      // Wait a bit for the canvas to have content
      setTimeout(() => {
        // Capture stream from filtered canvas at 30 FPS
        const canvasStream = canvas.captureStream(30);
        
        console.log('📹 Canvas stream captured:', {
          streamId: canvasStream.id,
          videoTracks: canvasStream.getVideoTracks().length,
          audioTracks: canvasStream.getAudioTracks().length
        });
        
        // Add audio from original stream
        if (localStreamRef.current) {
          const audioTracks = localStreamRef.current.getAudioTracks();
          audioTracks.forEach(track => {
            canvasStream.addTrack(track);
            console.log('🔊 Added audio track to filtered stream:', track.id);
          });
        }
        
        filteredStreamRef.current = canvasStream;
        console.log('✅ Filtered stream created from canvas');
        
        // Update peer connection if already connected
        if (peerConnectionRef.current && peerConnectionRef.current.connectionState === 'connected') {
          console.log('🔄 Updating peer connection with filtered stream...');
          
          // Replace video track
          const videoTrack = canvasStream.getVideoTracks()[0];
          const sender = peerConnectionRef.current.getSenders().find(s => s.track?.kind === 'video');
          if (sender && videoTrack) {
            sender.replaceTrack(videoTrack)
              .then(() => console.log('✅ Video track replaced with filtered version'))
              .catch(err => console.error('❌ Failed to replace video track:', err));
          }
        }
      }, 500); // Give canvas time to render
    } else {
      console.log('🚫 Filter disabled or removed', { filterEnabled, activeFilter });
      
      // Restore original stream
      if (filteredStreamRef.current) {
        filteredStreamRef.current.getTracks().forEach(track => track.stop());
        filteredStreamRef.current = null;
      }
      
      // Restore original video track if connected
      if (peerConnectionRef.current && peerConnectionRef.current.connectionState === 'connected' && localStreamRef.current) {
        console.log('🔄 Restoring original video stream...');
        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        const sender = peerConnectionRef.current.getSenders().find(s => s.track?.kind === 'video');
        if (sender && videoTrack) {
          sender.replaceTrack(videoTrack)
            .then(() => console.log('✅ Video track restored to original'))
            .catch(err => console.error('❌ Failed to restore video track:', err));
        }
      }
    }
  }, [filterEnabled, activeFilter]);

  // Toggle video size
  const toggleVideoSize = useCallback(() => {
    setLocalVideoEnlarged(!localVideoEnlarged);
  }, [localVideoEnlarged]);

  // Debug function to check remote video state
  const debugRemoteVideo = useCallback(() => {
    console.log('🔍 Remote Video Debug Info:', {
      hasRemoteVideoRef: !!remoteVideoRef.current,
      remoteVideoElement: remoteVideoRef.current,
      srcObject: remoteVideoRef.current?.srcObject,
      src: remoteVideoRef.current?.src,
      readyState: remoteVideoRef.current?.readyState,
      networkState: remoteVideoRef.current?.networkState,
      videoWidth: remoteVideoRef.current?.videoWidth,
      videoHeight: remoteVideoRef.current?.videoHeight,
      paused: remoteVideoRef.current?.paused,
      muted: remoteVideoRef.current?.muted,
      autoplay: remoteVideoRef.current?.autoplay,
      playsInline: remoteVideoRef.current?.playsInline,
      volume: remoteVideoRef.current?.volume,
      remoteVideoEnabled,
      peerConnectionState: peerConnectionRef.current?.connectionState,
      iceConnectionState: peerConnectionRef.current?.iceConnectionState,
      signalingState: peerConnectionRef.current?.signalingState,
      localTracks: peerConnectionRef.current?.getSenders().length,
      remoteTracks: peerConnectionRef.current?.getReceivers().length
    });
    
    // Additional debugging for peer connection lifecycle
    console.log('🔍 Peer Connection Lifecycle Debug:', {
      hasPeerConnection: !!peerConnectionRef.current,
      sessionId,
      status,
      hasSocket: !!socket,
      hasLocalStream: !!localStreamRef.current,
      localStreamActive: localStreamRef.current?.active,
      localStreamTracks: localStreamRef.current?.getTracks().length,
      partnerId: partner?.id,
      currentTime: new Date().toISOString()
    });
    
    // Audio-specific debugging
    console.log('🔊 Audio Debug Info:', {
      remoteVideoMuted: remoteVideoRef.current?.muted,
      remoteVideoVolume: remoteVideoRef.current?.volume,
      remoteAudioEnabled,
      localAudioEnabled: audioEnabled,
      localAudioTrack: localStreamRef.current?.getAudioTracks()[0],
      localAudioTrackEnabled: localStreamRef.current?.getAudioTracks()[0]?.enabled,
      remoteStream: remoteVideoRef.current?.srcObject as MediaStream | null,
      remoteAudioTracks: (remoteVideoRef.current?.srcObject as MediaStream)?.getAudioTracks().length || 0,
      remoteAudioTrackEnabled: (remoteVideoRef.current?.srcObject as MediaStream)?.getAudioTracks()[0]?.enabled,
      remoteAudioTrackReadyState: (remoteVideoRef.current?.srcObject as MediaStream)?.getAudioTracks()[0]?.readyState,
    });
    
    // Check if we're in the right state for WebRTC
    if (status !== 'connected' && status !== 'connecting') {
      console.warn('⚠️ Not in connected/connecting state - WebRTC may not be active');
    }
    
    if (!peerConnectionRef.current) {
      console.error('❌ No peer connection exists! This is the main issue.');
    }
    
    if (!sessionId) {
      console.error('❌ No session ID - cannot establish WebRTC connection');
    }
  }, [remoteVideoEnabled, remoteAudioEnabled, audioEnabled, sessionId, status, socket, partner]);

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
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2">
            <Image 
              src="/logo-icon.png" 
              alt="Flipy Chat Logo" 
              width={28} 
              height={28}
              className="sm:w-8 sm:h-8"
            />
            <h1 className="text-lg sm:text-xl font-bold hidden sm:block">Flipy Chat</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              status === 'connected' ? 'bg-green-500' :
              status === 'searching' || status === 'connecting' ? 'bg-yellow-500' :
              'bg-gray-500'
            }`} />
            <span className="text-xs sm:text-sm text-gray-300">
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
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">
              {showFilters ? 'Hide Filters' : 'Show Filters'}
              </span>
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
              <Button variant="outline" size="sm" onClick={skipMatch} className="hidden md:flex">
                <SkipForward className="h-4 w-4 mr-2" />
                Skip
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={previousMatch}
                disabled={currentHistoryIndex <= 0}
                className="hidden md:flex"
              >
                <SkipBack className="h-4 w-4 mr-2" />
                Previous
              </Button>
              <Button variant="outline" size="sm" onClick={nextMatch} className="hidden md:flex">
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

        {/* Gender/Country/City Filters Row - Show always when filters are toggled */}
      {showFilters && (status === 'idle' || status === 'searching') && (
          <div className="border-t border-gray-700 px-4 py-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-w-4xl" suppressHydrationWarning>
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
      </div>

      {/* Old Filters Panel - REMOVED, now using inline filters */}
      {false && showFilters && (status === 'idle' || status === 'searching') && (
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
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Video Area */}
        <div className="flex-1 relative bg-black min-h-[50vh] md:min-h-0">
          {/* Remote Video */}
          <div className="relative w-full h-full">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              muted={false}
              className="w-full h-full object-contain"
              onClick={() => {
                // Enable audio playback on user interaction
                if (remoteVideoRef.current && remoteVideoRef.current.paused) {
                  console.log('🔊 User clicked video - attempting to enable audio/video playback');
                  remoteVideoRef.current.play().catch(e => {
                    console.error('❌ Failed to enable playback:', e);
                  });
                }
              }}
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
              : 'top-2 right-2 w-24 h-20 sm:w-32 sm:h-24 md:w-48 md:h-36 z-20'
          } bg-gray-900 rounded-lg overflow-hidden shadow-xl border-2 border-gray-700 transition-all duration-300`}>
            <div className="relative w-full h-full">
              {/* Hidden video element (source for filters) */}
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${filterEnabled && activeFilter !== 'none' ? 'hidden' : ''}`}
                onLoadedMetadata={() => console.log('🎥 Local video metadata loaded')}
                onPlay={() => console.log('▶️ Local video playing')}
                onError={(e) => console.error('❌ Local video error:', e)}
              />
              
              {/* Canvas for filtered video (visible when filter is active) */}
              <canvas
                ref={filterCanvasRef}
                className={`w-full h-full object-cover ${filterEnabled && activeFilter !== 'none' ? '' : 'hidden'}`}
              />
              
              {/* FaceFilter component */}
              <FaceFilter
                sourceVideoRef={localVideoRef as React.RefObject<HTMLVideoElement>}
                outputCanvasRef={filterCanvasRef as React.RefObject<HTMLCanvasElement>}
                filterType={activeFilter}
                enabled={filterEnabled}
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

          {/* Navigation Controls - Mobile only (above video controls) */}
          {(status === 'connecting' || status === 'connected') && (
            <div className="absolute bottom-16 sm:bottom-20 left-1/2 transform -translate-x-1/2 flex items-center gap-2 md:hidden">
              <Button 
                variant="outline" 
                size="sm"
                onClick={previousMatch}
                disabled={currentHistoryIndex <= 0}
                className="h-8 px-2 text-xs"
              >
                <SkipBack className="h-3 w-3 mr-1" />
                Prev
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={skipMatch}
                className="h-8 px-2 text-xs"
              >
                <SkipForward className="h-3 w-3 mr-1" />
                Skip
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={nextMatch}
                className="h-8 px-2 text-xs"
              >
                Next
              </Button>
            </div>
          )}

          {/* Video Controls */}
          {(status === 'connecting' || status === 'connected') && (
            <div className="absolute bottom-2 md:bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-1 sm:gap-2">
              <Button
                size="lg"
                variant={videoEnabled ? 'default' : 'destructive'}
                onClick={toggleVideo}
                className="rounded-full w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 p-0"
              >
                {videoEnabled ? <Video className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" /> : <VideoOff className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />}
              </Button>

              <Button
                size="lg"
                variant={audioEnabled ? 'default' : 'destructive'}
                onClick={toggleAudio}
                className="rounded-full w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 p-0"
              >
                {audioEnabled ? <Mic className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" /> : <MicOff className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />}
              </Button>

              <Button
                size="lg"
                variant="outline"
                onClick={() => setShowChat(!showChat)}
                className="rounded-full w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 p-0 md:hidden"
              >
                <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
              </Button>
              
              {/* Debug Button - Only show in development */}
              {process.env.NODE_ENV === 'development' && (
                <Button
                  size="lg"
                  variant="outline"
                  onClick={debugRemoteVideo}
                  className="rounded-full w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 p-0 hidden sm:flex"
                  title="Debug Remote Video"
                >
                  🔍
                </Button>
              )}
              
              {/* Filter Menu Button */}
              <div className="relative">
                <Button
                  size="lg"
                  variant={filterEnabled && activeFilter !== 'none' ? 'default' : 'outline'}
                  onClick={() => setShowFilterMenu(!showFilterMenu)}
                  className="rounded-full w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 p-0"
                >
                  <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
                </Button>
                
                {/* Filter Dropdown - Mobile Optimized */}
                {showFilterMenu && (
                  <>
                    {/* Backdrop for mobile */}
                    <div 
                      className="fixed inset-0 bg-black/50 z-40 md:hidden"
                      onClick={() => setShowFilterMenu(false)}
                    />
                    
                    {/* Filter Menu */}
                    <div className="fixed md:absolute bottom-0 md:bottom-16 left-0 right-0 md:left-auto md:right-auto md:w-[250px] bg-gray-800 rounded-t-2xl md:rounded-lg shadow-xl p-3 max-h-[60vh] md:max-h-[400px] overflow-y-auto border-t md:border border-gray-700 z-50">
                      <div className="flex items-center justify-between mb-3 md:hidden">
                        <h3 className="text-white font-semibold">Face Filters</h3>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setShowFilterMenu(false)}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                      <button
                        onClick={() => {
                          setActiveFilter('none');
                            setFilterEnabled(false);
                          setShowFilterMenu(false);
                        }}
                          className={`w-full text-left px-4 py-2.5 rounded hover:bg-gray-700 text-white transition-colors ${
                            activeFilter === 'none' ? 'bg-indigo-600' : ''
                        }`}
                      >
                          <span className="font-semibold">No Filter</span>
                      </button>
                        
                        {/* Privacy */}
                        <div className="border-t border-gray-600 pt-2 mt-2">
                          <p className="text-xs text-gray-400 px-2 mb-1">PRIVACY</p>
                      <button
                        onClick={() => {
                              setActiveFilter('blur-face');
                              setFilterEnabled(true);
                          setShowFilterMenu(false);
                        }}
                            className={`w-full text-left px-4 py-2.5 rounded hover:bg-gray-700 text-white flex items-center gap-2 transition-colors ${
                              activeFilter === 'blur-face' ? 'bg-indigo-600' : ''
                        }`}
                      >
                        <Eye className="h-4 w-4" />
                        Blur Face
                      </button>
                        </div>
                        
                        {/* Sunglasses */}
                        <div className="border-t border-gray-600 pt-2 mt-2">
                          <p className="text-xs text-gray-400 px-2 mb-1">SUNGLASSES</p>
                      <button
                        onClick={() => {
                              setActiveFilter('sunglasses-1');
                              setFilterEnabled(true);
                          setShowFilterMenu(false);
                        }}
                            className={`w-full text-left px-4 py-2.5 rounded hover:bg-gray-700 text-white transition-colors ${
                              activeFilter === 'sunglasses-1' ? 'bg-indigo-600' : ''
                        }`}
                      >
                            🕶️ Classic Sunglasses
                      </button>
                      <button
                        onClick={() => {
                              setActiveFilter('sunglasses-2');
                              setFilterEnabled(true);
                          setShowFilterMenu(false);
                        }}
                            className={`w-full text-left px-4 py-2.5 rounded hover:bg-gray-700 text-white transition-colors ${
                              activeFilter === 'sunglasses-2' ? 'bg-indigo-600' : ''
                        }`}
                      >
                            🕶️ Round Sunglasses
                      </button>
                      <button
                        onClick={() => {
                              setActiveFilter('sunglasses-3');
                              setFilterEnabled(true);
                          setShowFilterMenu(false);
                        }}
                            className={`w-full text-left px-4 py-2.5 rounded hover:bg-gray-700 text-white transition-colors ${
                              activeFilter === 'sunglasses-3' ? 'bg-indigo-600' : ''
                        }`}
                      >
                            🕶️ Aviator Sunglasses
                      </button>
                        </div>
                        
                        {/* Hats */}
                        <div className="border-t border-gray-600 pt-2 mt-2">
                          <p className="text-xs text-gray-400 px-2 mb-1">HATS</p>
                      <button
                        onClick={() => {
                              setActiveFilter('hat-1');
                              setFilterEnabled(true);
                          setShowFilterMenu(false);
                        }}
                            className={`w-full text-left px-4 py-2.5 rounded hover:bg-gray-700 text-white transition-colors ${
                              activeFilter === 'hat-1' ? 'bg-indigo-600' : ''
                            }`}
                          >
                            🎩 Top Hat
                          </button>
                          <button
                            onClick={() => {
                              setActiveFilter('hat-2');
                              setFilterEnabled(true);
                              setShowFilterMenu(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 rounded hover:bg-gray-700 text-white transition-colors ${
                              activeFilter === 'hat-2' ? 'bg-indigo-600' : ''
                            }`}
                          >
                            🧢 Baseball Cap
                          </button>
                          <button
                            onClick={() => {
                              setActiveFilter('hat-3');
                              setFilterEnabled(true);
                              setShowFilterMenu(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 rounded hover:bg-gray-700 text-white transition-colors ${
                              activeFilter === 'hat-3' ? 'bg-indigo-600' : ''
                            }`}
                          >
                            👒 Sun Hat
                      </button>
                    </div>
                        
                        {/* Masks */}
                        <div className="border-t border-gray-600 pt-2 mt-2">
                          <p className="text-xs text-gray-400 px-2 mb-1">FACE MASKS</p>
                          <button
                            onClick={() => {
                              setActiveFilter('mask-1');
                              setFilterEnabled(true);
                              setShowFilterMenu(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 rounded hover:bg-gray-700 text-white transition-colors ${
                              activeFilter === 'mask-1' ? 'bg-indigo-600' : ''
                            }`}
                          >
                            😷 Face Mask
                          </button>
                  </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Chat Sidebar */}
        {showChat && (status === 'connecting' || status === 'connected') && (
          <div className="fixed md:relative inset-0 md:inset-auto md:w-80 bg-gray-900 border-l border-gray-800 flex flex-col z-40">
            {/* Partner Info */}
            {partner && (
              <div className="p-4 border-b border-gray-800">
                <div className="flex items-center justify-between mb-2 md:hidden">
                  <h3 className="text-white font-semibold">Chat</h3>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowChat(false)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
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

