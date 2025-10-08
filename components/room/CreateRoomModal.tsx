'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users, UserPlus, Settings, X } from 'lucide-react';
import AvatarUploader from '@/components/profile/AvatarUploader';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRoom: (roomData: {
    name: string;
    description?: string;
    profilePicture?: {
      type: 'upload' | 'avatar';
      url?: string;
      avatarStyle?: string;
      seed?: string;
    };
  }) => void;
}

export default function CreateRoomModal({ isOpen, onClose, onCreateRoom }: CreateRoomModalProps) {
  const [roomName, setRoomName] = useState('');
  const [roomDescription, setRoomDescription] = useState('');
  const [profilePicture, setProfilePicture] = useState<{
    type: 'upload' | 'avatar';
    url?: string;
    avatarStyle?: string;
    seed?: string;
  } | undefined>();
  const [loading, setLoading] = useState(false);

  const handleCreateRoom = async () => {
    if (!roomName.trim()) {
      return;
    }

    setLoading(true);
    try {
      await onCreateRoom({
        name: roomName.trim(),
        description: roomDescription.trim() || undefined,
        profilePicture
      });
      
      // Reset form
      setRoomName('');
      setRoomDescription('');
      setProfilePicture(undefined);
      onClose();
    } catch (error) {
      console.error('Error creating room:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setRoomName('');
      setRoomDescription('');
      setProfilePicture(undefined);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Create New Room
          </DialogTitle>
          <DialogDescription>
            Create a new chat room and invite others to join
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Room Profile Picture */}
          <div className="flex flex-col items-center space-y-4">
            <Label className="text-sm font-medium">Room Profile Picture</Label>
            <AvatarUploader
              currentImage={profilePicture?.type === 'upload' ? profilePicture.url : undefined}
              avatarStyle={profilePicture?.avatarStyle}
              avatarSeed={profilePicture?.seed}
              username={roomName || 'room'}
              onImageChange={(imageData, type, style, seed) => {
                setProfilePicture({
                  type,
                  url: type === 'upload' ? imageData : undefined,
                  avatarStyle: style,
                  seed: seed,
                });
              }}
            />
          </div>

          {/* Room Details */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="roomName">Room Name *</Label>
              <Input
                id="roomName"
                placeholder="Enter room name"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="roomDescription">Description (Optional)</Label>
              <Input
                id="roomDescription"
                placeholder="Enter room description"
                value={roomDescription}
                onChange={(e) => setRoomDescription(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          {/* Role Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Room Roles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="default" className="text-xs">Admin</Badge>
                <span className="text-xs text-muted-foreground">
                  Full control - manage members, settings, room details
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">Editor</Badge>
                <span className="text-xs text-muted-foreground">
                  Can send messages and view content
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">Viewer</Badge>
                <span className="text-xs text-muted-foreground">
                  Read-only access to messages
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateRoom}
              disabled={!roomName.trim() || loading}
              className="flex-1"
            >
              {loading ? 'Creating...' : 'Create Room'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

