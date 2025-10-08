'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Send, Loader2, MessageCircle } from 'lucide-react';
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
  messageType: 'text' | 'image';
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
  const { socket, connected, connectionConfirmed } = useSocket();
  const { playMessageSound } = useSound();
  
  // Memoize socket event handlers
  const handleDirectMessage = useCallback((data: DirectMessage) => {
    // Only add message if it's from the target user or to the target user
    if (data.senderId === targetUser.id || data.receiverId === targetUser.id) {
      setMessages(prev => [...prev, data]);
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

  // Socket events
  const socketEvents = useSocketEvents({
    onDirectMessage: handleDirectMessage,
    onMessageStatus: handleMessageStatus,
    onDirectMessageTyping: handleDirectMessageTyping,
    onMessagesRead: handleMessagesRead
  }, `DirectMessageWidget-${targetUser.id}`);
  
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [newMessageId, setNewMessageId] = useState<string | null>(null);
  const [isTargetUserTyping, setIsTargetUserTyping] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    if (!newMessage.trim() || sending || !user) return;

    // Stop typing indicator when sending
    socketEvents.emit('direct_message_typing', {
      targetUserId: targetUser.id,
      isTyping: false
    });

    try {
      setSending(true);
      const response = await api.sendDirectMessage(targetUser.id, newMessage.trim());
      
      if (response.success) {
        // Add message to local state immediately
        const newMsg: DirectMessage = {
          id: response.data?.messageId || Date.now().toString(),
          senderId: user.id,
          receiverId: targetUser.id,
          message: newMessage.trim(),
          messageType: 'text',
          timestamp: new Date().toISOString(),
          senderUsername: user.username || 'You',
          senderProfilePicture: user.profile?.profilePicture
        };
        
        setMessages(prev => [...prev, newMsg]);
        setNewMessage('');
        setNewMessageId(newMsg.id);
        scrollToBottom();
        
        // Clear the new message highlight after a short delay
        setTimeout(() => {
          setNewMessageId(null);
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to send direct message:', error);
    } finally {
      setSending(false);
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
    <div className="fixed bottom-4 right-4 z-50 w-[calc(100vw-2rem)] h-[calc(100vh-2rem)] max-h-[600px] sm:w-80 sm:h-[600px] animate-in slide-in-from-bottom-2 duration-300">
      <Card className="w-full h-full flex flex-col shadow-2xl border-2">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={getAvatarSrc(targetUser.profilePicture)} />
              <AvatarFallback>
                {targetUser.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">{targetUser.username}</h3>
              <p className="text-xs text-muted-foreground">
                {connected ? 'Online' : 'Offline'}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="flex-1 p-0 flex flex-col overflow-hidden">
          <ScrollArea ref={scrollAreaRef} className="flex-1">
            <div className="p-4 pb-20">
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
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-3 py-2 transition-all duration-300 ${
                          isOwnMessage
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        } ${
                          isNewMessage 
                            ? 'ring-2 ring-blue-500 shadow-lg scale-105' 
                            : ''
                        }`}
                      >
                        <p className="text-sm">{message.message}</p>
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
            <div className="flex gap-2">
              <Input
                value={newMessage}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                disabled={sending}
                className="flex-1"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || sending}
                size="icon"
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
    </div>
  );
}
