'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, 
  Users, 
  ArrowRight,
  MapPin,
  Star
} from 'lucide-react';

interface User {
  _id: string;
  username: string;
  profile?: {
    profilePicture?: {
      type: string;
      url?: string;
      avatarStyle?: string;
      seed?: string;
    };
    location?: {
      city?: string;
      state?: string;
    };
    gender?: string;
    age?: number;
  };
  onlineStatus?: string;
}

interface Room {
  _id: string;
  roomId: string;
  name: string;
  description?: string;
  profilePicture?: {
    type: string;
    url?: string;
    avatarStyle?: string;
    seed?: string;
  };
  members?: any[];
  isActive?: boolean;
}

interface InteractiveCardsProps {
  users: User[];
  rooms: Room[];
}

export function InteractiveUserCards({ users }: { users: User[] }) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const handleUserConnect = (userId: string) => {
    if (isAuthenticated) {
      router.push(`/users/${userId}`);
    } else {
      router.push('/login');
    }
  };

  return (
    <>
      {users.map((user) => {
        const avatarUrl = user.profile?.profilePicture?.type === 'upload'
          ? user.profile.profilePicture.url
          : user.profile?.profilePicture?.type === 'avatar'
          ? `https://api.dicebear.com/7.x/${user.profile.profilePicture.avatarStyle?.toLowerCase().replace(/\s+/g, '-')}/svg?seed=${user.profile.profilePicture.seed || user.username}`
          : `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`;

        const location = user.profile?.location?.city && user.profile?.location?.state
          ? `${user.profile.location.city}, ${user.profile.location.state}`
          : user.profile?.location?.city || user.profile?.location?.state || 'Location not set';

        return (
          <Card key={user._id} className="flex-shrink-0 w-[280px] snap-start border-2 border-gray-700 bg-gray-800/50 hover:bg-gray-800 hover:shadow-lg hover:shadow-blue-500/20 transition-all group">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-4">
                  <img 
                    src={avatarUrl} 
                    alt={user.username}
                    className="h-20 w-20 rounded-full border-4 border-gray-700 group-hover:border-blue-500/50 transition-colors"
                  />
                  {user.onlineStatus === 'online' && (
                    <div className="absolute bottom-0 right-0 h-5 w-5 bg-green-500 rounded-full border-2 border-gray-800"></div>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-white mb-1">@{user.username}</h3>
                <div className="flex items-center text-sm text-gray-400 mb-3">
                  <MapPin className="h-3 w-3 mr-1" />
                  {location}
                </div>
                <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                  {user.profile?.gender && `${user.profile.gender} • `}
                  {user.profile?.age && `${user.profile.age} years old`}
                </p>
                <Button 
                  size="sm" 
                  onClick={() => handleUserConnect(user._id)}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Connect
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </>
  );
}

export function InteractiveRoomCards({ rooms }: { rooms: Room[] }) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const handleRoomJoin = (roomId: string) => {
    if (isAuthenticated) {
      router.push(`/rooms/${roomId}`);
    } else {
      router.push('/login');
    }
  };

  return (
    <>
      {rooms.map((room) => (
        <Card key={room._id} className="flex-shrink-0 w-[320px] snap-start border-2 border-gray-700 bg-gray-800/50 hover:bg-gray-800 hover:shadow-lg hover:shadow-purple-500/20 transition-all group">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                {room.profilePicture?.type === 'upload' && room.profilePicture.url ? (
                  <img 
                    src={room.profilePicture.url} 
                    alt={room.name}
                    className="h-12 w-12 rounded-lg object-cover"
                  />
                ) : room.profilePicture?.type === 'avatar' ? (
                  <img 
                    src={`https://api.dicebear.com/7.x/${room.profilePicture.avatarStyle?.toLowerCase().replace(/\s+/g, '-')}/svg?seed=${room.profilePicture.seed || room.name}`}
                    alt={room.name}
                    className="h-12 w-12 rounded-lg"
                  />
                ) : (
                  <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-semibold text-white line-clamp-1">{room.name}</h3>
                  <Badge variant="secondary" className="text-xs bg-gray-700 text-gray-300">
                    {room.roomId}
                  </Badge>
                </div>
              </div>
              {room.isActive && (
                <div className="flex items-center space-x-1">
                  <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-400">Live</span>
                </div>
              )}
            </div>
            
            <p className="text-sm text-gray-400 mb-4 line-clamp-2">
              {room.description || 'No description provided'}
            </p>
            
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center text-sm text-gray-400">
                <Users className="h-4 w-4 mr-1" />
                {room.members?.length || 0} members
              </div>
              <div className="flex items-center text-sm text-yellow-400">
                <Star className="h-4 w-4 mr-1 fill-current" />
                {room.isActive ? '★ Active' : 'Room'}
              </div>
            </div>

            <Button 
              size="sm" 
              onClick={() => handleRoomJoin(room.roomId)}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              Join Room
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      ))}
    </>
  );
}

