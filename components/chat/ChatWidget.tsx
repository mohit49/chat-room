'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  X, 
  Send, 
  Image as ImageIcon, 
  Smile, 
  MoreVertical,
  Paperclip,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Trash2,
  MessageSquare,
  Play,
  Pause,
  Radio
} from 'lucide-react';
import AudioRecorder from './AudioRecorder';
import ImageLightbox from './ImageLightbox';
import { ImageCompressor } from '@/lib/utils/imageCompression';
import { useSocket } from '@/lib/contexts/SocketContext';
import { useSocketEvents } from '@/hooks/useSocketEvents';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useSound } from '@/lib/contexts/SoundContext';
import { useVoiceBroadcast } from '@/lib/contexts/VoiceBroadcastContext';
import { api } from '@/lib/api';
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
  lastSeen?: string;
}

interface ChatWidgetProps {
  roomId: string;
  roomName: string;
  isOpen: boolean;
  onClose: () => void;
  userRole: 'admin' | 'editor' | 'viewer' | null;
}

export default function ChatWidget({ 
  roomId,
  roomName, 
  isOpen, 
  onClose, 
  userRole 
}: ChatWidgetProps) {
  const { socket, connected } = useSocket();
  const { user } = useAuth();
  const { soundEnabled, toggleSound, playMessageSound } = useSound();
  const { isBroadcasting, canBroadcast, toggleBroadcast } = useVoiceBroadcast();
  
  // Socket events
  const socketEvents = useSocketEvents({
    onNewMessage: (message: ChatMessage) => {
      console.log('📨 ChatWidget - Received new message:', {
        id: message.id,
        messageType: message.messageType,
        hasAudioUrl: !!message.audioUrl,
        audioUrl: message.audioUrl,
        hasImageUrl: !!message.imageUrl,
        imageUrl: message.imageUrl,
        roomId: message.roomId
      });
      
      if (message.roomId === roomId) {
        setMessages(prev => [...prev, message]);
        
        // Play pop sound for new messages (only if not from current user)
        if (message.userId !== user?.id) {
          console.log('🔊 Playing pop sound for new message');
          playMessageSound();
        }
      }
    },
    onUserTyping: (data: { userId: string; isTyping: boolean; username: string; roomId: string }) => {
      console.log('⌨️ ChatWidget - Received typing event:', data);
      console.log('⌨️ ChatWidget - Current roomId:', roomId);
      console.log('⌨️ ChatWidget - Event roomId:', data.roomId);
      console.log('⌨️ ChatWidget - Room match:', data.roomId === roomId);
      
      if (data.roomId === roomId) {
        console.log('⌨️ ChatWidget - Processing typing event for current room');
        setTypingUsers(prev => {
          const newMap = new Map(prev);
          if (data.isTyping) {
            newMap.set(data.userId, data.username);
            console.log('⌨️ ChatWidget - Added user to typing:', data.userId, data.username);
          } else {
            newMap.delete(data.userId);
            console.log('⌨️ ChatWidget - Removed user from typing:', data.userId);
          }
          console.log('⌨️ ChatWidget - Current typing users:', Array.from(newMap.entries()));
          return newMap;
        });
      } else {
        console.log('⌨️ ChatWidget - Ignoring typing event for different room');
      }
    },
    onUserOnlineStatus: (data: { userId: string; isOnline: boolean }) => {
      setOnlineUsers(prev => {
        const existing = prev.find(u => u.userId === data.userId);
        if (existing) {
          return prev.map(u => u.userId === data.userId ? { ...u, isOnline: data.isOnline } : u);
        } else {
          return [...prev, { userId: data.userId, username: '', isOnline: data.isOnline }];
        }
      });
    },
    onRoomMembersStatus: (members: OnlineUser[]) => {
      console.log('👥 ChatWidget - Received room members status:', members);
      console.log('👥 ChatWidget - Setting online users to:', members);
      setOnlineUsers(members);
      
      // Clear the timeout since we received the status
      if (roomMembersTimeoutRef.current) {
        clearTimeout(roomMembersTimeoutRef.current);
        roomMembersTimeoutRef.current = null;
      }
    },
    onMessageDeleted: (data: { messageId: string; deletedBy?: string }) => {
      console.log('🗑️ ChatWidget - Message deleted:', data);
      setMessages(prev => prev.filter(msg => msg.id !== data.messageId));
    }
  }, `ChatWidget-${roomId}`);
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [showImageLightbox, setShowImageLightbox] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map()); // userId -> username
  const [isTyping, setIsTyping] = useState(false);
  const [displayRoomId, setDisplayRoomId] = useState<string>(roomId);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesStartRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const roomMembersTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isLoadingMoreRef = useRef(false);
  const shouldAutoScrollRef = useRef(true);
  const hasLoadedMessagesRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const canSendMessages = userRole === 'admin' || userRole === 'editor';

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
        hasAudioMessages: response.data?.messages?.filter((m: any) => m.messageType === 'audio').length || 0,
        audioMessages: response.data?.messages?.filter((m: any) => m.messageType === 'audio').map((m: any) => ({
          id: m.id,
          hasAudioUrl: !!m.audioUrl,
          audioUrl: m.audioUrl
        }))
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
    // Validate roomId before attempting to join
    if (!roomId || roomId === 'undefined') {
      console.log('❌ ChatWidget - Invalid roomId, cannot join room:', roomId);
      return;
    }

    if (socket && connected) {
      console.log('🔌 ChatWidget - Joining room:', roomId);
      socketEvents.emit('join_room', roomId);
      
      // Set a timeout to check if we received room members status
      roomMembersTimeoutRef.current = setTimeout(() => {
        if (onlineUsers.length === 0) {
          console.log('🔌 ChatWidget - No room members status received, requesting manually');
          // The server should have sent room_members_status, but if not, we can request it
          // by joining the room again or emitting a specific event
          socketEvents.emit('join_room', roomId);
        }
      }, 3000);
    } else {
      console.log('❌ ChatWidget - Cannot join room - socket not connected:', { socket: !!socket, connected });
    }
  }, [socket, connected, roomId, onlineUsers.length, socketEvents]);

  useEffect(() => {
    if (isOpen && roomId && roomId !== 'undefined' && !hasLoadedMessagesRef.current) {
      console.log('🔌 ChatWidget: Opening chat for room:', roomId);
      hasLoadedMessagesRef.current = true;
      fetchMessages();
      joinRoom();
    }
    
    // Cleanup when room changes or chat closes
    return () => {
      if (socket && connected && roomId && roomId !== 'undefined') {
        console.log('🔌 ChatWidget: Leaving room:', roomId);
        socketEvents.emit('leave_room', roomId);
        hasLoadedMessagesRef.current = false;
      }
    };
  }, [isOpen, roomId, fetchMessages, joinRoom, socket, connected]);

  // Fetch room details to get the display roomId
  useEffect(() => {
    const fetchRoomDetails = async () => {
      try {
        const response = await api.getRoomById(roomId) as any;
        if (response.success && response.room?.roomId) {
          setDisplayRoomId(response.room.roomId);
        }
      } catch (error) {
        console.error('Failed to fetch room details:', error);
      }
    };

    if (roomId) {
      fetchRoomDetails();
    }
  }, [roomId]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      if (roomMembersTimeoutRef.current) {
        clearTimeout(roomMembersTimeoutRef.current);
      }
      
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    scrollToBottom();
  }, [typingUsers]);

  // Handle scroll to load more messages
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    
    // Check if user is near bottom (within 100px)
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    shouldAutoScrollRef.current = isNearBottom;
    setShowScrollToBottom(!isNearBottom);
    
    // Disabled auto-loading on scroll - only load when user clicks button
  }, []);

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
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🎵 Send message check:', {
      hasMessage: !!newMessage.trim(),
      hasImageFile: !!imageFile,
      hasAudioFile: !!audioFile,
      canSend: canSendMessages
    });
    
    if (!newMessage.trim() && !imageFile && !audioFile) return;
    if (!canSendMessages) return;

    try {
      let messageData: any = {
        roomId,
        message: newMessage.trim() || 'Message',
        messageType: 'text'
      };

      // Handle audio upload
      if (audioFile) {
        console.log('🎵 Uploading audio file...');
        const formData = new FormData();
        formData.append('audio', audioFile);
        formData.append('roomId', roomId);

        const uploadResponse = await api.uploadChatAudio(formData);
        console.log('🎵 Audio upload response:', uploadResponse);
        
        if (uploadResponse.success) {
          messageData = {
            roomId,
            message: newMessage.trim() || '🎵 Audio',
            messageType: 'audio',
            audioUrl: uploadResponse.data?.audioUrl
          };
          console.log('🎵 Audio message data prepared:', messageData);
        } else {
          console.error('🎵 Audio upload failed:', uploadResponse.error);
          alert('Failed to upload audio: ' + (uploadResponse.error || 'Unknown error'));
          return;
        }
      }
      // Handle image upload
      else if (imageFile) {
        console.log('📷 Uploading image file...');
        const formData = new FormData();
        formData.append('image', imageFile);
        formData.append('roomId', roomId);

        const uploadResponse = await api.uploadChatImage(formData);
        console.log('📷 Image upload response:', uploadResponse);
        
        if (uploadResponse.success) {
          messageData = {
            roomId,
            message: newMessage.trim() || '📷 Image',
            messageType: 'image',
            imageUrl: uploadResponse.data?.imageUrl
          };
          console.log('📷 Image message data prepared:', messageData);
        } else {
          console.error('📷 Image upload failed:', uploadResponse.error);
          alert('Failed to upload image: ' + (uploadResponse.error || 'Unknown error'));
          return;
        }
      }

      console.log('📤 Sending message with data:', messageData);
      const response = await api.sendMessage(messageData);
      console.log('📤 Send message response:', response);
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
        
        // Clear the form
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

  const handleAudioRecordingComplete = (audioBlob: Blob) => {
    const audioFile = new File([audioBlob], `recording-${Date.now()}.wav`, { type: 'audio/wav' });
    setAudioFile(audioFile);
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

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewMessage(value);
    
    // Validate roomId before emitting typing events
    if (!roomId || roomId === 'undefined') {
      console.log('⌨️ ChatWidget - Invalid roomId, skipping typing event');
      return;
    }
    
    console.log('⌨️ ChatWidget typing event:', { value, isTyping, hasValue: !!value.trim(), roomId });
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    if (value.trim()) {
      if (!isTyping) {
        console.log('⌨️ ChatWidget starting typing...');
        setIsTyping(true);
        socketEvents.emit('user_typing', {
          roomId,
          isTyping: true,
          username: user?.username || 'Unknown'
        });
      }
      
      // Set timeout to stop typing after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        console.log('⌨️ ChatWidget auto-stopping typing after timeout...');
        setIsTyping(false);
        socketEvents.emit('user_typing', {
          roomId,
          isTyping: false,
          username: user?.username || 'Unknown'
        });
      }, 2000);
    } else {
      if (isTyping) {
        console.log('⌨️ ChatWidget stopping typing...');
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
    if (isTyping && roomId && roomId !== 'undefined') {
      setIsTyping(false);
      socket?.emit('user_typing', {
        roomId,
        isTyping: false,
        username: user?.username || 'Unknown'
      });
    }
  }, [messages.length]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (socket && connected && roomId && roomId !== 'undefined') {
        console.log('🧹 ChatWidget: Component unmounting, leaving room:', roomId);
        socketEvents.emit('leave_room', roomId);
      }
    };
  }, []);

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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

  const isUserOnline = (userId: string) => {
    const onlineUser = onlineUsers.find(u => u.userId === userId);
    const isOnline = onlineUser?.isOnline || false;
    console.log('🔍 ChatWidget - Checking online status for user:', userId, 'isOnline:', isOnline, 'onlineUsers:', onlineUsers);
    return isOnline;
  };

  // Get all image messages for lightbox
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

  const formatTime = (timestamp: string) => {
    try {
      const messageDate = new Date(timestamp);
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - messageDate.getTime()) / 1000);
      
      // Less than 1 minute
      if (diffInSeconds < 60) {
        return diffInSeconds <= 1 ? 'Just now' : `${diffInSeconds}s ago`;
      }
      
      // Less than 1 hour
      const diffInMinutes = Math.floor(diffInSeconds / 60);
      if (diffInMinutes < 60) {
        return diffInMinutes === 1 ? '1m ago' : `${diffInMinutes}m ago`;
      }
      
      // Less than 24 hours
      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) {
        return diffInHours === 1 ? '1h ago' : `${diffInHours}h ago`;
      }
      
      // Less than 7 days
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 7) {
        return diffInDays === 1 ? 'Yesterday' : `${diffInDays}d ago`;
      }
      
      // Less than 30 days
      if (diffInDays < 30) {
        const weeks = Math.floor(diffInDays / 7);
        return weeks === 1 ? '1w ago' : `${weeks}w ago`;
      }
      
      // Older than 30 days, show date
      return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch (error) {
      console.error('Error formatting message time:', error, 'Timestamp:', timestamp);
      return 'Unknown time';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 w-[500px] h-[700px] z-50 flex flex-col overflow-hidden">
      <Card className="h-full flex flex-col shadow-2xl border-2 p-0">
        {/* Chat Header */}
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 border-b">
          <div className="flex items-center space-x-3">
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-sm">{roomName}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(`/rooms/${roomId}/chat`, '_blank')}
                  className="h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
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
              <p className="text-xs text-muted-foreground">{displayRoomId}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="text-xs">
              {(() => {
                const onlineCount = onlineUsers.filter(u => u.isOnline).length;
                console.log('👥 Online users count:', onlineCount, 'Total users:', onlineUsers.length, 'Users:', onlineUsers);
                return `${onlineCount} online`;
              })()}
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
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        {/* Messages Area */}
        <CardContent className="flex-1 p-0 pb-[140px] h-[calc(100%-60px)] overflow-hidden">
          <ScrollArea 
            ref={scrollAreaRef} 
            className="h-full"
            onScrollCapture={handleScroll}
          >
            <div className="p-4 pb-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <p className="text-lg font-medium">No messages yet</p>
                  <p className="text-sm">Start the conversation!</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
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
                
                {(() => {
                  console.log('🎨 Rendering messages:', messages.length, messages);
                  return null;
                })()}
                
                {/* Start of messages ref for scroll detection */}
                <div ref={messagesStartRef} />
                
                {messages.map((message) => {
                  const isOwnMessage = message.userId === user?.id;
                  const isAudioMessage = message.messageType === 'audio';
                  
                  // Debug audio messages
                  if (message.messageType === 'audio') {
                    console.log('🎵 Rendering audio message:', {
                      id: message.id,
                      hasAudioUrl: !!message.audioUrl,
                      audioUrl: message.audioUrl,
                      messageType: message.messageType,
                      message: message.message
                    });
                  }
                  
                  return (
                    <div key={message.id} className={`flex items-start space-x-3 ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''} group`}>
                      <div className="relative">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={
                              message.userProfilePicture?.type === 'upload'
                                ? message.userProfilePicture.url
                                : message.userProfilePicture?.type === 'avatar'
                                ? `https://api.dicebear.com/7.x/${message.userProfilePicture.avatarStyle?.toLowerCase().replace(/\s+/g, '-')}/svg?seed=${message.userProfilePicture.seed || message.userId}`
                                : undefined
                            }
                          />
                          <AvatarFallback className="text-xs">
                            {message.username?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {/* Online status indicator */}
                        <div
                          className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${
                            isUserOnline(message.userId) ? 'bg-green-500' : 'bg-gray-400'
                          }`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`flex items-center space-x-2 mb-1 ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}>
                          <span className="font-medium text-sm">
                            {isOwnMessage ? 'You' : message.username}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatTime(message.timestamp)}
                          </span>
                        </div>
                        <div className={`rounded-lg ${isAudioMessage ? 'w-full' : 'max-w-xs'} ${
                          isOwnMessage 
                            ? 'bg-primary text-primary-foreground ml-auto' 
                            : 'bg-muted'
                        } relative flex items-start gap-2`}>
                          <div className="flex-1 py-2 pl-2">
                          {message.messageType === 'image' && message.imageUrl ? (
                            <div>
                              <img
                                src={message.imageUrl}
                                alt="Chat image"
                                className="max-w-full h-auto rounded-lg mb-2 cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => handleImageClick(message.imageUrl!)}
                              />
                              <p className="text-sm">{message.message}</p>
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
                                  <p className="text-sm mt-1">{message.message}</p>
                                )}
                              </div>
                            ) : (
                            <p className="text-sm">{message.message}</p>
                          )}
                          </div>
                          
                          {/* Three-dot dropdown menu - on the right inside message bubble */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className={`h-6 w-6 p-0 mt-2 mr-1 shrink-0 ${
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
            </div>
          </ScrollArea>
            
            {/* Scroll to bottom button */}
            {showScrollToBottom && (
              <div className="absolute bottom-24 right-4 z-10">
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

        {/* Message Input */}
        {canSendMessages ? (
            <div className="p-4 border-t absolute bottom-0 left-0 right-0 z-10 bg-muted/50 rounded-b-lg">
            {(imagePreview || audioFile) && (
              <div className="mb-2 flex gap-2">
                {audioFile && (
                  <div className="flex-1 p-2 bg-muted rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="text-xs">🎵 Audio ready</div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setAudioFile(null)}
                        className="h-5 w-5 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
                {imagePreview && (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={removeImage}
                      className="absolute -top-1 -right-1 h-5 w-5 p-0 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      <X className="h-2 w-2" />
                    </Button>
                  </div>
                )}
              </div>
            )}
            <form onSubmit={handleSendMessage} className="flex space-x-2">
              <div className="flex-1 flex space-x-2">
                <Input
                  value={newMessage}
                  onChange={handleTyping}
                  placeholder="Type a message..."
                  className="flex-1"
                />
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
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-blue-500 hover:bg-blue-50 bg-white shadow-md shrink-0 h-10 w-10"
                  title="Upload image"
                >
                  <ImageIcon className="h-5 w-5 text-blue-600" />
                </Button>
                <AudioRecorder
                  onRecordingComplete={handleAudioRecordingComplete}
                  disabled={!canSendMessages}
                />
              </div>
              <Button type="submit" size="sm" disabled={!newMessage.trim() && !imageFile && !audioFile}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        ) : (
          <div className="p-4 border-t bg-muted/50">
            <p className="text-sm text-muted-foreground text-center">
              You can only view messages as a viewer
            </p>
          </div>
        )}
      </Card>

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
