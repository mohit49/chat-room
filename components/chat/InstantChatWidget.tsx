'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { X, Send, Loader2, Image as ImageIcon, Volume2, VolumeX, Play, Pause, Mic, MessageSquare, Users, LogOut, Share2, Copy, Check, MoreVertical, Trash2 } from 'lucide-react';
import AudioRecorder from './AudioRecorder';
import { ImageCompressor } from '@/lib/utils/imageCompression';
import { useSocket } from '@/lib/contexts/SocketContext';
import { api } from '@/lib/api';
import { getInstantChatMessages, sendInstantChatMessage, deleteInstantChatMessage } from '@/lib/api/instantChat';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { getApiUrl, getSocketUrl } from '@/lib/utils/apiUrl';
import { io, Socket } from 'socket.io-client';

interface InstantChatWidgetProps {
  chatId: string;
  participantId: string;
  participantName: string;
  storeHistory: boolean;
  creatorId?: string; // ID of the user who created the chat
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  messageType: 'text' | 'image' | 'audio';
  imageUrl?: string;
  audioUrl?: string;
  timestamp: Date | string;
}

export default function InstantChatWidget({
  chatId,
  participantId,
  participantName,
  storeHistory,
  creatorId
}: InstantChatWidgetProps) {
  const router = useRouter();
  const { socket: authSocket } = useSocket(); // Socket for authenticated users
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [audioFile, setAudioFile] = useState<Blob | null>(null);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [participants, setParticipants] = useState<number>(1);
  const [linkCopied, setLinkCopied] = useState(false);
  
  // Check if current user is the creator
  const isCreator = participantId === creatorId;
  
  // Create a dedicated socket for instant chat (works for anonymous users)
  const [instantSocket, setInstantSocket] = useState<Socket | null>(null);
  
  // Use either authenticated socket or instant chat socket
  const socket = authSocket || instantSocket;
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize socket connection for instant chat (anonymous users)
  useEffect(() => {
    // If user is authenticated, use their socket. Otherwise, create a new one
    if (!authSocket) {
      console.log('🔌 Creating anonymous socket connection for instant chat');
      const newSocket = io(getSocketUrl(), {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      newSocket.on('connect', () => {
        console.log('✅ Anonymous socket connected:', newSocket.id);
      });

      newSocket.on('disconnect', () => {
        console.log('❌ Anonymous socket disconnected');
      });

      newSocket.on('error', (error) => {
        console.error('Socket error:', error);
      });

      setInstantSocket(newSocket);

      return () => {
        console.log('🔌 Cleaning up anonymous socket');
        newSocket.disconnect();
      };
    }
  }, [authSocket]);

  // Load message history if storeHistory is enabled
  useEffect(() => {
    if (storeHistory) {
      loadMessages();
    }
  }, [chatId, storeHistory]);

  const loadMessages = async () => {
    try {
      const response = await getInstantChatMessages(chatId);
      if (response.success && response.messages) {
        setMessages(response.messages);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  // Socket listeners
  useEffect(() => {
    if (!socket || !chatId) return;

    // Join instant chat room
    socket.emit('join_instant_chat', { chatId, participantId });

    // Listen for messages
    socket.on('instant_chat_message', (data: { chatId: string; message: Message }) => {
      if (data.chatId === chatId) {
        console.log('📨 Received instant chat message:', data.message);
        // Add message if it's not from current user (avoid duplicates)
        setMessages(prev => {
          // Check if message already exists
          const exists = prev.some(m => m.id === data.message.id);
          if (exists) return prev;
          return [...prev, data.message];
        });
      }
    });

    // Listen for typing
    socket.on('instant_chat_typing', (data: { participantId: string; participantName: string; isTyping: boolean }) => {
      if (data.participantId !== participantId) {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          if (data.isTyping) {
            newSet.add(data.participantName);
          } else {
            newSet.delete(data.participantName);
          }
          return newSet;
        });
      }
    });

    // Listen for user joined/left
    socket.on('instant_chat_user_joined', () => {
      setParticipants(prev => prev + 1);
    });

    socket.on('instant_chat_user_left', () => {
      setParticipants(prev => Math.max(1, prev - 1));
    });

    // Listen for chat ending (when creator leaves)
    socket.on('instant_chat_ended', (data: { chatId: string; reason: string }) => {
      if (data.chatId === chatId) {
        console.log('🚪 Instant chat has ended:', data.reason);
        toast({
          title: "Chat Ended",
          description: data.reason,
          variant: "destructive",
        });
        
        // Redirect to home after 2 seconds
        setTimeout(() => {
          router.push('/home');
        }, 2000);
      }
    });

    // Listen for message deletion
    socket.on('instant_chat_message_deleted', (data: { chatId: string; messageId: string }) => {
      if (data.chatId === chatId) {
        console.log('🗑️ Message deleted:', data.messageId);
        setMessages(prev => prev.filter(m => m.id !== data.messageId));
      }
    });

    return () => {
      socket.emit('leave_instant_chat', { chatId, participantId, isCreator });
      socket.off('instant_chat_message');
      socket.off('instant_chat_typing');
      socket.off('instant_chat_user_joined');
      socket.off('instant_chat_user_left');
      socket.off('instant_chat_ended');
      socket.off('instant_chat_message_deleted');
    };
  }, [socket, chatId, participantId, isCreator, router, toast]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);

    // Send typing indicator
    if (socket) {
      socket.emit('instant_chat_typing', {
        chatId,
        participantId,
        participantName,
        isTyping: true
      });

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Stop typing after 1 second of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('instant_chat_typing', {
          chatId,
          participantId,
          participantName,
          isTyping: false
        });
      }, 1000);
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }

    try {
      // Check if compression is needed
      const shouldCompress = ImageCompressor.shouldCompress(file, 500); // 500KB threshold
      
      console.log('📸 Image upload debug:', {
        fileName: file.name,
        originalSize: (file.size / 1024).toFixed(2) + ' KB',
        shouldCompress,
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
        console.log('📸 Using original image (no compression needed)');
      }

      setImageFile(processedFile);
      setImagePreview(URL.createObjectURL(processedFile));
      
      console.log('📸 Image ready for upload:', {
        finalSize: (processedFile.size / 1024).toFixed(2) + ' KB'
      });
    } catch (error) {
      console.error('Error processing image:', error);
      alert('Failed to process image');
    }
  };

  const handleAudioRecordingComplete = (audioBlob: Blob) => {
    setAudioFile(audioBlob);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() && !imageFile && !audioFile) return;

    setSending(true);
    try {
      let messageType: 'text' | 'image' | 'audio' = 'text';
      let imageUrl: string | undefined;
      let audioUrl: string | undefined;

      // Handle audio upload - use instant chat upload endpoint (no auth required)
      if (audioFile) {
        const formData = new FormData();
        formData.append('audio', audioFile);

        const response = await fetch(`${getApiUrl()}/chat/instant/upload-audio`, {
          method: 'POST',
          body: formData,
        });

        const uploadResponse = await response.json();
        
        if (uploadResponse.success) {
          messageType = 'audio';
          audioUrl = uploadResponse.data?.audioUrl;
        } else {
          alert('Failed to upload audio');
          return;
        }
      }
      // Handle image upload - use instant chat upload endpoint (no auth required)
      else if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);

        const response = await fetch(`${getApiUrl()}/chat/instant/upload-image`, {
          method: 'POST',
          body: formData,
        });

        const uploadResponse = await response.json();
        
        if (uploadResponse.success) {
          messageType = 'image';
          imageUrl = uploadResponse.data?.imageUrl;
        } else {
          alert('Failed to upload image');
          return;
        }
      }

      // Send message
      const response = await sendInstantChatMessage(
        chatId,
        participantId,
        participantName,
        newMessage.trim() || (messageType === 'image' ? '📷 Image' : '🎵 Audio'),
        messageType,
        imageUrl,
        audioUrl
      );

      if (response.success) {
        const message = response.message;
        
        // Add to local messages immediately
        setMessages(prev => [...prev, message]);

        // Emit via socket for real-time updates to others
        if (socket) {
          socket.emit('instant_chat_message', {
            chatId,
            message: message
          });
        }

        // Clear inputs
        setNewMessage('');
        setImageFile(null);
        setImagePreview(null);
        setAudioFile(null);
      } else {
        alert('Failed to send message: ' + response.error);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleLeaveChat = () => {
    if (confirm('Are you sure you want to leave this chat?')) {
      router.push('/home');
    }
  };

  const handleCopyLink = async () => {
    const link = `${window.location.origin}/instant-chat/${chatId}`;
    try {
      await navigator.clipboard.writeText(link);
      setLinkCopied(true);
      toast({
        title: "Link Copied!",
        description: "Chat link copied to clipboard. Share it with others!",
      });
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      toast({
        title: "Failed to copy",
        description: "Could not copy link to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    const link = `${window.location.origin}/instant-chat/${chatId}`;
    
    // Check if Web Share API is supported
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Instant Chat',
          text: 'Join me in this instant chat!',
          url: link,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback to copy
      handleCopyLink();
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Delete this message for everyone?')) {
      return;
    }

    try {
      const response = await deleteInstantChatMessage(chatId, messageId, participantId);
      
      if (response.success) {
        // Emit socket event to notify all participants
        if (socket) {
          socket.emit('instant_chat_delete_message', {
            chatId,
            messageId
          });
        }

        toast({
          title: "Message Deleted",
          description: "Message has been deleted for everyone",
        });
      } else {
        toast({
          title: "Failed to Delete",
          description: response.error || "Could not delete message",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      toast({
        title: "Error",
        description: "Failed to delete message",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="h-full w-full rounded-none border-0 flex flex-col">
        {/* Header */}
        <CardHeader className="flex-shrink-0 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Instant Chat</h3>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Users className="h-3 w-3" />
                  {participants} {participants === 1 ? 'participant' : 'participants'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="icon"
                onClick={handleShare}
                title="Share chat link"
                className="relative"
              >
                {linkCopied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Share2 className="h-4 w-4" />
                )}
              </Button>
              <Button 
                variant="outline" 
                size="icon"
                onClick={handleCopyLink}
                title="Copy chat link"
              >
                {linkCopied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <Button variant="ghost" size="icon" onClick={handleLeaveChat} title="Leave chat">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Messages */}
        <CardContent className="flex-1 overflow-hidden p-0">
          <ScrollArea className="h-full px-4 py-2">
            <div className="space-y-4">
              {messages.map((msg) => {
                const isOwnMessage = msg.senderId === participantId;
                
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} group`}
                  >
                    <div className={`flex gap-2 max-w-[70%] ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                          {msg.senderName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                        <span className="text-xs text-muted-foreground mb-1">{msg.senderName}</span>
                        <div className="flex items-start gap-1">
                          <div
                            className={`rounded-lg px-4 py-2 ${
                              isOwnMessage
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            {msg.messageType === 'text' && <p className="text-sm">{msg.message}</p>}
                            {msg.messageType === 'image' && msg.imageUrl && (
                              <img src={msg.imageUrl} alt="Shared image" className="max-w-xs rounded" />
                            )}
                            {msg.messageType === 'audio' && msg.audioUrl && (
                              <audio controls className="max-w-xs">
                                <source src={msg.audioUrl} type="audio/webm" />
                              </audio>
                            )}
                          </div>
                          
                          {/* Delete button - only show for own messages */}
                          {isOwnMessage && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <MoreVertical className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleDeleteMessage(msg.id)}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete for everyone
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {/* Typing indicator */}
              {typingUsers.size > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="h-2 w-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="h-2 w-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                  <span>{Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...</span>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </CardContent>

        {/* Input */}
        <div className="flex-shrink-0 border-t p-4 space-y-2">
          {(imagePreview || audioFile) && (
            <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
              {imagePreview && (
                <div className="relative">
                  <img src={imagePreview} alt="Preview" className="h-16 w-16 object-cover rounded" />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview(null);
                    }}
                    className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full bg-red-500 hover:bg-red-600 text-white"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
              {audioFile && (
                <div className="flex items-center gap-2">
                  <Mic className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">Audio recorded</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setAudioFile(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
          
          <div className="flex gap-2 items-center">
            <Input
              value={newMessage}
              onChange={handleInputChange}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
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
              className="shrink-0"
            >
              <ImageIcon className="h-4 w-4" />
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
      </Card>
    </div>
  );
}

