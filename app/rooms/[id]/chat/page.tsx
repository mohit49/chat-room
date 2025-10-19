'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { api } from '@/lib/api';
import { ArrowLeft, X, Volume2, VolumeX, Mic, MicOff, MoreVertical, Trash2, MessageSquare, Image as ImageIcon, Play, Pause, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useSocket } from '@/lib/contexts/SocketContext';
import { useSocketEvents } from '@/hooks/useSocketEvents';
import { useSound } from '@/lib/contexts/SoundContext';
import { useVoiceBroadcast, VoiceBroadcastProvider } from '@/lib/contexts/VoiceBroadcastContext';
import AudioRecorder from '@/components/chat/AudioRecorder';
import ImageLightbox from '@/components/chat/ImageLightbox';
import { ImageCompressor } from '@/lib/utils/imageCompression';
import { openChat } from '@/components/layout/GlobalChatManager';

interface ChatMessage {
  id: string;
  roomId: string;
  userId: string;
  username: string;
  message: string;
  messageType: 'text' | 'image' | 'audio';
  imageUrl?: string;
  audioUrl?: string;
  timestamp: string;
  userProfilePicture?: {
    type: 'upload' | 'avatar';
    url?: string;
    avatarStyle?: string;
    seed?: string;
  };
}

interface PaginationInfo {
  totalCount: number;
  hasMore: boolean;
  nextOffset: number | null;
  currentOffset: number;
  limit: number;
}

interface OnlineUser {
  userId: string;
  username: string;
  isOnline: boolean;
  role: string;
}

interface Room {
  id: string;
  roomId: string;
  name: string;
  members: Array<{
    userId: string;
    username: string;
    role: string;
  }>;
}

