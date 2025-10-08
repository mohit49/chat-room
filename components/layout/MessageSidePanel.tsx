'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { X, MessageCircle, Clock } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useSocket } from '@/lib/contexts/SocketContext';
import { openChat } from '@/components/layout/GlobalChatManager';
import { formatDistanceToNow } from 'date-fns';

interface MessageUser {
  id: string;
  username: string;
  profilePicture?: {
    type: 'upload' | 'avatar';
    url?: string;
    avatarStyle?: string;
    seed?: string;
  };
  latestMessage?: {
    id: string;
    message: string;
    timestamp: string;
    isRead: boolean;
  };
  unreadCount: number;
}

interface MessageSidePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MessageSidePanel({ isOpen, onClose }: MessageSidePanelProps) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [users, setUsers] = useState<MessageUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchUsersWithMessages();
    }
  }, [isOpen]);

  const fetchUsersWithMessages = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('🔄 Fetching users with messages...');
      const response = await api.getUsersWithMessages();
      console.log('📡 API Response:', response);
      
      if (response.success && response.data?.users) {
        console.log('👥 Users received:', response.data.users.length);
        setUsers(response.data.users);
      } else {
        console.log('❌ No users in response or API failed');
        setError('Failed to load messages');
      }
    } catch (err: any) {
      console.error('❌ Error fetching messages:', err);
      setError(err.message || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const handleUserClick = (messageUser: MessageUser) => {
    // Open chat with the selected user
    openChat({
      id: messageUser.id,
      username: messageUser.username,
      profilePicture: messageUser.profilePicture
    });
    onClose();
  };

  const refreshUnreadCounts = () => {
    if (isOpen) {
      fetchUsersWithMessages();
    }
  };

  // Expose refresh function globally
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).refreshMessageSidePanel = refreshUnreadCounts;
    }
  }, [isOpen]);

  // Listen for new direct messages to refresh unread counts
  useEffect(() => {
    if (!socket) return;

    const handleDirectMessage = () => {
      // Refresh the side panel when a new direct message arrives
      refreshUnreadCounts();
    };

    socket.on('direct_message', handleDirectMessage);

    return () => {
      socket.off('direct_message', handleDirectMessage);
    };
  }, [socket]);

  const getAvatarContent = (profilePicture?: MessageUser['profilePicture'], username?: string) => {
    if (profilePicture?.type === 'upload' && profilePicture.url) {
      return <AvatarImage src={profilePicture.url} alt="Profile" />;
    } else if (profilePicture?.type === 'avatar' && profilePicture.avatarStyle) {
      // Generate avatar using the seed (username) and style
      const avatarUrl = `https://api.dicebear.com/7.x/${profilePicture.avatarStyle.toLocaleLowerCase()}/svg?seed=${profilePicture.seed || username || 'user'}`;
      return <AvatarImage src={avatarUrl} alt="Profile" />;
    }
    return null;
  };

  const getInitials = (username: string) => {
    if (!username || username.trim() === '') return 'U';
    return username.charAt(0).toUpperCase();
  };

  const formatMessageTime = (timestamp: string) => {
    try {
      console.log('🕒 Formatting timestamp:', timestamp);
      const messageDate = new Date(timestamp);
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - messageDate.getTime()) / 1000);
      
      console.log('📅 Message date:', messageDate.toISOString());
      console.log('📅 Current date:', now.toISOString());
      console.log('⏱️ Difference in seconds:', diffInSeconds);
      
      // Less than 1 minute
      if (diffInSeconds < 60) {
        const result = diffInSeconds <= 1 ? 'Just now' : `${diffInSeconds}s ago`;
        console.log('⏰ Just now/seconds:', result);
        return result;
      }
      
      // Less than 1 hour
      const diffInMinutes = Math.floor(diffInSeconds / 60);
      if (diffInMinutes < 60) {
        const result = diffInMinutes === 1 ? '1m ago' : `${diffInMinutes}m ago`;
        console.log('⏰ Minutes:', result);
        return result;
      }
      
      // Less than 24 hours
      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) {
        const result = diffInHours === 1 ? '1h ago' : `${diffInHours}h ago`;
        console.log('⏰ Hours:', result);
        return result;
      }
      
      // Less than 7 days
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 7) {
        const result = diffInDays === 1 ? 'Yesterday' : `${diffInDays}d ago`;
        console.log('⏰ Days:', result);
        return result;
      }
      
      // Less than 30 days
      if (diffInDays < 30) {
        const weeks = Math.floor(diffInDays / 7);
        const result = weeks === 1 ? '1w ago' : `${weeks}w ago`;
        console.log('⏰ Weeks:', result);
        return result;
      }
      
      // Older than 30 days, show date
      const dateStr = messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
      console.log('📅 Older date:', dateStr);
      return dateStr;
    } catch (error) {
      console.error('Error formatting message time:', error, 'Timestamp:', timestamp);
      return 'Unknown time';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50" 
        onClick={onClose}
      />
      
      {/* Side Panel */}
      <div className="relative ml-auto h-full w-full max-w-md bg-background border-l shadow-lg">
        <Card className="h-full rounded-none border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Messages
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          
          <CardContent className="p-0 h-full">
            <ScrollArea className="h-[calc(100vh-80px)]">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center h-32 text-center p-4">
                  <p className="text-sm text-muted-foreground mb-2">{error}</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={fetchUsersWithMessages}
                  >
                    Try Again
                  </Button>
                </div>
              ) : users.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-center p-4">
                  <MessageCircle className="h-12 w-12 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No messages yet</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {users.map((messageUser) => (
                    <div
                      key={messageUser.id}
                      className="flex items-center gap-3 p-4 hover:bg-muted/50 cursor-pointer transition-colors border-b"
                      onClick={() => handleUserClick(messageUser)}
                    >
                      <div className="relative">
                        <Avatar className="h-12 w-12">
                          {getAvatarContent(messageUser.profilePicture, messageUser.username)}
                          <AvatarFallback>
                            {getInitials(messageUser.username)}
                          </AvatarFallback>
                        </Avatar>
                        {messageUser.unreadCount > 0 && (
                          <Badge 
                            variant="destructive" 
                            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                          >
                            {messageUser.unreadCount > 9 ? '9+' : messageUser.unreadCount}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-medium text-sm truncate">
                            @{messageUser.username || 'Unknown User'}
                          </h3>
                          {messageUser.latestMessage && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>{formatMessageTime(messageUser.latestMessage.timestamp)}</span>
                            </div>
                          )}
                        </div>
                        
                        {messageUser.latestMessage ? (
                          <p className={`text-sm truncate ${
                            !messageUser.latestMessage.isRead ? 'font-medium' : 'text-muted-foreground'
                          }`}>
                            {messageUser.latestMessage.message}
                          </p>
                        ) : (
                          <p className="text-sm text-muted-foreground">No messages yet</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
