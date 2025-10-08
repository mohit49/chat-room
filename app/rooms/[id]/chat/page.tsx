'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { api } from '@/lib/api';
import { ArrowLeft, X, Volume2, VolumeX, Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { useSocket } from '@/lib/contexts/SocketContext';
import { useSocketEvents } from '@/hooks/useSocketEvents';
import { useSound } from '@/lib/contexts/SoundContext';
import { useVoiceBroadcast, VoiceBroadcastProvider } from '@/lib/contexts/VoiceBroadcastContext';

interface ChatMessage {
  id: string;
  roomId: string;
  userId: string;
  username: string;
  message: string;
  messageType: 'text' | 'image';
  imageUrl?: string;
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
  const { isBroadcasting, canBroadcast, toggleBroadcast } = useVoiceBroadcast();
  
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
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map()); // userId -> username
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesStartRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const isLoadingMoreRef = useRef(false);
  const shouldAutoScrollRef = useRef(true);
  const hasLoadedMessagesRef = useRef(false);
  const scrollTimeoutRef = useRef<number | null>(null);

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
    if (!newMessage.trim() && !imageFile) return;
    if (!canSendMessages) return;

    try {
      let messageData: any = {
        roomId,
        message: newMessage.trim(),
        messageType: 'text'
      };

      // Handle image upload
      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);
        formData.append('roomId', roomId);
        
        const uploadResponse = await api.uploadChatImage(formData);
        if (uploadResponse.success) {
          messageData.messageType = 'image';
          messageData.imageUrl = uploadResponse.data?.imageUrl;
        }
      }

      const response = await api.sendMessage(messageData);
      if (response.success) {
        setNewMessage('');
        setImageFile(null);
        setImagePreview(null);
        // The API call already handles real-time emission via socket
        // No need to emit separately to avoid duplicates
      } else {
        alert('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('Image size must be less than 5MB');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
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

      {/* Chat Area - Scrollable */}
      <div className="flex-1 pt-16 sm:pt-20 pb-20 sm:pb-20 overflow-hidden">
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
                    
                    return (
                      <div key={message.id} className={`flex items-start space-x-2 sm:space-x-4 ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}>
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
                          <div className={`mt-1 ${isOwnMessage ? 'text-right' : ''}`}>
                            {message.messageType === 'image' ? (
                              <div className={`space-y-2 ${isOwnMessage ? 'ml-auto max-w-xs sm:max-w-md' : ''}`}>
                                <img
                                  src={message.imageUrl}
                                  alt="Shared image"
                                  className="max-w-full sm:max-w-md rounded-lg shadow-sm"
                                />
                                {message.message && (
                                  <p className={`text-xs sm:text-sm break-words ${isOwnMessage ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
                                    {message.message}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <div className={`inline-block p-3 rounded-lg max-w-xs sm:max-w-md ${
                                isOwnMessage 
                                  ? 'bg-primary text-primary-foreground ml-auto' 
                                  : 'bg-muted'
                              }`}>
                                <p className="text-xs sm:text-sm break-words">
                                  {message.message}
                                </p>
                              </div>
                            )}
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
                {imagePreview && (
                  <div className="mb-2 sm:mb-3 relative">
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
                  className="h-9 w-9 sm:h-10 sm:w-10 p-0"
                >
                  <span className="text-sm sm:text-base">📷</span>
                </Button>
                {canBroadcast && (
                  <Button
                    type="button"
                    variant={isBroadcasting ? "destructive" : "outline"}
                    size="sm"
                    onClick={toggleBroadcast}
                    className="h-9 w-9 sm:h-10 sm:w-10 p-0"
                    title={isBroadcasting ? "Stop broadcasting" : "Start voice broadcast"}
                  >
                    {isBroadcasting ? (
                      <MicOff className="h-4 w-4 sm:h-5 sm:w-5" />
                    ) : (
                      <Mic className="h-4 w-4 sm:h-5 sm:w-5" />
                    )}
                  </Button>
                )}
                <Button type="submit" size="sm" className="h-9 px-3 sm:h-10 sm:px-6 text-xs sm:text-sm">
                  Send
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
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
