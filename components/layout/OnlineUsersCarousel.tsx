'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Users, MessageCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSocket } from '@/lib/contexts/SocketContext';
import { api } from '@/lib/api';
import { User } from '@/types';

interface OnlineUser {
  id: string;
  username: string;
  mobileNumber: string;
  profile: {
    profilePicture?: {
      type: 'upload' | 'avatar';
      url?: string;
      avatarStyle?: string;
      seed?: string;
    };
    location: {
      city?: string;
      state?: string;
      isVisible?: boolean;
    };
  };
  lastSeen?: string;
  isOnline: boolean;
}

interface OnlineUsersCarouselProps {
  currentUserId?: string;
  onMessageUser?: (userId: string, username: string) => void;
}

export default function OnlineUsersCarousel({ currentUserId, onMessageUser }: OnlineUsersCarouselProps) {
  const { socket } = useSocket();
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOnlineUsers();
  }, []);

  // Listen for socket events for real-time online/offline updates
  useEffect(() => {
    if (!socket) return;

    const handleUserOnline = (data: { userId: string; user: OnlineUser }) => {
      console.log('👤 User came online:', data);
      setOnlineUsers(prev => {
        const exists = prev.find(user => user.id === data.userId);
        if (exists) return prev;
        return [...prev, data.user];
      });
    };

    const handleUserOffline = (data: { userId: string }) => {
      console.log('👤 User went offline:', data);
      setOnlineUsers(prev => prev.filter(user => user.id !== data.userId));
    };

    const handleOnlineUsers = (data: { users: OnlineUser[] }) => {
      console.log('👥 Online users list:', data);
      setOnlineUsers(data.users.filter(user => user.id !== currentUserId));
    };

    socket.on('user_online', handleUserOnline);
    socket.on('user_offline', handleUserOffline);
    socket.on('online_users', handleOnlineUsers);

    // Request current online users when component mounts
    socket.emit('get_online_users');

    return () => {
      socket.off('user_online', handleUserOnline);
      socket.off('user_offline', handleUserOffline);
      socket.off('online_users', handleOnlineUsers);
    };
  }, [socket, currentUserId]);

  const fetchOnlineUsers = async () => {
    // Just set loading to false, we'll get users from socket events
    setLoading(false);
  };

  const getAvatarSrc = (profilePicture?: OnlineUser['profile']['profilePicture']) => {
    if (!profilePicture) return '';
    
    if (profilePicture.type === 'upload' && profilePicture.url) {
      return profilePicture.url;
    }
    
    if (profilePicture.type === 'avatar' && profilePicture.avatarStyle && profilePicture.seed) {
      const style = profilePicture.avatarStyle.toLowerCase().replace(/\s+/g, '-');
      return `https://api.dicebear.com/7.x/${style}/svg?seed=${profilePicture.seed}`;
    }
    
    return '';
  };

  const getLocationDisplay = (location: OnlineUser['profile']['location']) => {
    if (location.isVisible === false) return null;
    
    if (location.city && location.state) {
      return `${location.city}, ${location.state}`;
    }
    
    return location.city || location.state || null;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-5 w-5 text-green-600" />
            <h3 className="font-semibold text-lg">Online Users</h3>
          </div>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (onlineUsers.length === 0) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-5 w-5 text-green-600" />
            <h3 className="font-semibold text-lg">Online Users</h3>
          </div>
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No users online right now</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-5 w-5 text-green-600" />
          <h3 className="font-semibold text-lg">Online Users</h3>
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            {onlineUsers.length}
          </Badge>
        </div>
        
        <ScrollArea className="w-full">
          <div className="flex gap-3 pb-2">
            {onlineUsers.map((user) => {
              const locationDisplay = getLocationDisplay(user.profile.location);
              
              return (
                <Card 
                  key={user.id} 
                  className="flex-shrink-0 w-[200px] hover:shadow-md transition-shadow cursor-pointer group"
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col items-center text-center space-y-3">
                      {/* Avatar with online indicator */}
                      <div className="relative">
                        <Avatar className="h-16 w-16">
                          <AvatarImage
                            src={getAvatarSrc(user.profile.profilePicture)}
                          />
                          <AvatarFallback className="text-lg bg-primary text-primary-foreground">
                            {user.profile.profilePicture?.type === 'avatar'
                              ? '🎭'
                              : user.username?.charAt(0).toUpperCase() || user.mobileNumber?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        {/* Online indicator */}
                        <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 border-2 border-white rounded-full"></div>
                      </div>
                      
                      {/* Username */}
                      <div className="space-y-1">
                        <h4 className="font-medium text-sm truncate w-full">
                          @{user.username}
                        </h4>
                        
                        {/* Location */}
                        {locationDisplay && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">{locationDisplay}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Message Button */}
                      <Button
                        size="sm"
                        className="w-full text-xs h-7"
                        onClick={() => onMessageUser?.(user.id, user.username)}
                      >
                        <MessageCircle className="h-3 w-3 mr-1" />
                        Message
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
        
        {onlineUsers.length > 5 && (
          <div className="mt-3 text-center">
            <p className="text-xs text-muted-foreground">
              Scroll horizontally to see more users
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
