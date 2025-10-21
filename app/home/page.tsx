'use client';

import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MapPin, Calendar, User, Users, Settings, Edit3, Bell, MessageCircle, Radio, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { APP_HEADER_CONFIGS } from '@/lib/config/app-header';
import AppHeader from '@/components/layout/AppHeader';
import CreateRoomModal from '@/components/room/CreateRoomModal';
import EditRoomModal from '@/components/room/EditRoomModal';
import ChatWidget from '@/components/chat/ChatWidget';
import DirectMessageWidget from '@/components/chat/DirectMessageWidget';
import { VoiceBroadcastProvider } from '@/lib/contexts/VoiceBroadcastContext';
import { useSocket } from '@/lib/contexts/SocketContext';
import ProfileCompletionBanner from '@/components/profile/ProfileCompletionBanner';
import ProfileCompletionGuard from '@/components/profile/ProfileCompletionGuard';
import { useProfileCompletion } from '@/hooks/useProfileCompletion';
import OnlineUsersCarousel from '@/components/layout/OnlineUsersCarousel';
import { api } from '@/lib/api';

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
  const { user, logout } = useAuth();
  const { socket } = useSocket();
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

  useEffect(() => {
    if (user) {
      fetchRooms();
    }
  }, [user]);

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
    setActiveBroadcasts(prev => {
      const newMap = new Map(prev);
      const current = newMap.get(roomId);
      
      if (current) {
        const newListeningState = !current.isListening;
        
        // If starting to listen to this room
        if (newListeningState) {
          console.log('🎧 Starting to listen to room:', roomId);
          
          // Stop all other broadcasts
          newMap.forEach((broadcast, otherRoomId) => {
            if (otherRoomId !== roomId && broadcast.isListening) {
              console.log('⏹️ Stopping broadcast from room:', otherRoomId);
              newMap.set(otherRoomId, { ...broadcast, isListening: false });
            }
          });
        }
        
        newMap.set(roomId, { ...current, isListening: newListeningState });
      }
      return newMap;
    });
  };

  const toggleBroadcastMute = (roomId: string) => {
    setActiveBroadcasts(prev => {
      const newMap = new Map(prev);
      const current = newMap.get(roomId);
      if (current) {
        newMap.set(roomId, { ...current, isMuted: !current.isMuted });
      }
      return newMap;
    });
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
            <CardTitle className="flex items-center gap-3">
              <User className="h-5 w-5" />
              Profile Summary
            </CardTitle>
            <CardDescription>
              Your complete profile information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-6 mt-3">
              <Avatar className="h-20 w-20">
                <AvatarImage 
                  src={
                    user.profile.profilePicture?.type === 'upload' 
                      ? user.profile.profilePicture.url 
                      : user.profile.profilePicture?.type === 'avatar'
                      ? `https://api.dicebear.com/7.x/${user.profile.profilePicture.avatarStyle?.toLowerCase().replace(/\s+/g, '-')}/svg?seed=${user.profile.profilePicture.seed || user.mobileNumber}`
                      : undefined
                  }
                />
                <AvatarFallback className="text-lg bg-primary text-primary-foreground">
                  {user.profile.profilePicture?.type === 'avatar' 
                    ? '🎭' 
                    : user.username?.charAt(0).toUpperCase() || user.mobileNumber?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">@{user.username}</Badge>
                  <Badge variant="outline">{user.profile.gender}</Badge>
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
          </CardContent>
        </Card>

        {/* Online Users Carousel */}
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

        {/* My Rooms Section */}
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

                  return (
                  <Card key={room.id} className={`hover:shadow-md transition-shadow relative flex-shrink-0 w-[300px] snap-start ${isBroadcasting ? 'ring-2 ring-green-500' : ''}`}>
                    {/* Broadcasting Badge - Top left */}
                    {isBroadcasting && (
                      <div className="absolute top-2 left-2 z-10">
                        <Badge className="bg-green-500 hover:bg-green-600 animate-pulse">
                          <Radio className="h-3 w-3 mr-1" />
                          Live
                        </Badge>
                      </div>
                    )}

                    {/* Settings Icon - Positioned at top-right corner */}
                    <div className="absolute top-2 right-2 z-10">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-accent">
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

                    <CardHeader className="pb-0">
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
                    <CardContent className="pt-3 px-3">
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

                      {/* Broadcasting Controls */}
                      {isBroadcasting && broadcastState && (
                        <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-green-800 truncate">
                                🎙️ {broadcastState.broadcasterId === user?.id ? 'You are' : broadcastState.broadcasterName + ' is'} broadcasting
                              </p>
                            </div>
                            {broadcastState.broadcasterId !== user?.id && (
                              <div className="flex items-center gap-1 ml-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleBroadcastListen(room.id);
                                  }}
                                  className="h-7 w-7 p-0 text-green-700 hover:bg-green-100"
                                  title={broadcastState.isListening ? "Pause" : "Play"}
                                >
                                  {broadcastState.isListening ? (
                                    <Pause className="h-3 w-3" />
                                  ) : (
                                    <Play className="h-3 w-3 ml-0.5" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleBroadcastMute(room.id);
                                  }}
                                  className="h-7 w-7 p-0 text-green-700 hover:bg-green-100"
                                  title={broadcastState.isMuted ? "Unmute" : "Mute"}
                                >
                                  {broadcastState.isMuted ? (
                                    <VolumeX className="h-3 w-3" />
                                  ) : (
                                    <Volume2 className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

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

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="text-lg">Edit Profile</CardTitle>
              <CardDescription>
                Update your personal information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => router.push('/profile')} 
                className="w-full"
                variant="outline"
              >
                Go to Profile
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="text-lg">Update Location</CardTitle>
              <CardDescription>
                Share your current location
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => router.push('/profile')} 
                className="w-full"
                variant="outline"
              >
                Update Location
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="text-lg">Settings</CardTitle>
              <CardDescription>
                Manage your account settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => router.push('/profile')} 
                className="w-full"
                variant="outline"
              >
                Settings
              </Button>
            </CardContent>
          </Card>
        </div>

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
        </div>
      </div>
    </div>
  );
}
