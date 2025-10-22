'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Users, MessageCircle, Clock } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSocket } from '@/lib/contexts/SocketContext';
import { api } from '@/lib/api';
import { User, OnlineStatus } from '@/types';
import { useAuth } from '@/lib/contexts/AuthContext';

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
  lastSeen?: Date;
  onlineStatus?: OnlineStatus;
}

interface OnlineUsersCarouselProps {
  currentUserId?: string;
  onMessageUser?: (userId: string, username: string) => void;
}

export default function OnlineUsersCarousel({ currentUserId, onMessageUser }: OnlineUsersCarouselProps) {
  const { socket, getUserStatus } = useSocket();
  const { user: currentUser } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [displayedUsers, setDisplayedUsers] = useState<OnlineUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showingOfflineUsers, setShowingOfflineUsers] = useState(false);
  const [offlineUsersFetched, setOfflineUsersFetched] = useState(false);

  // Fetch offline users when no online users are available
  const fetchOfflineUsers = async () => {
    if (offlineUsersFetched) {
      console.log('📱 Offline users already fetched, skipping...');
      return;
    }

    try {
      console.log('📱 Fetching offline users...');
      setLoading(true);
      
      // Search for users (empty query returns all users)
      const response = await api.searchUsers('') as any;
      const allUsers = response?.users || [];
      console.log(`📱 Found ${allUsers.length} total users`);
      
      // Filter out current user and online users
      const offlineUsers = allUsers.filter((user: OnlineUser) => 
        user.id !== currentUserId && 
        !onlineUsers.some(ou => ou.id === user.id)
      );
      console.log(`📱 Filtered to ${offlineUsers.length} offline users`);

      if (offlineUsers.length === 0) {
        console.log('📱 No offline users available');
        setDisplayedUsers([]);
        setLoading(false);
        setOfflineUsersFetched(true);
        return;
      }

      // Get current user's location
      const currentLocation = {
        city: currentUser?.profile?.location?.city,
        state: currentUser?.profile?.location?.state,
      };
      console.log('📍 Current user location:', currentLocation);

      let usersToShow: OnlineUser[] = [];

      // First try: Filter by same location (city and state match)
      if (currentLocation.city && currentLocation.state) {
        usersToShow = offlineUsers.filter((user: OnlineUser) => 
          user.profile?.location?.isVisible !== false &&
          user.profile?.location?.city === currentLocation.city &&
          user.profile?.location?.state === currentLocation.state
        );
        console.log(`📍 Found ${usersToShow.length} users in same city/state`);
      }

      // Second try: If no users in same location, try same state
      if (usersToShow.length === 0 && currentLocation.state) {
        usersToShow = offlineUsers.filter((user: OnlineUser) => 
          user.profile?.location?.isVisible !== false &&
          user.profile?.location?.state === currentLocation.state
        );
        console.log(`📍 Found ${usersToShow.length} users in same state`);
      }

      // Final fallback: Show random offline users
      if (usersToShow.length === 0) {
        console.log('🎲 Showing random offline users');
        // Shuffle and take random users (up to 10)
        usersToShow = [...offlineUsers]
          .sort(() => Math.random() - 0.5)
          .slice(0, 10);
      } else {
        // Limit to 10 users even if we found more
        usersToShow = usersToShow.slice(0, 10);
      }

      // Mark them as offline
      usersToShow = usersToShow.map((user: OnlineUser) => ({
        ...user,
        isOnline: false,
      }));

      console.log(`✅ Displaying ${usersToShow.length} users`);
      setDisplayedUsers(usersToShow);
      setShowingOfflineUsers(true);
      setLoading(false);
      setOfflineUsersFetched(true);
    } catch (error) {
      console.error('❌ Error fetching offline users:', error);
      setDisplayedUsers([]);
      setLoading(false);
      setOfflineUsersFetched(true);
    }
  };

  useEffect(() => {
    setLoading(false);
    
    // After 2 seconds, if still no online users, fetch offline users
    const timer = setTimeout(() => {
      if (onlineUsers.length === 0 && !offlineUsersFetched) {
        fetchOfflineUsers();
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Update displayed users when online users change
  useEffect(() => {
    if (onlineUsers.length > 0) {
      setDisplayedUsers(onlineUsers);
      setShowingOfflineUsers(false);
      setLoading(false);
      // Reset offline users fetched flag when online users come back
      setOfflineUsersFetched(false);
    }
  }, [onlineUsers]);

  // Listen for socket events for real-time status updates
  useEffect(() => {
    if (!socket) return;

    const handleUserOnline = (data: { userId: string; user: OnlineUser }) => {
      console.log('👤 User came online:', data);
      setOnlineUsers(prev => {
        const exists = prev.find(user => user.id === data.userId);
        if (exists) {
          // Update existing user status
          return prev.map(user => 
            user.id === data.userId 
              ? { ...user, onlineStatus: 'online', lastSeen: new Date() }
              : user
          );
        }
        return [...prev, { ...data.user, onlineStatus: 'online', lastSeen: new Date() }];
      });
    };

    const handleUserAway = (data: { userId: string }) => {
      console.log('👤 User went away:', data);
      setOnlineUsers(prev => 
        prev.map(user => 
          user.id === data.userId 
            ? { ...user, onlineStatus: 'away' }
            : user
        )
      );
    };

    const handleUserOffline = (data: { userId: string; lastSeen?: Date }) => {
      console.log('👤 User went offline:', data);
      setOnlineUsers(prev => 
        prev.map(user => 
          user.id === data.userId 
            ? { ...user, onlineStatus: 'offline', lastSeen: data.lastSeen || new Date() }
            : user
        )
      );
    };

    const handleOnlineUsers = (data: { users: OnlineUser[] }) => {
      console.log('👥 Online users list:', data);
      setOnlineUsers(data.users.filter(user => user.id !== currentUserId));
    };

    socket.on('user_online', handleUserOnline);
    socket.on('user_away', handleUserAway);
    socket.on('user_offline', handleUserOffline);
    socket.on('online_users', handleOnlineUsers);

    // Request current online users when component mounts
    socket.emit('get_online_users');

    return () => {
      socket.off('user_online', handleUserOnline);
      socket.off('user_away', handleUserAway);
      socket.off('user_offline', handleUserOffline);
      socket.off('online_users', handleOnlineUsers);
    };
  }, [socket, currentUserId]);

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

  const getStatusDisplay = (user: OnlineUser) => {
    const status = user.onlineStatus || 'offline';
    const lastSeen = user.lastSeen;
    
    switch (status) {
      case 'online':
        return { color: 'bg-green-500', icon: null };
      case 'away':
        return { color: 'bg-yellow-500', icon: null };
      case 'offline':
        return { color: 'bg-gray-400', icon: <Clock className="h-3 w-3 text-white absolute top-0 left-0" /> };
      default:
        return { color: 'bg-gray-400', icon: null };
    }
  };

  if (loading) {
    return (
      <div className="w-full -mx-4 px-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold text-lg">Users</h3>
            </div>
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (displayedUsers.length === 0) {
    return (
      <div className="w-full -mx-4 px-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-5 w-5 text-gray-600" />
              <h3 className="font-semibold text-lg">Users</h3>
            </div>
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No users available</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const titleText = showingOfflineUsers ? 'Suggested Users' : 'Users';
  const titleIcon = showingOfflineUsers ? 'text-blue-600' : 'text-green-600';
  const badgeColor = showingOfflineUsers ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800';

  return (
    <div className="w-full -mx-4 px-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Users className={`h-5 w-5 ${titleIcon}`} />
            <h3 className="font-semibold text-lg">{titleText}</h3>
            <Badge variant="secondary" className={badgeColor}>
              {displayedUsers.length}
            </Badge>
          </div>
          
          <ScrollArea className="w-full">
            <div className="flex gap-3 pb-2">
              {displayedUsers.map((user) => {
                const locationDisplay = getLocationDisplay(user.profile.location);
                const statusDisplay = getStatusDisplay(user);
                
                return (
                  <Card 
                    key={user.id} 
                    className="flex-shrink-0 w-[200px] hover:shadow-md transition-shadow cursor-pointer group"
                  >
                    <CardContent className="p-4">
                      <div className="flex flex-col items-center text-center space-y-3">
                        {/* Avatar with status indicator */}
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
                          {/* Status indicator */}
                          <div className={`absolute -bottom-1 -right-1 h-4 w-4 border-2 border-white rounded-full ${statusDisplay.color}`}>
                            {statusDisplay.icon}
                          </div>
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

                          {/* Status indicator - just the colored dot */}
                          <div className="flex items-center justify-center">
                            <div className={`w-2 h-2 rounded-full ${statusDisplay.color}`}></div>
                          </div>
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
          
          {displayedUsers.length > 5 && (
            <div className="mt-3 text-center">
              <p className="text-xs text-muted-foreground">
                Scroll horizontally to see more users
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
