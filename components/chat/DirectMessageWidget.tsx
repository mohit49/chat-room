'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { X, Send, Loader2, MessageCircle, Image as ImageIcon, Volume2, VolumeX, Trash2, MoreVertical, Play, Pause, Mic } from 'lucide-react';
import AudioRecorder from './AudioRecorder';
import ImageLightbox from './ImageLightbox';
import { ImageCompressor } from '@/lib/utils/imageCompression';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useSocket } from '@/lib/contexts/SocketContext';
import { useSocketEvents } from '@/hooks/useSocketEvents';
import { useSound } from '@/lib/contexts/SoundContext';
import { api } from '@/lib/api';

interface DirectMessageWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser: {
    id: string;
    username: string;
    profilePicture?: {
      type: 'upload' | 'avatar';
      url?: string;
      avatarStyle?: string;
      seed?: string;
    };
  };
}

interface DirectMessage {
  id: string;
  senderId: string;
  receiverId: string;
  message: string;
  messageType: 'text' | 'image' | 'audio';
  imageUrl?: string;
  audioUrl?: string;
  timestamp: string;
  senderUsername: string;
  senderProfilePicture?: {
    type: 'upload' | 'avatar';
    url?: string;
    avatarStyle?: string;
    seed?: string;
  };
}

