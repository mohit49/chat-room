'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Radio, Mic, Square, AlertCircle } from 'lucide-react';
import { useBroadcast } from '@/lib/contexts/BroadcastContext';
import { useAuth } from '@/lib/contexts/AuthContext';
import { api } from '@/lib/api';

interface Room {
  id: string;
  roomId: string;
  name: string;
  description?: string;
  members: Array<{
    userId: string;
    role: 'admin' | 'editor' | 'viewer';
  }>;
}

export default function BroadcastCard() {
  const { user } = useAuth();
  const { isBroadcasting, activeBroadcast, startBroadcast, stopBroadcast } = useBroadcast();
  const [adminRooms, setAdminRooms] = useState<Room[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminRooms();
  }, [user]);

  const fetchAdminRooms = async () => {
    try {
      const response = await api.getRooms() as any;
      if (response.success && response.rooms) {
        // Filter rooms where user is admin
        const adminRoomsList = response.rooms.filter((room: Room) => {
          const member = room.members.find(m => m.userId === user?.id);
          return member && member.role === 'admin';
        });
        setAdminRooms(adminRoomsList);
        
        // Auto-select first room if available
        if (adminRoomsList.length > 0 && !selectedRoomId) {
          setSelectedRoomId(adminRoomsList[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching admin rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartBroadcast = async () => {
    if (!selectedRoomId) {
      alert('Please select a room first');
      return;
    }

    const selectedRoom = adminRooms.find(r => r.id === selectedRoomId);
    if (!selectedRoom) return;

    await startBroadcast(selectedRoom.id, selectedRoom.name, 'admin');
  };

  const handleStopBroadcast = () => {
    stopBroadcast();
  };

  if (loading) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (adminRooms.length === 0) {
    return (
      <Card className="overflow-hidden border-orange-200 bg-gradient-to-r from-orange-50 to-red-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-orange-900">Voice Broadcasting</h3>
              <p className="text-sm text-orange-700 mt-1">
                You need to be an admin of at least one room to broadcast. Create a room to get started!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden relative">
      {/* Static gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600">
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2 text-white">
                <Radio className="h-5 w-5" />
                Voice Broadcasting
              </CardTitle>
              <CardDescription className="text-white/90 mt-1.5">
                {isBroadcasting && activeBroadcast 
                  ? `Broadcasting in ${activeBroadcast.roomName}` 
                  : 'Broadcast your voice to room members in real-time'
                }
              </CardDescription>
            </div>
            {isBroadcasting && (
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                </span>
                <span className="text-xs font-medium text-white">LIVE</span>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Room Selector */}
          {!isBroadcasting && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/90">
                Select Room to Broadcast
              </label>
              <Select value={selectedRoomId} onValueChange={setSelectedRoomId}>
                <SelectTrigger className="w-full !bg-white border-2 border-gray-300 text-gray-900 shadow-md hover:bg-white focus:bg-white">
                  <SelectValue placeholder="Choose a room..." />
                </SelectTrigger>
                <SelectContent>
                  {adminRooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{room.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({room.members.length} members)
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Broadcasting Info */}
          {isBroadcasting && activeBroadcast && (
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-white">
                <Mic className="h-4 w-4" />
                <span className="text-sm font-medium">Broadcasting to</span>
              </div>
              <p className="text-white font-semibold">{activeBroadcast.roomName}</p>
              <p className="text-xs text-white/80">
                All members in this room can now hear you
              </p>
            </div>
          )}

          {/* Action Button */}
          <Button
            onClick={isBroadcasting ? handleStopBroadcast : handleStartBroadcast}
            disabled={!isBroadcasting && !selectedRoomId}
            className={`w-full h-12 text-base font-semibold shadow-lg transition-all duration-300 ${
              isBroadcasting
                ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white'
                : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white hover:shadow-xl hover:scale-[1.02]'
            }`}
          >
            {isBroadcasting ? (
              <>
                <Square className="mr-2 h-5 w-5 fill-current" />
                Stop Broadcasting
              </>
            ) : (
              <>
                <Mic className="mr-2 h-5 w-5" />
                Start Broadcasting
              </>
            )}
          </Button>

          {/* Info text */}
          {!isBroadcasting && (
            <p className="text-xs text-white/80 text-center">
              💡 Only room members will hear your broadcast
            </p>
          )}
        </CardContent>
      </div>
    </Card>
  );
}

