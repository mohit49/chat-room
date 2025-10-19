'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Plus, Settings, Crown, Edit, Eye, Trash2, MoreVertical, Edit3, MessageCircle, Radio, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { APP_HEADER_CONFIGS } from '@/lib/config/app-header';
import AppHeader from '@/components/layout/AppHeader';
import CreateRoomModal from '@/components/room/CreateRoomModal';
import EditRoomModal from '@/components/room/EditRoomModal';
import RoomDetailsPopup from '@/components/room/RoomDetailsPopup';
import RoomMemberManager, { RoomMember } from '@/components/room/RoomMemberManager';
import RoomSettings from '@/components/room/RoomSettings';
import ChatWidget from '@/components/chat/ChatWidget';
import { VoiceBroadcastProvider } from '@/lib/contexts/VoiceBroadcastContext';
import { useSocket } from '@/lib/contexts/SocketContext';
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
  members: RoomMember[];
  createdBy: string;
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

export default function RoomsPage() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRoomDetails, setShowRoomDetails] = useState(false);
  const [showRoomDetailsPopup, setShowRoomDetailsPopup] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatRoom, setChatRoom] = useState<Room | null>(null);
  const [joinRoomCode, setJoinRoomCode] = useState('');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [activeBroadcasts, setActiveBroadcasts] = useState<Map<string, BroadcastState>>(new Map());

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
      if (response.success) {
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

  const handleJoinRoom = async () => {
    // TODO: Implement join room by code functionality
    alert('Join room functionality will be implemented soon');
    setShowJoinModal(false);
  };

  const handleRoomClick = async (room: Room) => {
    try {
      const response = await api.getRoomById(room.id) as any;
      if (response.success) {
        setSelectedRoom(response.room);
        setShowRoomDetails(true);
      }
    } catch (error) {
      console.error('Error fetching room details:', error);
    }
  };

  const handleEditRoom = (room: Room) => {
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

  const handleManageRoom = (room: Room) => {
    setSelectedRoom(room);
    setShowRoomDetailsPopup(true);
  };

  const handleChatNow = (room: Room) => {
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

  const handleUpdateRoom = async (updates: {
    name?: string;
    description?: string;
    profilePicture?: {
      type: 'upload' | 'avatar';
      url?: string;
      avatarStyle?: string;
      seed?: string;
    };
  }) => {
    if (!selectedRoom) return;

    try {
      const response = await api.updateRoom(selectedRoom.id, updates) as any;
      if (response.success) {
        setSelectedRoom(response.room);
        setRooms(prev => prev.map(room => 
          room.id === selectedRoom.id ? response.room : room
        ));
      }
    } catch (error) {
      console.error('Error updating room:', error);
    }
  };

  const handleAddMember = async (mobileNumber: string) => {
    if (!selectedRoom) return;

    try {
      const response = await api.addMember(selectedRoom.id, mobileNumber) as any;
      if (response.success) {
        setSelectedRoom(response.room);
      }
    } catch (error: any) {
      alert(error.message || 'Failed to add member');
    }
  };

  const handleChangeMemberRole = async (memberId: string, newRole: 'admin' | 'editor' | 'viewer') => {
    if (!selectedRoom) return;

    try {
      const response = await api.changeMemberRole(selectedRoom.id, memberId, newRole) as any;
      if (response.success) {
        setSelectedRoom(response.room);
      }
    } catch (error: any) {
      alert(error.message || 'Failed to change member role');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!selectedRoom) return;

    try {
      const response = await api.removeMember(selectedRoom.id, memberId) as any;
      if (response.success) {
        setSelectedRoom(response.room);
      }
    } catch (error: any) {
      alert(error.message || 'Failed to remove member');
    }
  };

  const getCurrentUserRole = (room: Room): 'admin' | 'editor' | 'viewer' | null => {
    if (!user) return null;
    const member = room.members.find(m => m.userId === user.id);
    return member ? member.role : null;
  };

  const getRoleIcon = (role: 'admin' | 'editor' | 'viewer') => {
    switch (role) {
      case 'admin':
        return <Crown className="h-3 w-3" />;
      case 'editor':
        return <Edit className="h-3 w-3" />;
      case 'viewer':
        return <Eye className="h-3 w-3" />;
    }
  };

  const getRoleColor = (role: 'admin' | 'editor' | 'viewer') => {
    switch (role) {
      case 'admin':
        return 'default';
      case 'editor':
        return 'secondary';
      case 'viewer':
        return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-4 lg:py-8">
      <div className="max-w-6xl mx-auto px-4 space-y-6">
        <AppHeader 
          {...APP_HEADER_CONFIGS.rooms}
          onCreateRoom={() => setShowCreateModal(true)}
        />

        {/* Rooms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => {
            const userRole = getCurrentUserRole(room);
            const broadcastState = activeBroadcasts.get(room.id);
            const isBroadcasting = !!broadcastState;
            
            return (
              <Card 
                key={room.id} 
                className={`hover:shadow-lg transition-shadow cursor-pointer relative ${isBroadcasting ? 'ring-2 ring-green-500' : ''}`}
                onClick={() => handleRoomClick(room)}
              >
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
                <div className="absolute top-2 right-2 z-10" onClick={(e) => e.stopPropagation()}>
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
                      <DropdownMenuItem onClick={() => handleManageRoom(room)}>
                        <Users className="mr-2 h-4 w-4" />
                        Manage Room
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage
                        src={
                          room.profilePicture?.type === 'upload'
                            ? room.profilePicture.url
                            : room.profilePicture?.type === 'avatar'
                            ? `https://api.dicebear.com/7.x/${room.profilePicture.avatarStyle?.toLowerCase().replace(/\s+/g, '-')}/svg?seed=${room.profilePicture.seed || room.name}`
                            : undefined
                        }
                      />
                      <AvatarFallback>
                        {room.profilePicture?.type === 'avatar'
                          ? '🎭'
                          : room.name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{room.name}</CardTitle>
                      {room.description && (
                        <CardDescription>{room.description}</CardDescription>
                      )}
                    </div>
                    {userRole && (
                      <Badge variant={getRoleColor(userRole)} className="text-xs">
                        {getRoleIcon(userRole)}
                        <span className="ml-1 capitalize">{userRole}</span>
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                    <span>{room.members.length} members</span>
                    <span>{new Date(room.updatedAt).toLocaleDateString()}</span>
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
                    onClick={(e) => {
                      e.stopPropagation();
                      handleChatNow(room);
                    }}
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

        {rooms.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No rooms yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create your first room to start chatting with others
              </p>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Room
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Create Room Modal */}
        <CreateRoomModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreateRoom={handleCreateRoom}
        />

        {/* Edit Room Modal */}
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

        {/* Room Details Popup */}
        <RoomDetailsPopup
          isOpen={showRoomDetailsPopup}
          onClose={() => {
            setShowRoomDetailsPopup(false);
            setSelectedRoom(null);
          }}
          room={selectedRoom}
          currentUserId={user?.id || ''}
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

        {/* Join Room Modal */}
        <Dialog open={showJoinModal} onOpenChange={setShowJoinModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Join Room</DialogTitle>
              <DialogDescription>
                Enter a room code to join an existing room
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="roomCode">Room Code</Label>
                <Input
                  id="roomCode"
                  placeholder="Enter room code"
                  value={joinRoomCode}
                  onChange={(e) => setJoinRoomCode(e.target.value)}
                />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowJoinModal(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleJoinRoom} className="flex-1">
                  Join Room
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Room Details Modal */}
        {selectedRoom && (
          <Dialog open={showRoomDetails} onOpenChange={setShowRoomDetails}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {selectedRoom.name}
                </DialogTitle>
                <DialogDescription>
                  {selectedRoom.description || 'Room management and settings'}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Room Settings */}
                <RoomSettings
                  roomName={selectedRoom.name}
                  roomDescription={selectedRoom.description}
                  roomProfilePicture={selectedRoom.profilePicture}
                  onUpdateRoom={handleUpdateRoom}
                  canEdit={getCurrentUserRole(selectedRoom) === 'admin'}
                />

                {/* Member Management */}
                <RoomMemberManager
                  members={selectedRoom.members}
                  currentUserRole={getCurrentUserRole(selectedRoom) || 'viewer'}
                  currentUserId={user?.id || ''}
                  onAddMember={handleAddMember}
                  onRemoveMember={handleRemoveMember}
                  onChangeRole={handleChangeMemberRole}
                />
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