function ChatPageContent() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;
  const { socket, connected } = useSocket();
  const { user } = useAuth();
  const { soundEnabled, toggleSound, playMessageSound } = useSound();
  const { isBroadcasting, canBroadcast, toggleBroadcast, currentBroadcaster, isListening, toggleListen, isMuted, toggleMute } = useVoiceBroadcast();
  
  // Socket events
  const socketEvents = useSocketEvents({
    onNewMessage: (message: ChatMessage) => {
      console.log('📨 Chat Page - Received new message:', message);
      if (message.roomId === roomId) {
        console.log('✅ Adding message to state for room:', roomId);
        setMessages(prev => [...prev, message]);
        
        // Play pop sound for new messages (only if not from current user)
        if (message.userId !== user?.id) {
          console.log('🔊 Playing pop sound for new message');
          playMessageSound();
        }
      } else {
        console.log('❌ Message not for current room. Expected:', roomId, 'Got:', message.roomId);
      }
    },
    onUserTyping: (data: { userId: string; isTyping: boolean; username: string; roomId: string }) => {
      console.log('⌨️ Chat Page - Received typing event:', data);
      console.log('⌨️ Chat Page - Current roomId:', roomId);
      console.log('⌨️ Chat Page - Event roomId:', data.roomId);
      console.log('⌨️ Chat Page - Room match:', data.roomId === roomId);
      
      if (data.roomId === roomId) {
        console.log('⌨️ Chat Page - Processing typing event for current room');
        setTypingUsers(prev => {
          const newMap = new Map(prev);
          if (data.isTyping) {
            newMap.set(data.userId, data.username);
            console.log('⌨️ Chat Page - Added user to typing:', data.userId, data.username);
          } else {
            newMap.delete(data.userId);
            console.log('⌨️ Chat Page - Removed user from typing:', data.userId);
          }
          console.log('⌨️ Chat Page - Current typing users:', Array.from(newMap.entries()));
          return newMap;
        });
      } else {
        console.log('⌨️ Chat Page - Ignoring typing event for different room');
      }
    },
    onUserOnlineStatus: (data: { userId: string; isOnline: boolean }) => {
      console.log('👤 User online status update:', data);
      setOnlineUsers(prev => {
        const existing = prev.find(u => u.userId === data.userId);
        if (existing) {
          return prev.map(u => u.userId === data.userId ? { ...u, isOnline: data.isOnline } : u);
        } else {
          return [...prev, { userId: data.userId, username: '', isOnline: data.isOnline, role: 'member' }];
        }
      });
    },
    onRoomMembersStatus: (members: OnlineUser[]) => {
      console.log('👥 Received room members status:', members);
      setOnlineUsers(members);
      setOnlineUsersLoading(false);
    },
    onMessageDeleted: (data: { messageId: string; deletedBy?: string }) => {
      console.log('🗑️ Chat Page - Message deleted:', data);
      setMessages(prev => prev.filter(msg => msg.id !== data.messageId));
    },
    onVoiceBroadcastStarted: (data: { userId: string; username: string; roomId: string }) => {
      if (data.roomId === roomId) {
        console.log('📻 Chat Page - Broadcast started:', data);
        setBroadcastInfo({ userId: data.userId, username: data.username });
        setBroadcastListening(true);
      }
    },
    onVoiceBroadcastStopped: (data: { userId: string; roomId: string }) => {
      if (data.roomId === roomId) {
        console.log('📻 Chat Page - Broadcast stopped');
        setBroadcastInfo(null);
        setBroadcastListening(false);
      }
    }
  }, `ChatPage-${roomId}`);
  
  const [room, setRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [onlineUsersLoading, setOnlineUsersLoading] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [showImageLightbox, setShowImageLightbox] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [broadcastInfo, setBroadcastInfo] = useState<{ userId: string; username: string } | null>(null);
  const [broadcastListening, setBroadcastListening] = useState(true);
  const [broadcastMuted, setBroadcastMuted] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map()); // userId -> username
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesStartRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());
  const isLoadingMoreRef = useRef(false);
  const shouldAutoScrollRef = useRef(true);
  const hasLoadedMessagesRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const canSendMessages = true; // Allow all authenticated users to send messages for now

  const fetchRoom = async () => {
    try {
      console.log('🏠 Fetching room with ID:', roomId);
      const response = await api.getRoomById(roomId) as any;
      if (response.success) {
        console.log('🏠 Room data:', {
          id: response.room.id,
          roomId: response.room.roomId,
          name: response.room.name,
          memberCount: response.room.members.length
        });
        setRoom(response.room);
      } else {
        console.error('❌ Room not found:', response.error);
        alert('Room not found');
      }
    } catch (error) {
      console.error('❌ Error fetching room:', error);
      alert('Failed to load room');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = useCallback(async (loadMore: boolean = false, beforeTimestamp?: string) => {
    try {
      console.log('📥 Fetching messages for room:', roomId, 'loadMore:', loadMore);
      
      if (loadMore) {
        setIsLoadingMore(true);
        isLoadingMoreRef.current = true;
      } else {
        setIsLoading(true);
      }
      
      const currentPagination = pagination;
      const offset = loadMore && currentPagination ? currentPagination.currentOffset + currentPagination.limit : 0;
      const response = await api.getRoomMessages(roomId, 50, offset, beforeTimestamp);
      
      console.log('📥 API response:', {
        success: response.success,
        messageCount: response.data?.messages?.length || 0,
        pagination: response.data?.pagination,
        messages: response.data?.messages
      });
      
      if (response.success) {
        const newMessages = response.data?.messages || [];
        const paginationInfo = response.data?.pagination;
        
        if (loadMore) {
          // Prepend older messages to the beginning
          setMessages(prev => [...newMessages, ...prev]);
          // Don't auto-scroll when loading more messages
          shouldAutoScrollRef.current = false;
          // Maintain scroll position after loading more messages
          setTimeout(() => maintainScrollPosition(), 100);
        } else {
          // Replace all messages (initial load)
          setMessages(newMessages);
          // Auto-scroll on initial load
          shouldAutoScrollRef.current = true;
        }
        
        setPagination(paginationInfo);
        console.log('📥 Messages updated:', {
          totalMessages: loadMore ? messages.length + newMessages.length : newMessages.length,
          hasMore: paginationInfo?.hasMore,
          currentOffset: paginationInfo?.currentOffset
        });
      } else {
        console.error('❌ Failed to fetch messages:', response.error);
      }
    } catch (error) {
      console.error('❌ Error fetching messages:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
      isLoadingMoreRef.current = false;
    }
  }, [roomId]);

  const joinRoom = useCallback(() => {
    if (socket && connected) {
      console.log('🔌 Joining room:', roomId, 'Socket ID:', socket.id);
      socketEvents.emit('join_room', roomId);
      
      // Set a timeout to stop loading if no response
      setTimeout(() => {
        if (onlineUsersLoading) {
          console.log('⏰ Timeout waiting for room members status, stopping loading');
          setOnlineUsersLoading(false);
        }
      }, 5000);
    } else {
      console.log('❌ Cannot join room - socket not connected:', { 
        socket: !!socket, 
        connected, 
        socketId: socket?.id 
      });
      setOnlineUsersLoading(false);
    }
  }, [socket, connected, roomId, onlineUsersLoading]);

  useEffect(() => {
    if (roomId && user && !hasLoadedMessagesRef.current) {
      console.log('🏠 Chat page: User authenticated, loading room data');
      hasLoadedMessagesRef.current = true;
      fetchRoom();
      fetchMessages();
    }
    
    // Reset loaded messages flag when room changes
    return () => {
      hasLoadedMessagesRef.current = false;
    };
  }, [roomId, user, fetchMessages]);

  useEffect(() => {
    if (socket && connected) {
      console.log('🔌 Socket connected, setting up listeners and joining room');
      if (roomId && user) {
        joinRoom();
      }
    }

        // Cleanup function
        return () => {
          // Clear typing timeout
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }
          
          // Clear scroll timeout
          if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current);
          }
        };
  }, [socket, connected, roomId, user, joinRoom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    scrollToBottom();
  }, [typingUsers]);

  // Scroll to bottom when new messages arrive (only if user is near bottom)
  useEffect(() => {
    if (!isLoadingMore && !isLoading && shouldAutoScrollRef.current) {
      scrollToBottom();
    }
  }, [messages.length, isLoadingMore, isLoading]);


  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollAreaRef.current) {
        const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
      }
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Scroll to maintain position when loading more messages
  const maintainScrollPosition = () => {
    if (scrollAreaRef.current && messagesStartRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        const startElement = messagesStartRef.current;
        const startRect = startElement.getBoundingClientRect();
        const containerRect = scrollContainer.getBoundingClientRect();
        const relativeTop = startRect.top - containerRect.top;
        
        // Maintain scroll position relative to the start of messages
        setTimeout(() => {
          scrollContainer.scrollTop = relativeTop;
        }, 50);
      }
    }
  };

  // Handle scroll to load more messages
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    
    // Check if user is near bottom (within 100px)
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    shouldAutoScrollRef.current = isNearBottom;
    setShowScrollToBottom(!isNearBottom);
    
    // Load more when scrolled near top (within 50px) and there are more messages
    const isNearTop = scrollTop <= 50;
    if (isNearTop && pagination?.hasMore && !isLoadingMoreRef.current) {
      // Throttle scroll events to prevent multiple rapid calls
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      scrollTimeoutRef.current = setTimeout(() => {
        console.log('📜 Scrolled to top, loading more messages...');
        const oldestMessage = messages[0];
        if (oldestMessage) {
          fetchMessages(true, oldestMessage.timestamp);
        }
      }, 100); // 100ms throttle
    }
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() && !imageFile && !audioFile) return;
    if (!canSendMessages) return;

    try {
      let messageData: any = {
        roomId,
        message: newMessage.trim(),
        messageType: 'text'
      };

      // Handle audio upload
      if (audioFile) {
        const formData = new FormData();
        formData.append('audio', audioFile);
        formData.append('roomId', roomId);

        const uploadResponse = await api.uploadChatAudio(formData);
        if (uploadResponse.success) {
          messageData = {
            roomId,
            message: newMessage.trim() || '🎵 Audio',
            messageType: 'audio',
            audioUrl: uploadResponse.data?.audioUrl
          };
        } else {
          alert('Failed to upload audio');
          return;
        }
      }
      // Handle image upload
      else if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);
        formData.append('roomId', roomId);
        
        const uploadResponse = await api.uploadChatImage(formData);
        if (uploadResponse.success) {
          messageData = {
            roomId,
            message: newMessage.trim() || '📷 Image',
            messageType: 'image',
            imageUrl: uploadResponse.data?.imageUrl
          };
        } else {
          alert('Failed to upload image');
          return;
        }
      }

      const response = await api.sendMessage(messageData);
      if (response.success) {
        // Optimistically add the message to UI immediately
        const responseMessage = response.message || response.data?.message;
        const newMessageData: ChatMessage = {
          id: responseMessage?.id || `temp-${Date.now()}`,
          roomId: roomId,
          userId: user?.id || '',
          username: user?.username || user?.mobileNumber || 'You',
          message: messageData.message,
          messageType: messageData.messageType || 'text',
          imageUrl: messageData.imageUrl,
          audioUrl: messageData.audioUrl,
          timestamp: new Date().toISOString(),
          userProfilePicture: user?.profile?.profilePicture
        };

        // Add message to local state immediately for instant feedback
        setMessages(prev => {
          // Check if it already exists (in case socket event arrived first)
          const exists = prev.some(msg => msg.id === newMessageData.id);
          if (exists) return prev;
          return [...prev, newMessageData];
        });
        
        scrollToBottom();
        
        setNewMessage('');
        setImageFile(null);
        setImagePreview(null);
        setAudioFile(null);
      } else {
        alert('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file');
        return;
      }

      // Check if compression is needed
      const shouldCompress = ImageCompressor.shouldCompress(file, 500); // 500KB threshold
      
      let processedFile = file;
      
      if (shouldCompress) {
        console.log('📸 Compressing image...');
        // Compress image: max 800x600, 80% quality
        processedFile = await ImageCompressor.compressImage(file, 800, 600, 0.8);
      }

      // Final size check after compression
      if (processedFile.size > 5 * 1024 * 1024) { // 5MB absolute limit
        alert('Image size is still too large after compression. Please choose a smaller image.');
        return;
      }

      setImageFile(processedFile);
      
      // Create preview from processed file
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(processedFile);
      
    } catch (error) {
      console.error('Error processing image:', error);
      alert('Failed to process image. Please try again.');
    }
  };

  const handleAudioRecordingComplete = (audioBlob: Blob) => {
    const audioFile = new File([audioBlob], `recording-${Date.now()}.wav`, { type: 'audio/wav' });
    setAudioFile(audioFile);
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!window.confirm('Are you sure you want to delete this message? This will delete it for everyone.')) {
      return;
    }

    try {
      // Optimistically remove from UI
      setMessages(prev => prev.filter(msg => msg.id !== messageId));

      // Delete via API
      const response = await api.deleteRoomMessage(roomId, messageId);
      
      if (!response.success) {
        // If failed, refetch messages to restore
        fetchMessages();
        alert('Failed to delete message');
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      fetchMessages(); // Restore messages
      alert('Failed to delete message');
    }
  };

  const handleMessagePrivately = (message: ChatMessage) => {
    // Open DirectMessageWidget with the message sender
    openChat({
      id: message.userId,
      username: message.username,
      profilePicture: message.userProfilePicture
    });
  };

  const getImageMessages = () => {
    return messages
      .filter(msg => msg.messageType === 'image' && msg.imageUrl)
      .map(msg => ({
        id: msg.id,
        imageUrl: msg.imageUrl!,
        message: msg.message,
        timestamp: msg.timestamp,
        senderUsername: msg.username
      }));
  };

  const handleImageClick = (imageUrl: string) => {
    const imageMessages = getImageMessages();
    const imageIndex = imageMessages.findIndex(img => img.imageUrl === imageUrl);
    
    if (imageIndex !== -1) {
      setCurrentImageIndex(imageIndex);
      setShowImageLightbox(true);
    }
  };

  const handleAudioPlay = (messageId: string, audioUrl: string) => {
    const audioElement = audioRefs.current.get(messageId);
    
    if (!audioElement) {
      // Create new audio element if it doesn't exist
      const audio = new Audio(audioUrl);
      audioRefs.current.set(messageId, audio);
      
      audio.onplay = () => setPlayingAudio(messageId);
      audio.onpause = () => setPlayingAudio(null);
      audio.onended = () => setPlayingAudio(null);
      
      audio.play();
    } else {
      // Toggle play/pause
      if (playingAudio === messageId) {
        audioElement.pause();
        setPlayingAudio(null);
      } else {
        audioElement.play();
        setPlayingAudio(messageId);
      }
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewMessage(value);
    
    console.log('⌨️ Typing event:', { value, isTyping, hasValue: !!value.trim() });
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    if (value.trim()) {
      if (!isTyping) {
        console.log('⌨️ Starting typing...');
        setIsTyping(true);
        socketEvents.emit('user_typing', {
          roomId,
          isTyping: true,
          username: user?.username || 'Unknown'
        });
      }
      
      // Set timeout to stop typing after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        console.log('⌨️ Auto-stopping typing after timeout...');
        setIsTyping(false);
        socketEvents.emit('user_typing', {
          roomId,
          isTyping: false,
          username: user?.username || 'Unknown'
        });
      }, 2000);
    } else {
      if (isTyping) {
        console.log('⌨️ Stopping typing...');
        setIsTyping(false);
        socketEvents.emit('user_typing', {
          roomId,
          isTyping: false,
          username: user?.username || 'Unknown'
        });
      }
    }
  };

  // Clear typing status when message is sent
  useEffect(() => {
    if (isTyping) {
      setIsTyping(false);
      socket?.emit('user_typing', {
        roomId,
        isTyping: false,
        username: user?.username || 'Unknown'
      });
    }
  }, [messages.length]);

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isUserOnline = (userId: string) => {
    const onlineUser = onlineUsers.find(u => u.userId === userId);
    return onlineUser?.isOnline || false;
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString();
    }
  };


  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading room...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="h-8 w-8 p-0 flex-shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    <h1 className="font-semibold text-base sm:text-lg truncate">{room.name}</h1>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(`/rooms/${roomId}/chat`, '_blank')}
                      className="h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-800 flex-shrink-0"
                      title="Open in new tab"
                    >
                      <svg
                        className="h-3 w-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </Button>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">#{room.roomId}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
              <Badge variant="secondary" className="text-xs sm:text-sm">
                {onlineUsersLoading ? (
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                    <span className="hidden sm:inline">Loading...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs sm:text-sm">
                        {(() => {
                          const onlineCount = onlineUsers.filter(u => u.isOnline).length;
                          console.log('👥 Online users in header:', onlineCount, 'Total users:', onlineUsers.length, 'Users:', onlineUsers);
                          return `${onlineCount} online`;
                        })()}
                      </span>
                    </div>
                  </div>
                )}
              </Badge>
              <Badge variant={connected ? "default" : "destructive"} className="text-xs">
                {connected ? "Connected" : "Disconnected"}
              </Badge>
              {canBroadcast && (
                <Button
                  variant={isBroadcasting ? "destructive" : "ghost"}
                  size="sm"
                  onClick={toggleBroadcast}
                  className="h-8 w-8 p-0"
                  title={isBroadcasting ? "Stop broadcasting" : "Start voice broadcast"}
                >
                  <Radio className={`h-4 w-4 ${isBroadcasting ? 'animate-pulse' : ''}`} />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSound}
                className="h-8 w-8 p-0"
                title={soundEnabled ? "Disable sound" : "Enable sound"}
              >
                {soundEnabled ? (
                  <Volume2 className="h-4 w-4" />
                ) : (
                  <VolumeX className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Broadcasting Notification Strip */}
      {(currentBroadcaster || broadcastInfo) && (
        <div className="fixed top-16 sm:top-20 left-0 right-0 z-40 bg-green-500 text-white px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between border-b shadow-lg">
          <div className="flex items-center gap-2 sm:gap-3 flex-1">
            <Radio className="h-4 w-4 sm:h-5 sm:w-5 animate-pulse" />
            <span className="text-xs sm:text-sm font-medium">
              {(currentBroadcaster?.userId === user?.id || broadcastInfo?.userId === user?.id)
                ? 'You are broadcasting now' 
                : `${currentBroadcaster?.username || broadcastInfo?.username} is broadcasting now`
              }
            </span>
          </div>
          {(currentBroadcaster?.userId !== user?.id && broadcastInfo?.userId !== user?.id) && (
            <div className="flex items-center gap-1 sm:gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (currentBroadcaster) toggleListen();
                  else setBroadcastListening(!broadcastListening);
                }}
                className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-white hover:bg-white/20"
                title={(isListening || broadcastListening) ? "Pause" : "Play"}
              >
                {(isListening || broadcastListening) ? (
                  <Pause className="h-3 w-3 sm:h-4 sm:w-4" />
                ) : (
                  <Play className="h-3 w-3 sm:h-4 sm:w-4 ml-0.5" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (currentBroadcaster) toggleMute();
                  else setBroadcastMuted(!broadcastMuted);
                }}
                className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-white hover:bg-white/20"
                title={(isMuted || broadcastMuted) ? "Unmute" : "Mute"}
              >
                {(isMuted || broadcastMuted) ? (
                  <VolumeX className="h-3 w-3 sm:h-4 sm:w-4" />
                ) : (
                  <Volume2 className="h-3 w-3 sm:h-4 sm:w-4" />
                )}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Chat Area - Scrollable */}
      <div className={`flex-1 ${(currentBroadcaster || broadcastInfo) ? 'pt-28 sm:pt-32' : 'pt-16 sm:pt-20'} pb-20 sm:pb-20 overflow-hidden`}>
        <Card className="h-full border-0 rounded-none">
          <CardContent className="flex-1 p-0 h-full">
            <ScrollArea 
              ref={scrollAreaRef} 
              className="h-full p-3 sm:p-6"
              onScrollCapture={handleScroll}
            >
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-primary"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center px-4">
                    <p className="text-base sm:text-lg font-medium">No messages yet</p>
                    <p className="text-xs sm:text-sm">Start the conversation!</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto">
                  {/* Loading more indicator at top */}
                  {isLoadingMore && (
                    <div className="flex items-center justify-center py-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      <span className="ml-2 text-sm text-muted-foreground">Loading 50 more messages...</span>
                    </div>
                  )}
                  
                  {/* Load more button if there are more messages */}
                  {!isLoadingMore && pagination?.hasMore && (
                    <div className="flex items-center justify-center py-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const oldestMessage = messages[0];
                          if (oldestMessage) {
                            fetchMessages(true, oldestMessage.timestamp);
                          }
                        }}
                        className="text-xs"
                      >
                        Load 50 older messages
                      </Button>
                    </div>
                  )}
                  
                  {/* Start of messages ref for scroll detection */}
                  <div ref={messagesStartRef} />
                  
                  {messages.map((message) => {
                    const isOwnMessage = message.userId === user?.id;
                    const isAudioMessage = message.messageType === 'audio';
                    
                    return (
                      <div key={message.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} group`}>
                        <div className={`flex items-start space-x-2 sm:space-x-3 max-w-[85%] sm:max-w-[70%] ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}>
                        <div className="relative flex-shrink-0">
                          <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                            <AvatarImage
                              src={
                                message.userProfilePicture?.type === 'upload'
                                  ? message.userProfilePicture.url
                                  : message.userProfilePicture?.type === 'avatar'
                                  ? `https://api.dicebear.com/7.x/${message.userProfilePicture.avatarStyle?.toLowerCase().replace(/\s+/g, '-')}/svg?seed=${message.userProfilePicture.seed || message.userId}`
                                  : undefined
                              }
                            />
                            <AvatarFallback>
                              {message.userProfilePicture?.type === 'avatar' ? (
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs sm:text-sm font-bold">
                                  {message.username?.charAt(0).toUpperCase()}
                                </div>
                              ) : (
                                message.username?.charAt(0).toUpperCase()
                              )}
                            </AvatarFallback>
                          </Avatar>
                          {isUserOnline(message.userId) && (
                            <div className="absolute -bottom-1 -right-1 h-2 w-2 sm:h-3 sm:w-3 bg-green-500 border-2 border-background rounded-full"></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`flex items-center space-x-1 sm:space-x-2 mb-1 ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}>
                            <span className="text-xs sm:text-sm font-medium text-foreground truncate">
                              {isOwnMessage ? 'You' : message.username}
                            </span>
                            <span className="text-xs text-muted-foreground flex-shrink-0">
                              {formatTime(message.timestamp)}
                            </span>
                          </div>
                            <div className={`rounded-lg ${isAudioMessage ? 'w-full' : ''} ${
                              isOwnMessage 
                                ? 'bg-primary text-primary-foreground' 
                                : 'bg-muted'
                            } relative`}>
                              <div className="flex items-start gap-1">
                                <div className="flex-1 p-3">
                                {message.messageType === 'image' && message.imageUrl ? (
                                  <div>
                                <img
                                  src={message.imageUrl}
                                      alt="Chat image"
                                      className="max-w-full h-auto rounded-lg mb-2 cursor-pointer hover:opacity-90 transition-opacity"
                                      onClick={() => handleImageClick(message.imageUrl!)}
                                    />
                                    {message.message && message.message !== '📷 Image' && (
                                      <p className="text-xs sm:text-sm">{message.message}</p>
                                )}
                              </div>
                            ) : message.messageType === 'audio' && message.audioUrl ? (
                              <div className="w-full">
                                <div className={`flex items-center gap-3 rounded-lg p-3 mb-2 ${
                                  isOwnMessage ? 'bg-primary-foreground/10' : 'bg-primary/10'
                                }`}>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleAudioPlay(message.id, message.audioUrl!)}
                                    className={`h-12 w-12 p-0 rounded-full ${
                                      isOwnMessage ? 'bg-primary-foreground/30 hover:bg-primary-foreground/40' : 'bg-primary/30 hover:bg-primary/40'
                                    }`}
                                  >
                                    {playingAudio === message.id ? (
                                      <Pause className="h-6 w-6" />
                                    ) : (
                                      <Play className="h-6 w-6 ml-0.5" />
                                    )}
                                  </Button>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <Mic className="h-4 w-4 opacity-70" />
                                      <span className="text-sm font-medium opacity-90">Audio Message</span>
                                    </div>
                                    <span className="text-xs opacity-60">Click to play</span>
                                  </div>
                                </div>
                                {message.message && message.message !== '🎵 Audio' && (
                                  <p className="text-xs sm:text-sm mt-1">{message.message}</p>
                                )}
                              </div>
                            ) : (
                                <p className="text-xs sm:text-sm break-words">
                                  {message.message}
                                </p>
                                )}
                              </div>
                                
                                {/* Three-dot dropdown menu - inline right to message text */}
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className={`h-6 w-6 p-0 mt-1 mr-1 shrink-0 self-start ${
                                        isOwnMessage ? 'text-primary-foreground hover:bg-primary-foreground/20' : 'hover:bg-muted-foreground/10'
                                      }`}
                                    >
                                      <MoreVertical className="h-3 w-3" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    {isOwnMessage && (
                                      <DropdownMenuItem
                                        onClick={() => handleDeleteMessage(message.id)}
                                        className="text-red-600 hover:text-red-700 cursor-pointer"
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete Message
                                      </DropdownMenuItem>
                                    )}
                                    {!isOwnMessage && (
                                      <DropdownMenuItem
                                        onClick={() => handleMessagePrivately(message)}
                                        className="cursor-pointer"
                                      >
                                        <MessageSquare className="h-4 w-4 mr-2" />
                                        Message Privately
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Typing Indicator */}
                  {typingUsers.size > 0 && (
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground py-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span>
                        {Array.from(typingUsers.values()).length === 1 
                          ? `${Array.from(typingUsers.values())[0]} is typing...` 
                          : `${Array.from(typingUsers.values()).join(', ')} are typing...`
                        }
                      </span>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>
            
            {/* Scroll to bottom button */}
            {showScrollToBottom && (
              <div className="absolute bottom-4 right-4 z-10">
                <Button
                  size="sm"
                  onClick={scrollToBottom}
                  className="rounded-full h-8 w-8 p-0 shadow-lg"
                >
                  ↓
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Fixed Message Input */}
      {canSendMessages && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="px-3 sm:px-4 py-3 sm:py-4">
            <form onSubmit={handleSendMessage} className="flex items-end space-x-2 sm:space-x-4 max-w-4xl mx-auto">
              <div className="flex-1 min-w-0">
                {(imagePreview || audioFile) && (
                  <div className="mb-2 sm:mb-3">
                    {audioFile && (
                      <div className="mb-2 p-2 bg-muted rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="text-xs sm:text-sm">🎵 Audio message ready to send</div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setAudioFile(null)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                {imagePreview && (
                      <div className="relative inline-block">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={removeImage}
                      className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 h-5 w-5 sm:h-6 sm:w-6 p-0 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      <X className="h-2 w-2 sm:h-3 sm:w-3" />
                    </Button>
                      </div>
                    )}
                  </div>
                )}
                <Input
                  value={newMessage}
                  onChange={handleTyping}
                  placeholder="Type a message..."
                  className="min-h-[36px] sm:min-h-[40px] text-sm sm:text-base"
                />
              </div>
              <div className="flex space-x-1 sm:space-x-2 flex-shrink-0">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-9 w-9 sm:h-10 sm:w-10 p-0 border-2 border-blue-500 hover:bg-blue-50 bg-white shadow-md"
                  title="Upload image"
                >
                  <ImageIcon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                </Button>
                <AudioRecorder
                  onRecordingComplete={handleAudioRecordingComplete}
                  disabled={!canSendMessages}
                />
                <Button type="submit" size="sm" className="h-9 px-3 sm:h-10 sm:px-6 text-xs sm:text-sm" disabled={!newMessage.trim() && !imageFile && !audioFile}>
                  Send
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Lightbox */}
      <ImageLightbox
        isOpen={showImageLightbox}
        onClose={() => setShowImageLightbox(false)}
        images={getImageMessages()}
        currentImageIndex={currentImageIndex}
      />
    </div>
  );
}

export default function FullScreenChatPage() {
  const params = useParams();
  return (
    <VoiceBroadcastProvider roomId={params.id as string} userRole="admin">
      <ChatPageContent />
    </VoiceBroadcastProvider>
  );
}
