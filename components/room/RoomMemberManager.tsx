'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { UserPlus, MoreVertical, Crown, Edit, Eye, Trash2 } from 'lucide-react';

export type RoomRole = 'admin' | 'editor' | 'viewer';

export interface RoomMember {
  userId: string;
  username: string;
  email: string;
  role: RoomRole;
  profilePicture?: {
    type: 'upload' | 'avatar';
    url?: string;
    avatarStyle?: string;
    seed?: string;
  };
  joinedAt: string;
}

interface RoomMemberManagerProps {
  members: RoomMember[];
  currentUserRole: RoomRole;
  currentUserId: string;
  onAddMember: (usernameOrEmail: string) => void;
  onRemoveMember: (memberId: string) => void;
  onChangeRole: (memberId: string, newRole: RoomRole) => void;
  loading?: boolean;
}

export default function RoomMemberManager({
  members,
  currentUserRole,
  currentUserId,
  onAddMember,
  onRemoveMember,
  onChangeRole,
  loading = false
}: RoomMemberManagerProps) {
  const [newMemberMobile, setNewMemberMobile] = useState('');
  const [addingMember, setAddingMember] = useState(false);

  const canManageMembers = currentUserRole === 'admin';
  const canChangeRoles = currentUserRole === 'admin';

  const handleAddMember = async () => {
    if (!newMemberMobile.trim()) return;
    
    setAddingMember(true);
    try {
      await onAddMember(newMemberMobile.trim());
      setNewMemberMobile('');
    } catch (error) {
      console.error('Error adding member:', error);
    } finally {
      setAddingMember(false);
    }
  };

  const getRoleIcon = (role: RoomRole) => {
    switch (role) {
      case 'admin':
        return <Crown className="h-3 w-3" />;
      case 'editor':
        return <Edit className="h-3 w-3" />;
      case 'viewer':
        return <Eye className="h-3 w-3" />;
    }
  };

  const getRoleColor = (role: RoomRole) => {
    switch (role) {
      case 'admin':
        return 'default';
      case 'editor':
        return 'secondary';
      case 'viewer':
        return 'outline';
    }
  };

  const getRoleDescription = (role: RoomRole) => {
    switch (role) {
      case 'admin':
        return 'Full control - manage members, settings, room details';
      case 'editor':
        return 'Can send messages and view content';
      case 'viewer':
        return 'Read-only access to messages';
    }
  };

  return (
    <div className="space-y-6">
      {/* Add Member Section */}
      {canManageMembers && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Add Member
            </CardTitle>
            <CardDescription>
              Invite someone to join this room by their mobile number
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Enter mobile number"
                value={newMemberMobile}
                onChange={(e) => setNewMemberMobile(e.target.value)}
                disabled={addingMember || loading}
              />
              <Button
                onClick={handleAddMember}
                disabled={!newMemberMobile.trim() || addingMember || loading}
              >
                {addingMember ? 'Adding...' : 'Add'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Members List */}
      <Card>
        <CardHeader>
          <CardTitle>Room Members ({members.length})</CardTitle>
          <CardDescription>
            Manage member roles and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {members.map((member) => (
              <div
                key={member.userId}
                className="flex items-center justify-between p-3 border rounded-lg"
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
                    <AvatarFallback className="text-sm">
                      {member.profilePicture?.type === 'avatar'
                        ? '🎭'
                        : member.username?.charAt(0).toUpperCase() || member.mobileNumber?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">@{member.username}</span>
                      <Badge variant={getRoleColor(member.role)} className="text-xs">
                        {getRoleIcon(member.role)}
                        <span className="ml-1 capitalize">{member.role}</span>
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {member.mobileNumber}
                    </p>
                  </div>
                </div>

                {/* Member Actions */}
                {canChangeRoles && member.userId !== currentUserId && (
                  <div className="flex items-center gap-2">
                    <Select
                      value={member.role}
                      onValueChange={(newRole: RoomRole) => onChangeRole(member.userId, newRole)}
                      disabled={loading}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">
                          <div className="flex items-center gap-2">
                            <Crown className="h-3 w-3" />
                            Admin
                          </div>
                        </SelectItem>
                        <SelectItem value="editor">
                          <div className="flex items-center gap-2">
                            <Edit className="h-3 w-3" />
                            Editor
                          </div>
                        </SelectItem>
                        <SelectItem value="viewer">
                          <div className="flex items-center gap-2">
                            <Eye className="h-3 w-3" />
                            Viewer
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => onRemoveMember(member.userId)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}

                {member.userId === currentUserId && (
                  <Badge variant="outline" className="text-xs">
                    You
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Role Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Role Permissions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="default" className="text-xs">
              <Crown className="h-3 w-3 mr-1" />
              Admin
            </Badge>
            <span className="text-xs text-muted-foreground">
              {getRoleDescription('admin')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              <Edit className="h-3 w-3 mr-1" />
              Editor
            </Badge>
            <span className="text-xs text-muted-foreground">
              {getRoleDescription('editor')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              <Eye className="h-3 w-3 mr-1" />
              Viewer
            </Badge>
            <span className="text-xs text-muted-foreground">
              {getRoleDescription('viewer')}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

