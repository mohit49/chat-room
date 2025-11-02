'use client';

import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MapPin, Calendar, User, Users, Settings, Edit3, Bell, MessageCircle, Radio, Play, Pause, Volume2, VolumeX, Square, UserPlus, Zap, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { APP_HEADER_CONFIGS } from '@/lib/config/app-header';
import AppHeader from '@/components/layout/AppHeader';
import CreateRoomModal from '@/components/room/CreateRoomModal';
import EditRoomModal from '@/components/room/EditRoomModal';
import ChatWidget from '@/components/chat/ChatWidget';
import DirectMessageWidget from '@/components/chat/DirectMessageWidget';
import { VoiceBroadcastProvider } from '@/lib/contexts/VoiceBroadcastContext';
import { useBroadcast } from '@/lib/contexts/BroadcastContext';
import { useSocket } from '@/lib/contexts/SocketContext';
import ProfileCompletionBanner from '@/components/profile/ProfileCompletionBanner';
import ProfileCompletionGuard from '@/components/profile/ProfileCompletionGuard';
import { useProfileCompletion } from '@/hooks/useProfileCompletion';
import EmailVerificationGuard from '@/components/auth/EmailVerificationGuard';
import OnlineUsersCarousel from '@/components/layout/OnlineUsersCarousel';
import { FollowListDialog } from '@/components/user/FollowListDialog';
import { getFollowCounts } from '@/lib/api/follow';
import { api } from '@/lib/api';
import { BannerCarousel } from '@/components/home/BannerCarousel';
import BroadcastCard from '@/components/home/BroadcastCard';
import InstantChatSection from '@/components/home/InstantChatSection';
import InstantChatDialog from '@/components/home/InstantChatDialog';
import { EmailVerificationBanner } from '@/components/auth/EmailVerificationBanner';

interface Room {
  id: string;
  roomId: string;
  name: string;
  description?: string;
  profilePicture?: {
    type: 'upload' | 'avatar';
    url?: string;
    avatarStyle?: string;
    seed?: string;
  };
  members: Array<{
    userId: string;
    role: 'admin' | 'editor' | 'viewer';
  }>;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

interface BroadcastState {
  roomId: string;
  broadcasterName: string;
  broadcasterId: string;
  isListening: boolean;
  isMuted: boolean;
}

export default function HomePage() {
  const { user, logout, emailVerified } = useAuth();
  const { socket } = useSocket();
  const { activeBroadcast, isListening, isMuted, toggleListen, toggleMute, startBroadcast: globalStartBroadcast, stopBroadcast } = useBroadcast();
  const router = useRouter();
  const { isComplete, missingFields } = useProfileCompletion();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatRoom, setChatRoom] = useState<Room | null>(null);
  const [activeBroadcasts, setActiveBroadcasts] = useState<Map<string, BroadcastState>>(new Map());
  const [isDirectMessageOpen, setIsDirectMessageOpen] = useState(false);
  const [directMessageUser, setDirectMessageUser] = useState<{ id: string; username: string; profilePicture?: any } | null>(null);
  const [followCounts, setFollowCounts] = useState({ followers: 0, following: 0 });
  const [showInstantChatDialog, setShowInstantChatDialog] = useState(false);

  // Generate a unique gradient for each room based on room ID
  const getGradientForRoom = (roomId: string) => {
    const gradients = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', // Purple
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', // Pink-Red
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', // Blue
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', // Green-Cyan
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', // Pink-Yellow
      'linear-gradient(135deg, #30cfd0 0%, #330867 100%)', // Cyan-Purple
      'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', // Soft pastels
      'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)', // Soft pink
      'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)', // Peach
      'linear-gradient(135deg, #ff6e7f 0%, #bfe9ff 100%)', // Coral-Blue
      'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)', // Lavender-Blue
      'linear-gradient(135deg, #f8b195 0%, #f67280 100%)', // Coral-Rose
    ];

