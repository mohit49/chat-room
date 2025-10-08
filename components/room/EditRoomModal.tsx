'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AvatarUploader from '@/components/profile/AvatarUploader';
import { api } from '@/lib/api';

interface EditRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRoomUpdated: (updatedRoom: any) => void;
  room: {
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
  } | null;
  currentUserRole: 'admin' | 'editor' | 'viewer' | null;
}

export default function EditRoomModal({
  isOpen,
  onClose,
  onRoomUpdated,
  room,
  currentUserRole
}: EditRoomModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [profilePicture, setProfilePicture] = useState<{
    type: 'upload' | 'avatar';
    url?: string;
    avatarStyle?: string;
    seed?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (room) {
      console.log('EditRoomModal - room object received:', room);
      console.log('EditRoomModal - room.roomId:', room.roomId);
      console.log('EditRoomModal - room.id:', room.id);
      setName(room.name);
      setDescription(room.description || '');
      setProfilePicture(room.profilePicture || null);
    }
  }, [room]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!room) return;

    if (!room.id) {
      setError('Room ID is missing. Cannot update room.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      console.log('=== UPDATE ROOM REQUEST ===');
      console.log('Room ID:', room.id);
      console.log('Name:', name);
      console.log('Description:', description);
      console.log('Profile Picture:', profilePicture);
      
      const updateData = {
        name,
        description: description || undefined,
        profilePicture: profilePicture || undefined
      };
      console.log('=== EDIT ROOM MODAL DEBUG ===');
      console.log('Room ID:', room.id);
      console.log('Profile Picture State:', profilePicture);
      console.log('Update Data:', updateData);
      console.log('Profile Picture in Update Data:', updateData.profilePicture);
      
      const response = await api.updateRoom(room.id, updateData);
      console.log('=== UPDATE ROOM RESPONSE ===');
      console.log('Response:', response);
      console.log('Response success:', response.success);
      console.log('Response error:', response.error);

      if (response.success) {
        console.log('✅ Room updated successfully!');
        console.log('Updated room:', response.room);
        
        // Update the parent component with new room data
        onRoomUpdated(response.room);
        
        // Show success message instead of closing
        setSuccessMessage('✅ Your room data updated successfully!');
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      } else {
        console.error('❌ Update failed:', response.error);
        setError(response.error || 'Failed to update room');
      }
    } catch (err: any) {
      console.error('❌ Update error:', err);
      console.error('❌ Error details:', {
        message: err.message,
        stack: err.stack,
        response: err.response
      });
      setError(err.message || 'Failed to update room');
    } finally {
      setLoading(false);
    }
  };

  const canEdit = currentUserRole === 'admin';

  if (!canEdit) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Access Denied</DialogTitle>
            <DialogDescription>
              You don't have permission to edit this room. Only admins can edit room details.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button onClick={onClose}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Room</DialogTitle>
          <DialogDescription>
            Update room details and settings
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Room Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter room name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter room description"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Room Profile Picture</Label>
            <AvatarUploader
              currentImage={profilePicture?.type === 'upload' ? profilePicture.url : undefined}
              avatarStyle={profilePicture?.avatarStyle}
              avatarSeed={profilePicture?.seed}
              username={room?.name || 'room'}
              onImageChange={(imageData, type, style, seed) => {
                console.log('=== AVATAR CHANGE DEBUG ===');
                console.log('Profile picture changed:', { imageData, type, style, seed });
                console.log('Type:', type);
                console.log('Style:', style);
                console.log('Seed:', seed);
                console.log('ImageData:', imageData);
                
                if (type === 'upload') {
                  console.log('Setting upload avatar');
                  setProfilePicture({
                    type: 'upload',
                    url: imageData
                  });
                } else if (type === 'avatar') {
                  console.log('Setting avatar type');
                  const avatarData = {
                    type: 'avatar',
                    avatarStyle: style,
                    seed: seed
                  };
                  console.log('Avatar data to set:', avatarData);
                  setProfilePicture(avatarData);
                }
              }}
            />
          </div>

          {error && (
            <div className="text-sm text-red-500 bg-red-50 border border-red-200 p-3 rounded">
              ❌ {error}
            </div>
          )}

          {successMessage && (
            <div className="text-sm text-green-700 bg-green-50 border border-green-200 p-3 rounded font-medium">
              {successMessage}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Room'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