export default function DirectMessageWidget({ 
  isOpen, 
  onClose, 
  targetUser 
}: DirectMessageWidgetProps) {
  const { user } = useAuth();
  const { socket, connected, connectionConfirmed, isUserOnline } = useSocket();
  const { soundEnabled, toggleSound, playMessageSound } = useSound();
  
  // Memoize socket event handlers
  const handleDirectMessage = useCallback((data: DirectMessage) => {
    // Only add message if it's from the target user or to the target user
    if (data.senderId === targetUser.id || data.receiverId === targetUser.id) {
      // Check if message already exists to avoid duplicates
      setMessages(prev => {
        const exists = prev.some(msg => msg.id === data.id);
        if (exists) return prev;
        return [...prev, data];
      });
      scrollToBottom();
      
      // Play sound for new messages (only if not from current user)
      if (data.senderId !== user?.id) {
        playMessageSound();
      }
    }
  }, [targetUser.id, user?.id, playMessageSound]);

  const handleMessageStatus = useCallback((data: { messageId: string; status: 'sent' | 'delivered' | 'read' }) => {
    // Update message status if needed
  }, []);

  const handleDirectMessageTyping = useCallback((data: { userId: string; isTyping: boolean; username: string }) => {
    // Only handle typing for the target user
    if (data.userId === targetUser.id) {
      setIsTargetUserTyping(data.isTyping);
      
      // Auto-clear typing indicator after 3 seconds
      if (data.isTyping) {
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(() => {
          setIsTargetUserTyping(false);
        }, 3000);
      }
    }
  }, [targetUser.id]);

  const handleMessagesRead = useCallback((data: { readBy: string; readByUsername: string; timestamp: string }) => {
    console.log('📖 Messages were read by:', data.readByUsername);
    // Update all messages from current user to read status
    setMessages(prev => 
      prev.map(msg => 
        msg.senderId === user?.id 
          ? { ...msg, status: 'read' }
          : msg
      )
    );
  }, [user?.id]);

  const handleMessageDeleted = useCallback((data: { messageId: string }) => {
    // Remove deleted message from local state
    setMessages(prev => prev.filter(msg => msg.id !== data.messageId));
  }, []);

  const handleConversationDeleted = useCallback(() => {
    // Clear all messages when conversation is deleted
    setMessages([]);
  }, []);

  // Socket events
  const socketEvents = useSocketEvents({
    onDirectMessage: handleDirectMessage,
    onMessageStatus: handleMessageStatus,
    onDirectMessageTyping: handleDirectMessageTyping,
    onMessagesRead: handleMessagesRead,
    onMessageDeleted: handleMessageDeleted,
    onConversationDeleted: handleConversationDeleted
  }, `DirectMessageWidget-${targetUser.id}`);
  
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [newMessageId, setNewMessageId] = useState<string | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isTargetUserTyping, setIsTargetUserTyping] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showImageLightbox, setShowImageLightbox] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());

  // Fetch messages when component opens
  useEffect(() => {
    if (isOpen && user) {
      fetchMessages();
      markMessagesAsSeen();
    }
  }, [isOpen, user, targetUser.id]);

  // Mark messages as seen when chat opens
  const markMessagesAsSeen = async () => {
    try {
      await api.markDirectMessagesAsSeen(targetUser.id);
      
      // Emit socket event to notify backend that messages were read
      if (socket) {
        socket.emit('message_read', {
          senderId: targetUser.id,
          receiverId: user?.id
        });
      }
      
      // Refresh the message side panel to update unread counts
      if (typeof window !== 'undefined' && (window as any).refreshMessageSidePanel) {
        (window as any).refreshMessageSidePanel();
      }
    } catch (error) {
      console.error('Failed to mark messages as seen:', error);
    }
  };


  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await api.getDirectMessages(targetUser.id);
      if (response.success) {
        const messageData = (response as any).messages || response.data?.messages || [];
        setMessages(messageData);
        scrollToBottom();
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error('Failed to fetch direct messages:', error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollAreaRef.current) {
        const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (scrollElement) {
          scrollElement.scrollTop = scrollElement.scrollHeight;
        }
      }
    }, 100);
  };

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !audioFile && !imageFile) || sending || !user) return;

    // Stop typing indicator when sending
    socketEvents.emit('direct_message_typing', {
      targetUserId: targetUser.id,
      isTyping: false
    });

    try {
      setSending(true);

      let messageData: any = {
        receiverId: targetUser.id,
        message: newMessage.trim() || (audioFile ? '🎵 Audio' : '📷 Image'),
        messageType: 'text'
      };

      // Handle audio upload
      if (audioFile) {
        const formData = new FormData();
        formData.append('audio', audioFile);
        formData.append('receiverId', targetUser.id);

        const uploadResponse = await api.uploadDirectMessageAudio(formData);
        if (uploadResponse.success) {
          messageData.audioUrl = uploadResponse.data?.audioUrl;
          messageData.messageType = 'audio';
        } else {
          alert('Failed to upload audio');
          return;
        }
      }
      // Handle image upload
      else if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);
        formData.append('receiverId', targetUser.id);

        const uploadResponse = await api.uploadDirectMessageImage(formData);
        if (uploadResponse.success) {
          messageData.imageUrl = uploadResponse.data?.imageUrl;
          messageData.messageType = 'image';
        } else {
          alert('Failed to upload image');
          return;
        }
      }

      const response = await api.sendDirectMessage(targetUser.id, messageData.message, messageData.messageType, messageData.imageUrl, messageData.audioUrl);

      if (response.success) {
        // Optimistically add the message to UI immediately
        const responseData = response as any; // Server returns messageId at top level
        const newMessageData: DirectMessage = {
          id: responseData.messageId || response.data?.id || `temp-${Date.now()}`,
          senderId: user.id,
          receiverId: targetUser.id,
          message: messageData.message,
          messageType: messageData.messageType,
          imageUrl: messageData.imageUrl,
          audioUrl: messageData.audioUrl,
          timestamp: new Date().toISOString(),
          senderUsername: user.username || user.mobileNumber,
          senderProfilePicture: user.profile?.profilePicture
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
        setAudioFile(null);
        setImageFile(null);
        setImagePreview(null);
      }
    } catch (error) {
      console.error('Failed to send direct message:', error);
    } finally {
      setSending(false);
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
      
      console.log('📸 Image upload debug:', {
        fileName: file.name,
        originalSize: (file.size / 1024).toFixed(2) + ' KB',
        shouldCompress,
        fileType: file.type
      });
      
      let processedFile = file;
      
      if (shouldCompress) {
        console.log('📸 Starting image compression...');
        try {
          // Compress image: max 800x600, 80% quality
          processedFile = await ImageCompressor.compressImage(file, 800, 600, 0.8);
          console.log('✅ Image compression completed');
        } catch (compressionError) {
          console.error('❌ Image compression failed:', compressionError);
          // Use original file if compression fails
          processedFile = file;
        }
      } else {
        console.log('📸 Image size OK, no compression needed');
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

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeleteMessage = (messageId: string) => {
    if (!socket) return;

    // Find the message to get its details
    const messageToDelete = messages.find(msg => msg.id === messageId);
    if (!messageToDelete) return;

    // Only allow deleting own messages
    if (messageToDelete.senderId !== user?.id) {
      alert('You can only delete your own messages');
      return;
    }

    // Emit socket event for real-time deletion
    socket.emit('delete_message', {
      messageId,
      senderId: user.id,
      receiverId: targetUser.id,
      messageType: messageToDelete.messageType,
      imageUrl: messageToDelete.imageUrl,
      audioUrl: messageToDelete.audioUrl
    });

    // Remove message locally immediately for instant feedback
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
  };

  const handleDeleteConversation = () => {
    if (!socket) return;

    if (!window.confirm('Are you sure you want to delete this entire conversation? This cannot be undone.')) {
      return;
    }

    // Emit socket event for real-time conversation deletion
    socket.emit('delete_conversation', {
      senderId: user?.id,
      receiverId: targetUser.id
    });

    // Clear all messages locally immediately
    setMessages([]);
    
    // Close the chat widget
    onClose();
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
        senderUsername: msg.senderUsername
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewMessage(value);

    // Emit typing indicator
    if (value.trim() && !sending) {
      socketEvents.emit('direct_message_typing', {
        targetUserId: targetUser.id,
        isTyping: true
      });
    } else {
      socketEvents.emit('direct_message_typing', {
        targetUserId: targetUser.id,
        isTyping: false
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getAvatarSrc = (profilePicture?: DirectMessage['senderProfilePicture']) => {
    if (!profilePicture) return '';
    
    if (profilePicture.type === 'upload' && profilePicture.url) {
      return profilePicture.url;
    }
    
    if (profilePicture.type === 'avatar' && profilePicture.avatarStyle && profilePicture.seed) {
      // Generate avatar URL using DiceBear
      const style = profilePicture.avatarStyle.toLowerCase().replace(/\s+/g, '-');
      return `https://api.dicebear.com/7.x/${style}/svg?seed=${profilePicture.seed}`;
    }
    
    return '';
  };

  const formatMessageTime = (timestamp: string) => {
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

  if (!isOpen) {
    console.log('🔔 DirectMessageWidget not open, returning null');
    return null;
  }

  console.log('🔔 DirectMessageWidget is open, rendering chat widget');
  return (
    <div className="fixed bottom-4 right-4 z-50 w-[calc(100vw-2rem)] h-[calc(100vh-2rem)] max-h-[700px] sm:w-[450px] sm:h-[700px] animate-in slide-in-from-bottom-2 duration-300">
      <Card className="w-full h-full flex flex-col shadow-2xl border-2">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={getAvatarSrc(targetUser.profilePicture)} />
              <AvatarFallback>
                {targetUser.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex items-center space-x-2">
              <div>
                <h3 className="font-semibold">{targetUser.username}</h3>
              </div>
              <div
                className={`w-3 h-3 rounded-full ${
                  isUserOnline(targetUser.id) ? 'bg-green-500' : 'bg-gray-400'
                }`}
                title={isUserOnline(targetUser.id) ? 'Online' : 'Offline'}
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={handleDeleteConversation}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Conversation
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 p-0 flex flex-col overflow-hidden">
          <ScrollArea ref={scrollAreaRef} className="flex-1">
            <div className="p-4 pb-32">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                <p>No messages yet. Start a conversation!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => {
                  const isNewMessage = message.id === newMessageId;
                  const isOwnMessage = message.senderId === user?.id;
                  
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} ${
                        isNewMessage ? 'animate-pulse' : ''
                      } group`}
                    >
                      <div
                        className={`${message.messageType === 'audio' ? 'w-full' : 'max-w-[80%]'} rounded-lg px-3 py-2 transition-all duration-300 relative ${
                          isOwnMessage
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        } ${
                          isNewMessage 
                            ? 'ring-2 ring-blue-500 shadow-lg scale-105' 
                            : ''
                        }`}
                      >
                        {/* Delete button for own messages */}
                        {isOwnMessage && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteMessage(message.id)}
                            className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full bg-red-500 text-white hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Delete message"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                        {message.messageType === 'image' && message.imageUrl ? (
                          <div>
                            <img
                              src={message.imageUrl}
                              alt="Shared image"
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
                        <p className="text-xs opacity-70 mt-1">
                          {formatMessageTime(message.timestamp)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                
                {/* Typing indicator */}
                {isTargetUserTyping && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg px-3 py-2">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            </div>
          </ScrollArea>

          <div className="p-4 border-t absolute bottom-0 left-0 right-0 z-10 bg-muted/50 rounded-b-lg">
            {(audioFile || imagePreview) && (
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
            <div className="flex gap-2 items-center">
              <Input
                value={newMessage}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                disabled={sending}
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
                disabled={sending}
              />
              <Button
                onClick={handleSendMessage}
                disabled={(!newMessage.trim() && !audioFile && !imageFile) || sending}
                size="icon"
                className="shrink-0"
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
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