    // Use room ID to consistently pick the same gradient
    const hash = roomId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return gradients[hash % gradients.length];
  };

  // Generate random dark gradients for action buttons
  const getRandomDarkGradient = (index: number) => {
    const darkGradients = [
      'from-purple-900 via-purple-800 to-red-900 hover:from-purple-800 hover:via-purple-700 hover:to-red-800',
      'from-slate-900 via-blue-900 to-teal-900 hover:from-slate-800 hover:via-blue-800 hover:to-teal-800',
      'from-emerald-900 via-green-800 to-orange-900 hover:from-emerald-800 hover:via-green-700 hover:to-orange-800',
      'from-indigo-900 via-purple-900 to-pink-900 hover:from-indigo-800 hover:via-purple-800 hover:to-pink-800',
      'from-gray-900 via-slate-800 to-zinc-900 hover:from-gray-800 hover:via-slate-700 hover:to-zinc-800',
      'from-red-900 via-rose-800 to-pink-900 hover:from-red-800 hover:via-rose-700 hover:to-pink-800',
      'from-cyan-900 via-teal-800 to-blue-900 hover:from-cyan-800 hover:via-teal-700 hover:to-blue-800',
      'from-amber-900 via-orange-800 to-red-900 hover:from-amber-800 hover:via-orange-700 hover:to-red-800',
      'from-violet-900 via-fuchsia-800 to-purple-900 hover:from-violet-800 hover:via-fuchsia-700 hover:to-purple-800'
    ];
    
    // Use index + current time to get different gradients each time
    const randomIndex = (index + Math.floor(Date.now() / 10000)) % darkGradients.length;
    return darkGradients[randomIndex];
  };

  useEffect(() => {
    if (user) {
      fetchRooms();
      fetchFollowCounts();
    }
  }, [user]);

  const fetchFollowCounts = async () => {
    if (!user?.id) return;
    try {
      const counts = await getFollowCounts(user.id);
      setFollowCounts(counts);
    } catch (error) {
      console.error('Error fetching follow counts:', error);
    }
  };

  // Listen for broadcast events
  useEffect(() => {
    if (!socket) return;

    socket.on('voice_broadcast_started', (data: { userId: string; username: string; roomId: string }) => {
      console.log('📻 Broadcast started in room:', data);
      setActiveBroadcasts(prev => {
        const newMap = new Map(prev);
        newMap.set(data.roomId, {
          roomId: data.roomId,
          broadcasterName: data.username,
          broadcasterId: data.userId,
          isListening: false, // Default to paused - user must click Play
          isMuted: false
        });
        return newMap;
      });
    });

    socket.on('voice_broadcast_stopped', (data: { userId: string; roomId: string }) => {
      console.log('📻 Broadcast stopped in room:', data.roomId);
      setActiveBroadcasts(prev => {
        const newMap = new Map(prev);
        newMap.delete(data.roomId);
        return newMap;
      });
    });

    return () => {
      socket.off('voice_broadcast_started');
      socket.off('voice_broadcast_stopped');
    };
  }, [socket]);

  const fetchRooms = async () => {
    try {
      const response = await api.getRooms() as any;
      console.log('fetchRooms - API response:', response);
      if (response.success) {
        console.log('fetchRooms - rooms received:', response.rooms);
        console.log('fetchRooms - first room structure:', response.rooms[0]);
        setRooms(response.rooms);
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async (roomData: {
    name: string;
    description?: string;
    profilePicture?: {
      type: 'upload' | 'avatar';
      url?: string;
      avatarStyle?: string;
      seed?: string;
    };
  }) => {
    try {
      const response = await api.createRoom(roomData) as any;
      if (response.success) {
        setRooms(prev => [response.room, ...prev]);
        setShowCreateModal(false);
      }
    } catch (error) {
      console.error('Error creating room:', error);
    }
  };

  const handleEditRoom = (room: Room) => {
    console.log('Room object for editing:', room);
    console.log('Room ID:', room.id);
    console.log('Room RoomId:', room.roomId);
    setSelectedRoom(room);
    setShowEditModal(true);
  };

  const handleRoomUpdated = (updatedRoom: Room) => {
    setRooms(prev => prev.map(room => 
      room.id === updatedRoom.id ? updatedRoom : room
    ));
    setShowEditModal(false);
    setSelectedRoom(null);
  };

  const handleChatNow = (room: Room) => {
    // Check if profile is complete
    if (!isComplete) {
      router.push('/profile');
      return;
    }
    
    setChatRoom(room);
    setIsChatOpen(true);
  };

  const toggleBroadcastListen = (roomId: string) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;

    // Check if listening to this room already
    const isListeningToThisRoom = activeBroadcast?.roomId === roomId && isListening;

    if (isListeningToThisRoom) {
      // Stop listening
      toggleListen();
    } else {
      // Start listening - enable listening and it will auto-connect to broadcast
      if (!isListening || activeBroadcast?.roomId !== roomId) {
        toggleListen();
      }
    }
  };

  const toggleBroadcastMute = (roomId: string) => {
    // Use global mute toggle
    toggleMute();
  };

  const getCurrentUserRole = (room: Room): 'admin' | 'editor' | 'viewer' | null => {
    if (!user) return null;
    const member = room.members.find(m => m.userId === user.id);
    return member ? member.role : null;
  };


  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Email Verification Banner - Shows first if email not verified */}
      <div className="max-w-3xl mx-auto px-4 pt-4">
        <EmailVerificationBanner />
      </div>
      
      {/* Profile Completion Banner */}
      <ProfileCompletionBanner isComplete={isComplete} missingFields={missingFields} />
      
      <div className="py-4 lg:py-8">
        <div className="max-w-3xl mx-auto px-4 space-y-6">
          {/* Header */}
          <AppHeader 
            {...APP_HEADER_CONFIGS.home}
            onCreateRoom={() => setShowCreateModal(true)}
          />

        {/* Profile Summary Card */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-3">
                  <User className="h-5 w-5" />
                  Profile Summary
                </CardTitle>
                <CardDescription className="mt-1.5">
                  Your complete profile information
                </CardDescription>
              </div>
              
              {/* Action Buttons - Top Right Corner */}
              <div className="flex flex-wrap gap-2">
                <Button 
                  onClick={() => router.push('/profile')} 
                  variant="outline"
                  size="sm"
                >
                  <Edit3 className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Edit Profile</span>
                </Button>
                <Button 
                  onClick={() => router.push('/profile')} 
                  variant="outline"
                  size="sm"
                >
                  <MapPin className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Update Location</span>
                </Button>
                <Button 
                  onClick={() => router.push('/profile')} 
                  variant="outline"
                  size="sm"
                >
                  <Settings className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Settings</span>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-6 mt-3">
              <Avatar className="h-20 w-20">
                <AvatarImage 
                  src={
                    user.profile.profilePicture?.type === 'upload' 
                      ? user.profile.profilePicture.url 
                      : user.profile.profilePicture?.type === 'avatar'
                      ? `https://api.dicebear.com/7.x/${user.profile.profilePicture.avatarStyle?.toLowerCase().replace(/\s+/g, '-')}/svg?seed=${user.profile.profilePicture.seed || user.email}`
                      : undefined
                  }
                />
                <AvatarFallback className="text-lg bg-primary text-primary-foreground">
                  {user.profile.profilePicture?.type === 'avatar' 
                    ? '🎭' 
                    : user.username?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">@{user.username}</Badge>
                  <Badge variant="outline">{user.profile.gender}</Badge>
                </div>
                
                {/* Followers/Following Display - Hidden on mobile, shown inline on desktop */}
                <div className="hidden sm:flex items-center gap-2">
                  <FollowListDialog
                    userId={user.id}
                    followerCount={followCounts.followers}
                    followingCount={followCounts.following}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>Age: {user.profile.age} years</span>
                  </div>
                  
                  {user.profile.location.isVisible !== false && (user.profile.location.city || user.profile.location.state) && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span>
                        {user.profile.location.city && user.profile.location.state
                          ? `${user.profile.location.city}, ${user.profile.location.state}`
                          : user.profile.location.city || user.profile.location.state}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Followers/Following Display - Bottom on mobile only */}
            <div className="sm:hidden mt-4 pt-4 border-t flex justify-center">
              <FollowListDialog
                userId={user.id}
                followerCount={followCounts.followers}
                followingCount={followCounts.following}
              />
            </div>

            {/* Action Buttons with Silent Email Verification */}
            <EmailVerificationGuard 
              feature="chat features"
              silentRestriction={true}
            >
              <div className="mt-6 pt-4 border-t">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Connect with Stranger Button */}
                  <Button 
                    onClick={() => router.push('/random-connect')}
                    className={`relative overflow-hidden bg-gradient-to-br ${getRandomDarkGradient(0)} text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 group`}
                    size="lg"
                  >
                    <div className="flex items-center gap-2 relative z-10">
                      <UserPlus className="h-5 w-5" />
                      <span className="font-semibold">Connect with Stranger</span>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  </Button>

                  {/* Chat Instantly Button */}
                  <Button 
                    onClick={() => setShowInstantChatDialog(true)}
                    className={`relative overflow-hidden bg-gradient-to-br ${getRandomDarkGradient(1)} text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 group`}
                    size="lg"
                  >
                    <div className="flex items-center gap-2 relative z-10">
                      <Zap className="h-5 w-5" />
                      <span className="font-semibold">Chat Instantly</span>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  </Button>

                  {/* Create Chat Room Button */}
                  <Button 
                    onClick={() => setShowCreateModal(true)}
                    className={`relative overflow-hidden bg-gradient-to-br ${getRandomDarkGradient(2)} text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 group`}
                    size="lg"
                  >
                    <div className="flex items-center gap-2 relative z-10">
                      <Plus className="h-5 w-5" />
                      <span className="font-semibold">Create Chat Room</span>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  </Button>
                </div>
              </div>
            </EmailVerificationGuard>
          </CardContent>
        </Card>

        {/* Banner Carousel */}
        <EmailVerificationGuard feature="interactive features" silentRestriction={true}>
          <BannerCarousel 
            onCreateRoom={() => setShowCreateModal(true)}
            onExploreRooms={() => router.push('/rooms')}
            onViewNotifications={() => router.push('/notifications')}
            onRandomConnect={() => router.push('/random-connect')}
            onInstantChat={() => setShowInstantChatDialog(true)}
          />
        </EmailVerificationGuard>

        {/* Online Users Carousel */}
        <div className="px-0">
          <EmailVerificationGuard feature="messaging" silentRestriction={true}>
            <OnlineUsersCarousel 
              currentUserId={user.id}
              onMessageUser={(userId, username) => {
                setDirectMessageUser({
                  id: userId,
                  username: username,
                  profilePicture: undefined // Will be fetched when needed
                });
                setIsDirectMessageOpen(true);
              }}
            />
          </EmailVerificationGuard>
        </div>

        {/* Voice Broadcast Card */}
        <EmailVerificationGuard feature="voice broadcasting" silentRestriction={true}>
          <ProfileCompletionGuard 
            isComplete={isComplete} 
            missingFields={missingFields}
            featureName="voice broadcasting"
          >
            <BroadcastCard />
          </ProfileCompletionGuard>
        </EmailVerificationGuard>

        {/* Instant Chat Section */}
        <EmailVerificationGuard feature="instant chat" silentRestriction={true}>
          <ProfileCompletionGuard 
            isComplete={isComplete} 
            missingFields={missingFields}
            featureName="instant chat"
          >
            <InstantChatSection />
          </ProfileCompletionGuard>
        </EmailVerificationGuard>

        {/* My Rooms Section */}
        <EmailVerificationGuard feature="chat rooms and messaging" silentRestriction={true}>
          <ProfileCompletionGuard 
            isComplete={isComplete} 
            missingFields={missingFields}
            featureName="chat rooms and messaging"
          >
          <Card>
            <CardHeader className='mb-3'>
              <CardTitle className="flex items-center gap-3">
                <Users className="h-5 w-5" />
                My Rooms
              </CardTitle>
              <CardDescription>
                Manage your chat rooms and collaborate with others
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-2 text-sm text-muted-foreground">
                  Loading rooms...
                </span>
              </div>
            ) : rooms.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Rooms Yet</h3>
                <p className="text-muted-foreground mb-4">
                  You haven't created or joined any rooms yet. Start by creating one!
                </p>
                <Button onClick={() => setShowCreateModal(true)}>
                  Create Your First Room
                </Button>
              </div>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-thin">
                {rooms.map(room => {
                  const broadcastState = activeBroadcasts.get(room.id);
                  const isBroadcasting = !!broadcastState;
                  // Check if this room is the active broadcast
                  const isActiveGlobalBroadcast = activeBroadcast?.roomId === room.id;
                  // Use global state for listening/muting
                  const isListeningToThis = isActiveGlobalBroadcast && isListening;
                  const isMutedThis = isActiveGlobalBroadcast && isMuted;

                  return (
                  <Card 
                    key={room.id} 
                    className="hover:shadow-md transition-shadow relative flex-shrink-0 w-[300px] snap-start"
                  >
                    {/* Top right corner - Green dot, Play/Stop button, Settings */}
                    <div className="absolute top-2 right-2 z-50 flex items-center gap-2">
                      {(isBroadcasting || isActiveGlobalBroadcast) && (
                        <>
                          {/* Green dot indicator */}
                          <div className="relative flex items-center justify-center">
                            <span className="flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                            </span>
                          </div>
                          
                          {/* Play/Pause button for listeners OR Stop button for broadcaster */}
                          {(broadcastState?.broadcasterId === user?.id || activeBroadcast?.userId === user?.id) ? (
                            // Stop button for broadcaster
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                stopBroadcast();
                              }}
                              className="h-8 w-8 p-0 hover:bg-red-500/10 relative z-50"
                              title="Stop Broadcasting"
                            >
                              <Square className="h-4 w-4 text-red-600 fill-current" />
                            </Button>
                          ) : (
                            // Play/Pause button for listeners
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleBroadcastListen(room.id);
                              }}
                              className="h-8 w-8 p-0 hover:bg-accent relative z-50"
                              title={isListeningToThis ? "Pause" : "Play"}
                            >
                              {isListeningToThis ? (
                                <Pause className="h-4 w-4 text-green-600" />
                              ) : (
                                <Play className="h-4 w-4 text-green-600" />
                              )}
                            </Button>
                          )}
                        </>
                      )}
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-accent relative z-50">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditRoom(room)}>
                            <Edit3 className="mr-2 h-4 w-4" />
                            Edit Room
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/rooms/${room.id}`)}>
                            <Users className="mr-2 h-4 w-4" />
                            Manage Room
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <CardHeader className="pb-0 relative z-10">
                      <div className="flex items-center gap-3">
                        {room.profilePicture?.type === 'upload' && room.profilePicture.url ? (
                          <img 
                            src={room.profilePicture.url} 
                            alt="Room Profile" 
                            className="h-10 w-10 rounded-full object-cover" 
                          />
                        ) : room.profilePicture?.type === 'avatar' ? (
                          <img 
                            src={`https://api.dicebear.com/7.x/${room.profilePicture.avatarStyle?.toLowerCase().replace(/\s+/g, '-')}/svg?seed=${room.profilePicture.seed || room.id}`} 
                            alt="Room Avatar" 
                            className="h-10 w-10 rounded-full object-cover" 
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-lg font-bold">
                            {room.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <h3 className="font-semibold">{room.name}</h3>
                          <p className="text-sm text-muted-foreground">{room.roomId}</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-3 px-3 relative z-10">
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {room.description || 'No description provided.'}
                      </p>
                      <div className="flex items-center justify-between text-sm mb-3">
                        <span className="text-muted-foreground">
                          {room.members.length} member{room.members.length !== 1 ? 's' : ''}
                        </span>
                        <Badge variant={getCurrentUserRole(room) === 'admin' ? 'default' : 'secondary'}>
                          {getCurrentUserRole(room)}
                        </Badge>
                      </div>

                      <Button 
                        onClick={() => handleChatNow(room)}
                        className="w-full"
                        size="sm"
                      >
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Chat Now
                      </Button>
                    </CardContent>
                  </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
        </ProfileCompletionGuard>
        </EmailVerificationGuard>

        {/* Welcome Message */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                🎉 Congratulations!
              </h3>
              <p className="text-gray-600">
                Your profile is complete and you're all set to use our platform. 
                You can now access all features and connect with others.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Modals */}
        <CreateRoomModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreateRoom={handleCreateRoom}
        />

        <EditRoomModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedRoom(null);
          }}
          onRoomUpdated={handleRoomUpdated}
          room={selectedRoom}
          currentUserRole={selectedRoom ? getCurrentUserRole(selectedRoom) : null}
        />

        {/* Chat Widget */}
        {chatRoom && (
          <VoiceBroadcastProvider roomId={chatRoom.id} userRole={getCurrentUserRole(chatRoom)}>
            <ChatWidget
              roomId={chatRoom.id}
              roomName={chatRoom.name}
              isOpen={isChatOpen}
              onClose={() => {
                setIsChatOpen(false);
                setChatRoom(null);
              }}
              userRole={chatRoom ? getCurrentUserRole(chatRoom) : null}
            />
          </VoiceBroadcastProvider>
        )}

        {/* Direct Message Widget */}
        {directMessageUser && (
          <DirectMessageWidget
            isOpen={isDirectMessageOpen}
            onClose={() => {
              setIsDirectMessageOpen(false);
              setDirectMessageUser(null);
            }}
            targetUser={directMessageUser}
          />
        )}

        {/* Instant Chat Dialog */}
        <InstantChatDialog
          isOpen={showInstantChatDialog}
          onClose={() => setShowInstantChatDialog(false)}
        />
        </div>
      </div>
    </div>
  );
}
