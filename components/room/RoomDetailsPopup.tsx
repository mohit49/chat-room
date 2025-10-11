'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, UserPlus, Trash2, Shield, Edit, Eye, AlertTriangle, Check, X, MessageCircle, Settings } from 'lucide-react';
import { api } from '@/lib/api';

interface RoomMember {
  userId: string;
  username: string;
  mobileNumber: string;
  role: 'admin' | 'editor' | 'viewer';
  profilePicture?: {
    type: 'upload' | 'avatar';
    url?: string;
    avatarStyle?: string;
    seed?: string;
  };
  joinedAt: string;
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

interface RoomDetailsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room | null;
  currentUserId: string;
}

export default function RoomDetailsPopup({ isOpen, onClose, room, currentUserId }: RoomDetailsPopupProps) {
  const router = useRouter();
  const [roomData, setRoomData] = useState<Room | null>(room);
  const [loading, setLoading] = useState(false);
  const [newMemberMobile, setNewMemberMobile] = useState('');
  const [addingMember, setAddingMember] = useState(false);

  useEffect(() => {
    if (room && isOpen) {
      setRoomData(room);
    }
  }, [room, isOpen]);

  const getCurrentUserRole = (): 'admin' | 'editor' | 'viewer' | null => {
    if (!roomData || !currentUserId) return null;
    const member = roomData.members.find(m => m.userId === currentUserId);
    return member ? member.role : null;
  };

  const getRoleIcon = (role: 'admin' | 'editor' | 'viewer') => {
    switch (role) {
      case 'admin':
        return <Shield className="h-3 w-3" />;
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

  const handleAddMember = async () => {
    if (!roomData || !newMemberMobile.trim()) return;

    setAddingMember(true);
    try {
      const response = await api.addMember(roomData.id, newMemberMobile) as any;
      if (response.success) {
        setRoomData(response.room);
        setNewMemberMobile('');
      }
    } catch (error: any) {
      alert(error.message || 'Failed to add member');
    } finally {
      setAddingMember(false);
    }
  };

  const handleChangeMemberRole = async (memberId: string, newRole: 'admin' | 'editor' | 'viewer') => {
    if (!roomData) return;

    try {
      const response = await api.changeMemberRole(roomData.id, memberId, newRole) as any;
      if (response.success) {
        setRoomData(response.room);
      }
    } catch (error: any) {
      alert(error.message || 'Failed to change member role');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!roomData) return;

    try {
      const response = await api.removeMember(roomData.id, memberId) as any;
      if (response.success) {
        setRoomData(response.room);
      }
    } catch (error: any) {
      alert(error.message || 'Failed to remove member');
    }
  };

  const handleNavigateToFullDetails = () => {
    if (roomData) {
      router.push(`/rooms/${roomData.id}`);
      onClose();
    }
  };

  if (!roomData) return null;

  const currentUserRole = getCurrentUserRole();
  const canManageMembers = currentUserRole === 'admin' || currentUserRole === 'editor';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {roomData.name}
          </DialogTitle>
          <DialogDescription>
            {roomData.description || 'Room management and settings'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Room Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage
                    src={
                      roomData.profilePicture?.type === 'upload'
                        ? roomData.profilePicture.url
                        : roomData.profilePicture?.type === 'avatar'
                        ? `https://api.dicebear.com/7.x/${roomData.profilePicture.avatarStyle?.toLowerCase().replace(/\s+/g, '-')}/svg?seed=${roomData.profilePicture.seed || roomData.name}`
                        : undefined
                    }
                  />
                  <AvatarFallback>
                    {roomData.profilePicture?.type === 'avatar'
                      ? '🎭'
                      : roomData.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle className="text-lg">{roomData.name}</CardTitle>
                  <CardDescription>{roomData.description || 'No description'}</CardDescription>
                </div>
                <Badge variant="outline">
                  Room ID: {roomData.roomId}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Members:</span>
                  <p className="font-medium">{roomData.members.length}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Created:</span>
                  <p className="font-medium">{new Date(roomData.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <p className="font-medium">{roomData.isActive ? 'Active' : 'Inactive'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Your Role:</span>
                  <p className="font-medium capitalize">{currentUserRole}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Add Member Section */}
          {canManageMembers && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Add Member</CardTitle>
                <CardDescription>
                  Invite a new member to this room by their mobile number
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label htmlFor="mobileNumber">Mobile Number</Label>
                    <Input
                      id="mobileNumber"
                      placeholder="Enter mobile number"
                      value={newMemberMobile}
                      onChange={(e) => setNewMemberMobile(e.target.value)}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button 
                      onClick={handleAddMember} 
                      disabled={addingMember || !newMemberMobile.trim()}
                    >
                      {addingMember ? 'Adding...' : 'Add Member'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Members List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Members ({roomData.members.length})</CardTitle>
              <CardDescription>
                Manage room members and their permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {roomData.members.map((member) => (
                  <div key={member.userId} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
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
                          {member.profilePicture?.type === 'avatar'
                            ? '🎭'
                            : member.username?.charAt(0).toUpperCase() || member.mobileNumber.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{member.username || member.mobileNumber}</p>
                        <p className="text-sm text-muted-foreground">{member.mobileNumber}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant={getRoleColor(member.role)} className="text-xs">
                        {getRoleIcon(member.role)}
                        <span className="ml-1 capitalize">{member.role}</span>
                      </Badge>
                      
                      {canManageMembers && member.userId !== currentUserId && (
                        <div className="flex gap-1">
                          <Select
                            value={member.role}
                            onValueChange={(value: 'admin' | 'editor' | 'viewer') => 
                              handleChangeMemberRole(member.userId, value)
                            }
                          >
                            <SelectTrigger className="w-24 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="editor">Editor</SelectItem>
                              <SelectItem value="viewer">Viewer</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveMember(member.userId)}
                            className="h-8 w-8 p-0"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={handleNavigateToFullDetails}>
              <Settings className="mr-2 h-4 w-4" />
              Manage Room
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
