'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { APP_HEADER_CONFIGS } from '@/lib/config/app-header';
import AppHeader from '@/components/layout/AppHeader';
import { api } from '@/lib/api';
import { Users, UserPlus, Trash2, Shield, Edit, Eye, AlertTriangle, Check, X, MessageCircle } from 'lucide-react';
import ChatWidget from '@/components/chat/ChatWidget';
import { VoiceBroadcastProvider } from '@/lib/contexts/VoiceBroadcastContext';

interface RoomMember {
  userId: string;
  username?: string;
  mobileNumber: string;
  role: 'admin' | 'editor' | 'viewer';
  status: 'active' | 'pending';
  joinedAt: string;
  profilePicture?: {
    type: 'upload' | 'avatar';
    url?: string;
    avatarStyle?: string;
    seed?: string;
  };
}

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
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export default function ManageRoomPage() {
  const router = useRouter();
  const params = useParams();
  const roomId = params.id as string;
  const { user, loading: authLoading } = useAuth();
  
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [newMemberUsername, setNewMemberUsername] = useState('');
  const [addingMember, setAddingMember] = useState(false);
  const [pendingInvitations, setPendingInvitations] = useState<any[]>([]);
  const [userPendingInvitation, setUserPendingInvitation] = useState<any>(null);
  
  // Confirmation dialogs
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<RoomMember | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingRoom, setDeletingRoom] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const getCurrentUserRole = (): 'admin' | 'editor' | 'viewer' | null => {
    if (!user || !room) return null;
    const member = room.members.find(m => m.userId === user.id);
    return member ? member.role : null;
  };

  useEffect(() => {
    if (user && roomId) {
      fetchRoom();
    }
  }, [user, roomId]);

  useEffect(() => {
    if (user && roomId && room && getCurrentUserRole() === 'admin') {
      fetchPendingInvitations();
    }
  }, [user, roomId, room]);

  useEffect(() => {
    if (user && roomId && room) {
      checkUserPendingInvitation();
    }
  }, [user, roomId, room]);

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
      //  router.push('/home');
      }
    } catch (error) {
      console.error('❌ Error fetching room:', error);
      alert('Failed to load room');
      //router.push('/home');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingInvitations = async () => {
    try {
      const response = await api.getPendingInvitations(roomId) as any;
      if (response.success) {
        setPendingInvitations(response.pendingInvitations);
      }
    } catch (error) {
      console.error('Error fetching pending invitations:', error);
    }
  };

  const checkUserPendingInvitation = async () => {
    try {
      // Check if user has pending status in the room
      if (room && user) {
        const userMember = room.members.find(member => member.userId === user.id);
        if (userMember && userMember.status === 'pending') {
          setUserPendingInvitation({
            id: 'pending',
            roomId: room.id,
            createdAt: userMember.joinedAt
          });
        } else {
          setUserPendingInvitation(null);
        }
      }
    } catch (error) {
      console.error('Error checking user pending invitation:', error);
    }
  };

  const isAdmin = getCurrentUserRole() === 'admin';
  const userRole = getCurrentUserRole();
  const userMember = room ? room.members.find(member => member.userId === user?.id) : null;
  const isUserPending = userMember && userMember.status === 'pending';

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!room || !newMemberUsername.trim()) return;

    setAddingMember(true);
    try {
      const response = await api.addMember(room.id, newMemberUsername) as any;
      if (response.success) {
        setRoom(response.room);
        setNewMemberUsername('');
        alert('Member added successfully!');
      } else {
        alert(response.error || 'Failed to add member');
      }
    } catch (error: any) {
      alert(error.message || 'Failed to add member');
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!room || !memberToRemove) return;

    try {
      const response = await api.removeMember(room.id, memberToRemove.userId) as any;
      if (response.success) {
        setRoom(response.room);
        setShowRemoveDialog(false);
        setMemberToRemove(null);
        alert('Member removed successfully!');
      } else {
        alert(response.error || 'Failed to remove member');
      }
    } catch (error: any) {
      alert(error.message || 'Failed to remove member');
    }
  };

  const handleChangeRole = async (memberId: string, newRole: 'admin' | 'editor' | 'viewer') => {
    if (!room) return;

    try {
      const response = await api.changeMemberRole(room.id, memberId, newRole) as any;
      if (response.success) {
        setRoom(response.room);
        alert(`Role changed to ${newRole} successfully!`);
      } else {
        alert(response.error || 'Failed to change role');
      }
    } catch (error: any) {
      alert(error.message || 'Failed to change role');
    }
  };

  const handleDeleteRoom = async () => {
    if (!room) return;

    setDeletingRoom(true);
    try {
      const response = await api.deleteRoom(room.id) as any;
      if (response.success) {
        alert('Room deleted successfully!');
        router.push('/home');
      } else {
        alert(response.error || 'Failed to delete room');
      }
    } catch (error: any) {
      alert(error.message || 'Failed to delete room');
    } finally {
      setDeletingRoom(false);
      setShowDeleteDialog(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-4 w-4 text-red-500" />;
      case 'editor':
        return <Edit className="h-4 w-4 text-blue-500" />;
      case 'viewer':
        return <Eye className="h-4 w-4 text-gray-500" />;
      default:
        return null;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!room) {
    return null;
  }

  const handleLeaveRoom = async () => {
    if (!confirm('Are you sure you want to leave this room? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await api.leaveRoom(room.id) as any;
      if (response.success) {
        alert('Successfully left the room');
        router.push('/home');
      } else {
        alert(`Failed to leave room: ${response.error}`);
      }
    } catch (error: any) {
      console.error('Error leaving room:', error);
      alert(`Error: ${error.message || 'Failed to leave room'}`);
    }
  };

  const handleApproveInvitation = async (userId: string) => {
    if (!confirm('Are you sure you want to approve this invitation?')) {
      return;
    }

    try {
      const response = await api.approveRoomInvitation(room.id, userId) as any;
      if (response.success) {
        // Update the room data
        setRoom(response.room);
        // Remove from pending invitations
        setPendingInvitations(prev => prev.filter(inv => inv.userId !== userId));
        alert('Invitation approved successfully!');
      } else {
        alert(`Failed to approve invitation: ${response.error}`);
      }
    } catch (error: any) {
      console.error('Error approving invitation:', error);
      alert(`Error: ${error.message || 'Failed to approve invitation'}`);
    }
  };

  const handleRejectInvitation = async (userId: string) => {
    if (!confirm('Are you sure you want to reject this invitation? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await api.rejectRoomInvitation(room.id, userId) as any;
      if (response.success) {
        // Update the room data
        setRoom(response.room);
        // Remove from pending invitations
        setPendingInvitations(prev => prev.filter(inv => inv.userId !== userId));
        alert('Invitation rejected successfully!');
      } else {
        alert(`Failed to reject invitation: ${response.error}`);
      }
    } catch (error: any) {
      console.error('Error rejecting invitation:', error);
      alert(`Error: ${error.message || 'Failed to reject invitation'}`);
    }
  };

  const handleUserApproveInvitation = async () => {
    if (!confirm('Are you sure you want to join this room?')) {
      return;
    }

    try {
      const response = await api.approveRoomInvitation(room.id, user?.id || '') as any;
      if (response.success) {
        // Update the room data
        setRoom(response.room);
        // Clear pending invitation
        setUserPendingInvitation(null);
        alert('🎉 Successfully joined the room!');
        // Refresh the page to show updated room data
        window.location.reload();
      } else {
        alert(`Failed to join room: ${response.error}`);
      }
    } catch (error: any) {
      console.error('Error joining room:', error);
      alert(`Error: ${error.message || 'Failed to join room'}`);
    }
  };

  const handleUserRejectInvitation = async () => {
    if (!confirm('Are you sure you want to decline this invitation? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await api.rejectRoomInvitation(room.id, user?.id || '') as any;
      if (response.success) {
        // Clear pending invitation
        setUserPendingInvitation(null);
        alert('Invitation declined successfully!');
        // Redirect to home page
        router.push('/home');
      } else {
        alert(`Failed to decline invitation: ${response.error}`);
      }
    } catch (error: any) {
      console.error('Error declining invitation:', error);
      alert(`Error: ${error.message || 'Failed to decline invitation'}`);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background py-4 lg:py-8">
        <div className="max-w-4xl mx-auto px-4 space-y-6">
          <AppHeader
            title={APP_HEADER_CONFIGS.roomView.title(room.name)}
            subtitle={APP_HEADER_CONFIGS.roomView.subtitle(room.roomId)}
            showNavigation={APP_HEADER_CONFIGS.roomView.showNavigation}
            showCreateRoom={APP_HEADER_CONFIGS.roomView.showCreateRoom}
            showJoinRoom={APP_HEADER_CONFIGS.roomView.showJoinRoom}
          />

        {/* Room Info Card - Read Only */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Users className="h-5 w-5" />
              Room Information
            </CardTitle>
            <CardDescription>
              View room details and your membership information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {room.profilePicture?.type === 'upload' && room.profilePicture.url ? (
                  <img 
                    src={room.profilePicture.url} 
                    alt="Room Profile" 
                    className="h-12 w-12 rounded-full object-cover" 
                  />
                ) : room.profilePicture?.type === 'avatar' ? (
                  <img 
                    src={`https://api.dicebear.com/7.x/${room.profilePicture.avatarStyle?.toLowerCase().replace(/\s+/g, '-')}/svg?seed=${room.profilePicture.seed || room.id}`} 
                    alt="Room Avatar" 
                    className="h-12 w-12 rounded-full object-cover" 
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-lg font-bold">
                    {room.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-lg">{room.name}</h3>
                  <p className="text-sm text-muted-foreground">Room ID: {room.roomId}</p>
                </div>
              </div>
              
              {room.description && (
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground">{room.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-1">Total Members</h4>
                  <p className="text-sm text-muted-foreground">{room.members.length}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-1">Your Role</h4>
                  <Badge variant={getCurrentUserRole() === 'admin' ? 'default' : 'secondary'}>
                    {getCurrentUserRole()}
                  </Badge>
                </div>
              </div>

              {/* Chat Now Button */}
              <div className="pt-4 border-t">
                <Button
                  onClick={() => setIsChatOpen(true)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Chat Now
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

          {/* Members List - Read Only */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Users className="h-5 w-5" />
                Room Members ({room.members.length})
              </CardTitle>
              <CardDescription>
                View all room members and their roles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {room.members.map((member) => (
                  <div
                    key={member.userId}
                    className="flex items-center justify-between p-3 border border-border rounded-lg bg-card"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={
                            member.profilePicture?.type === 'upload'
                              ? member.profilePicture.url
                              : member.profilePicture?.type === 'avatar'
                              ? `https://api.dicebear.com/7.x/${member.profilePicture.avatarStyle?.toLowerCase().replace(/\s+/g, '-')}/svg?seed=${member.profilePicture.seed || member.mobileNumber}`
                              : undefined
                          }
                        />
                        <AvatarFallback>
                          {member.username?.charAt(0).toUpperCase() || member.mobileNumber?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">
                            {member.username ? `@${member.username}` : member.mobileNumber}
                          </p>
                          {member.status === 'pending' && (
                            <Badge variant="secondary" className="text-xs">
                              Pending Approval
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{member.mobileNumber}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
                        {member.role}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Leave Room Button */}
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-red-900 mb-2">
                  Leave Room
                </h3>
                <p className="text-red-700 mb-4">
                  You can leave this room at any time. This action cannot be undone.
                </p>
                <Button 
                  variant="ghost" 
                  onClick={handleLeaveRoom}
                  className="bg-red-500 hover:bg-red-600 text-white border-red-500"
                >
                  Leave Room
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Pending Invitation Card - For End Users */}
          {isUserPending && (
            <Card className="border-blue-500 bg-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-blue-700">
                  <UserPlus className="h-5 w-5" />
                  Room Invitation
                </CardTitle>
                <CardDescription className="text-blue-600">
                  You have been invited to join this room
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <UserPlus className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{room.name}</h3>
                      <p className="text-sm text-blue-600">Room ID: {room.roomId}</p>
                      <p className="text-xs text-blue-500">
                        Invited {new Date(userMember?.joinedAt || '').toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 justify-center">
                    <Button
                      variant="outline"
                      onClick={handleUserRejectInvitation}
                      className="text-red-600 border-red-300 hover:bg-red-50"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Decline
                    </Button>
                    <Button
                      onClick={handleUserApproveInvitation}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Join Room
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Chat Widget */}
          <VoiceBroadcastProvider roomId={roomId} userRole={getCurrentUserRole()}>
            <ChatWidget
              roomId={roomId}
              roomName={room.name}
              isOpen={isChatOpen}
              onClose={() => setIsChatOpen(false)}
              userRole={getCurrentUserRole()}
            />
          </VoiceBroadcastProvider>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-4 lg:py-8">
      <div className="max-w-4xl mx-auto px-4 space-y-6">
        <AppHeader
          title={APP_HEADER_CONFIGS.roomManage.title(room.name)}
          subtitle={APP_HEADER_CONFIGS.roomManage.subtitle(room.roomId)}
          showNavigation={APP_HEADER_CONFIGS.roomManage.showNavigation}
          showCreateRoom={APP_HEADER_CONFIGS.roomManage.showCreateRoom}
          showJoinRoom={APP_HEADER_CONFIGS.roomManage.showJoinRoom}
        />

        {/* Room Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Users className="h-5 w-5" />
              Room Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {room.profilePicture?.type === 'upload' && room.profilePicture.url ? (
                  <img 
                    src={room.profilePicture.url} 
                    alt="Room Profile" 
                    className="h-16 w-16 rounded-full object-cover" 
                  />
                ) : room.profilePicture?.type === 'avatar' ? (
                  <img 
                    src={`https://api.dicebear.com/7.x/${room.profilePicture.avatarStyle?.toLowerCase().replace(/\s+/g, '-')}/svg?seed=${room.profilePicture.seed || room.id}`} 
                    alt="Room Avatar" 
                    className="h-16 w-16 rounded-full object-cover" 
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold">
                    {room.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-semibold">{room.name}</h3>
                  <p className="text-sm text-muted-foreground">{room.description || 'No description'}</p>
                  <p className="text-xs text-muted-foreground mt-1">{room.members.length} members</p>
                </div>
              </div>

              {/* Chat Now Button */}
              <div className="pt-4 border-t">
                <Button
                  onClick={() => setIsChatOpen(true)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Chat Now
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending Invitation Card - For Users with Pending Status */}
        {isUserPending && (
          <Card className="border-blue-500 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-blue-700">
                <UserPlus className="h-5 w-5" />
                Room Invitation
              </CardTitle>
              <CardDescription className="text-blue-600">
                You have been invited to join this room
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <UserPlus className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{room.name}</h3>
                    <p className="text-sm text-blue-600">Room ID: {room.roomId}</p>
                    <p className="text-xs text-blue-500">
                      Invited {new Date(userMember?.joinedAt || '').toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3 justify-center">
                  <Button
                    variant="outline"
                    onClick={handleUserRejectInvitation}
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Decline
                  </Button>
                  <Button
                    onClick={handleUserApproveInvitation}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Join Room
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Add Member Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <UserPlus className="h-5 w-5" />
              Add Member
            </CardTitle>
            <CardDescription>
              Add a new member by their username
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddMember} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="memberUsername">Username</Label>
                <Input
                  id="memberUsername"
                  type="text"
                  placeholder="@username or username"
                  value={newMemberUsername}
                  onChange={(e) => setNewMemberUsername(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Enter username with or without @ symbol (e.g., @john or john)
                </p>
              </div>
              <Button type="submit" disabled={addingMember} className="w-full">
                {addingMember ? 'Adding...' : 'Add Member'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Pending Invitations Card */}
        {pendingInvitations.length > 0 && (
          <Card className="border-yellow-500 bg-yellow-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-yellow-700">
                <UserPlus className="h-5 w-5" />
                Pending Invitations ({pendingInvitations.length})
              </CardTitle>
              <CardDescription className="text-yellow-600">
                Users who have been invited but haven't responded yet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingInvitations.map((invitation) => (
                  <div key={invitation.id} className="flex items-center justify-between p-3 border border-yellow-200 rounded-md bg-white">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage
                          src={
                            invitation.profilePicture?.type === 'upload'
                              ? invitation.profilePicture.url
                              : invitation.profilePicture?.type === 'avatar'
                              ? `https://api.dicebear.com/7.x/${invitation.profilePicture.avatarStyle?.toLowerCase().replace(/\s+/g, '-')}/svg?seed=${invitation.profilePicture.seed || invitation.userId}`
                              : undefined
                          }
                        />
                        <AvatarFallback className="text-xs bg-secondary text-secondary-foreground">
                          {invitation.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">@{invitation.username}</p>
                        <p className="text-sm text-muted-foreground">{invitation.mobileNumber}</p>
                        <p className="text-xs text-yellow-600">
                          Invited {new Date(invitation.invitedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                        Pending
                      </Badge>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleApproveInvitation(invitation.userId)}
                          className="text-green-600 border-green-300 hover:bg-green-50"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRejectInvitation(invitation.userId)}
                          className="text-red-600 border-red-300 hover:bg-red-50"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Members List Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Users className="h-5 w-5" />
              Room Members ({room.members.length})
            </CardTitle>
            <CardDescription>
              Manage member roles and permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {room.members.map((member) => (
                <div
                  key={member.userId}
                  className="flex items-center justify-between p-3 border border-border rounded-lg bg-card"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={
                          member.profilePicture?.type === 'upload'
                            ? member.profilePicture.url
                            : member.profilePicture?.type === 'avatar'
                            ? `https://api.dicebear.com/7.x/${member.profilePicture.avatarStyle?.toLowerCase().replace(/\s+/g, '-')}/svg?seed=${member.profilePicture.seed || member.mobileNumber}`
                            : undefined
                        }
                      />
                      <AvatarFallback>
                        {member.username?.charAt(0).toUpperCase() || member.mobileNumber?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">
                          {member.username ? `@${member.username}` : member.mobileNumber}
                        </p>
                        {member.status === 'pending' && (
                          <Badge variant="secondary" className="text-xs">
                            Pending Approval
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{member.mobileNumber}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Role Selector */}
                    <Select
                      value={member.role}
                      onValueChange={(value) => handleChangeRole(member.userId, value as 'admin' | 'editor' | 'viewer')}
                      disabled={member.userId === user?.id}
                    >
                      <SelectTrigger className="w-[130px]">
                        <div className="flex items-center gap-2">
                          {getRoleIcon(member.role)}
                          <SelectValue />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-red-500" />
                            Admin
                          </div>
                        </SelectItem>
                        <SelectItem value="editor">
                          <div className="flex items-center gap-2">
                            <Edit className="h-4 w-4 text-blue-500" />
                            Editor
                          </div>
                        </SelectItem>
                        <SelectItem value="viewer">
                          <div className="flex items-center gap-2">
                            <Eye className="h-4 w-4 text-gray-500" />
                            Viewer
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Remove Member Button */}
                    {member.userId !== user?.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setMemberToRemove(member);
                          setShowRemoveDialog(true);
                        }}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                    
                    {member.userId === user?.id && (
                      <Badge variant="secondary" className="ml-2">You</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone Card */}
        <Card className="border-red-200 dark:border-red-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Danger Zone
            </CardTitle>
            <CardDescription>
              Irreversible actions - proceed with caution
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-red-200 dark:border-red-900 rounded-lg bg-red-50 dark:bg-red-950/20">
                <div>
                  <h4 className="font-semibold text-red-600">Delete Room</h4>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete this room and all its data. This action cannot be undone.
                  </p>
                </div>
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Room
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Remove Member Confirmation Dialog */}
        <Dialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Remove Member</DialogTitle>
              <DialogDescription>
                Are you sure you want to remove this member from the room?
              </DialogDescription>
            </DialogHeader>
            {memberToRemove && (
              <div className="py-4">
                <div className="flex items-center gap-3 p-3 border border-border rounded-lg bg-card">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={
                        memberToRemove.profilePicture?.type === 'upload'
                          ? memberToRemove.profilePicture.url
                          : memberToRemove.profilePicture?.type === 'avatar'
                          ? `https://api.dicebear.com/7.x/${memberToRemove.profilePicture.avatarStyle?.toLowerCase().replace(/\s+/g, '-')}/svg?seed=${memberToRemove.profilePicture.seed || memberToRemove.mobileNumber}`
                          : undefined
                      }
                    />
                    <AvatarFallback>
                      {memberToRemove.username?.charAt(0).toUpperCase() || memberToRemove.mobileNumber?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {memberToRemove.username ? `@${memberToRemove.username}` : memberToRemove.mobileNumber}
                    </p>
                    <p className="text-sm text-muted-foreground">{memberToRemove.mobileNumber}</p>
                    <Badge variant="secondary" className="mt-1">{memberToRemove.role}</Badge>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRemoveDialog(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleRemoveMember}>
                Remove Member
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Room Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Delete Room
              </DialogTitle>
              <DialogDescription>
                This action cannot be undone. This will permanently delete the room and remove all members.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="p-4 border-2 border-red-200 dark:border-red-900 rounded-lg bg-red-50 dark:bg-red-950/20">
                <h4 className="font-semibold text-red-600 mb-2">⚠️ Warning</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>All room data will be permanently deleted</li>
                  <li>All {room.members.length} members will be removed</li>
                  <li>This action cannot be undone</li>
                </ul>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={deletingRoom}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteRoom} disabled={deletingRoom}>
                {deletingRoom ? 'Deleting...' : 'Yes, Delete Room'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Chat Widget */}
        {room && (() => {
          console.log('💬 Rendering ChatWidget with:', {
            roomId,
            roomName: room.name,
            isOpen: isChatOpen,
            userRole: getCurrentUserRole()
          });
          return (
            <VoiceBroadcastProvider roomId={roomId} userRole={getCurrentUserRole()}>
              <ChatWidget
                roomId={roomId}
                roomName={room.name}
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
                userRole={getCurrentUserRole()}
              />
            </VoiceBroadcastProvider>
          );
        })()}
      </div>
    </div>
  );
}
