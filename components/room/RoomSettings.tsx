'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Settings, Save, X } from 'lucide-react';
import AvatarUploader from '@/components/profile/AvatarUploader';

interface RoomSettingsProps {
  roomName: string;
  roomDescription?: string;
  roomProfilePicture?: {
    type: 'upload' | 'avatar';
    url?: string;
    avatarStyle?: string;
    seed?: string;
  };
  onUpdateRoom: (updates: {
    name?: string;
    description?: string;
    profilePicture?: {
      type: 'upload' | 'avatar';
      url?: string;
      avatarStyle?: string;
      seed?: string;
    };
  }) => Promise<void>;
  canEdit: boolean;
  loading?: boolean;
}

export default function RoomSettings({
  roomName,
  roomDescription,
  roomProfilePicture,
  onUpdateRoom,
  canEdit,
  loading = false
}: RoomSettingsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(roomName);
  const [description, setDescription] = useState(roomDescription || '');
  const [profilePicture, setProfilePicture] = useState(roomProfilePicture);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdateRoom({
        name: name.trim(),
        description: description.trim() || undefined,
        profilePicture
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating room:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setName(roomName);
    setDescription(roomDescription || '');
    setProfilePicture(roomProfilePicture);
    setIsEditing(false);
  };

  if (!canEdit) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Room Settings
          </CardTitle>
          <CardDescription>
            Room information and settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage
                src={
                  roomProfilePicture?.type === 'upload'
                    ? roomProfilePicture.url
                    : roomProfilePicture?.type === 'avatar'
                    ? `https://api.dicebear.com/7.x/${roomProfilePicture.avatarStyle?.toLowerCase().replace(/\s+/g, '-')}/svg?seed=${roomProfilePicture.seed || roomName}`
                    : undefined
                }
              />
              <AvatarFallback className="text-lg">
                {roomProfilePicture?.type === 'avatar'
                  ? '🎭'
                  : roomName?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-lg">{roomName}</h3>
              {roomDescription && (
                <p className="text-muted-foreground">{roomDescription}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Room Settings
        </CardTitle>
        <CardDescription>
          Manage room information and appearance
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!isEditing ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage
                  src={
                    roomProfilePicture?.type === 'upload'
                      ? roomProfilePicture.url
                      : roomProfilePicture?.type === 'avatar'
                      ? `https://api.dicebear.com/7.x/${roomProfilePicture.avatarStyle?.toLowerCase().replace(/\s+/g, '-')}/svg?seed=${roomProfilePicture.seed || roomName}`
                      : undefined
                  }
                />
                <AvatarFallback className="text-lg">
                  {roomProfilePicture?.type === 'avatar'
                    ? '🎭'
                    : roomName?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-lg">{roomName}</h3>
                {roomDescription && (
                  <p className="text-muted-foreground">{roomDescription}</p>
                )}
              </div>
            </div>
            <Button onClick={() => setIsEditing(true)} disabled={loading}>
              Edit Settings
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Room Profile Picture */}
            <div className="flex flex-col items-center space-y-4">
              <Label className="text-sm font-medium">Room Profile Picture</Label>
              <AvatarUploader
                currentImage={profilePicture?.type === 'upload' ? profilePicture.url : undefined}
                avatarStyle={profilePicture?.avatarStyle}
                avatarSeed={profilePicture?.seed}
                username={name || 'room'}
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
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="roomDescription">Description</Label>
                <Input
                  id="roomDescription"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter room description"
                  disabled={saving}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={saving}
                className="flex-1"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={!name.trim() || saving}
                className="flex-1"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
