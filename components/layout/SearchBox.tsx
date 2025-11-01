'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Search, Users, MessageCircle, X } from 'lucide-react';
import { api } from '@/lib/api';

interface User {
  id: string;
  username: string;
  email: string;
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
  members: Array<{
    id: string;
    role: 'admin' | 'editor' | 'viewer';
  }>;
}

interface SearchBoxProps {
  className?: string;
}

export default function SearchBox({ className = '' }: SearchBoxProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'rooms'>('users');
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Search function with debounce
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setUsers([]);
      setRooms([]);
      setIsOpen(false);
      return;
    }

    const searchTimeout = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [searchQuery]);

  const performSearch = async (query: string) => {
    if (query.trim().length < 2) return;

    setLoading(true);
    setIsOpen(true);

    try {
      // Search users and rooms in parallel
      const [usersResponse, roomsResponse] = await Promise.all([
        searchUsers(query),
        searchRooms(query)
      ]);

      setUsers(usersResponse);
      setRooms(roomsResponse);
    } catch (error) {
      console.error('Search error:', error);
      setUsers([]);
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async (query: string): Promise<User[]> => {
    try {
      const response = await api.searchUsers(query) as any;
      if (response.success && response.users) {
        return response.users;
      }
      return [];
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  };

  const searchRooms = async (query: string): Promise<Room[]> => {
    try {
      const response = await api.getRooms() as any;
      if (response.success && response.rooms) {
        // Filter rooms based on search query
        return response.rooms.filter((room: Room) =>
          room.name.toLowerCase().includes(query.toLowerCase()) ||
          room.description?.toLowerCase().includes(query.toLowerCase()) ||
          room.roomId.toLowerCase().includes(query.toLowerCase())
        );
      }
      return [];
    } catch (error) {
      console.error('Error searching rooms:', error);
      return [];
    }
  };

  const handleUserClick = (user: User) => {
    // Navigate to user profile page
    router.push(`/users/${user.id}`);
    setIsOpen(false);
    setIsFullScreen(false);
    setSearchQuery('');
  };

  const handleRoomClick = (room: Room) => {
    router.push(`/rooms/${room.id}`);
    setIsOpen(false);
    setIsFullScreen(false);
    setSearchQuery('');
  };

  const clearSearch = () => {
    setSearchQuery('');
    setIsOpen(false);
    setIsFullScreen(false);
    setUsers([]);
    setRooms([]);
    inputRef.current?.focus();
  };

  const getTotalResults = () => users.length + rooms.length;

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      {/* Search Icon - Desktop */}
      <div className="hidden lg:block">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setIsFullScreen(true);
            // Focus the input in the full-screen modal
            setTimeout(() => {
              const fullScreenInput = document.querySelector('#fullscreen-search-input') as HTMLInputElement;
              if (fullScreenInput) {
                fullScreenInput.focus();
              }
            }, 100);
          }}
          className="h-10 w-10 p-0 rounded-full hover:bg-accent"
        >
          <Search className="h-5 w-5" />
        </Button>
      </div>

      {/* Search Icon - Mobile */}
      <div className="lg:hidden">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setIsFullScreen(true);
            // Focus the input in the full-screen modal
            setTimeout(() => {
              const fullScreenInput = document.querySelector('#fullscreen-search-input') as HTMLInputElement;
              if (fullScreenInput) {
                fullScreenInput.focus();
              }
            }, 100);
          }}
          className="h-10 w-10 p-0 rounded-full hover:bg-accent"
        >
          <Search className="h-5 w-5" />
        </Button>
      </div>

      {/* Search Results Dropdown - Removed, using full-screen modal instead */}

      {/* Full-Screen Mobile Search Modal */}
      <Dialog open={isFullScreen} onOpenChange={setIsFullScreen}>
        <DialogContent className="max-w-none w-full h-full max-h-screen m-0 p-0 rounded-none">
          <div className="flex flex-col h-full">
            {/* Header with close button */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Search</h2>
              
             
            </div>

            {/* Search Input */}
            <div className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="fullscreen-search-input"
                  type="text"
                  placeholder="Search users and rooms..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 w-full"
                />
              </div>
            </div>

            {/* Search Results */}
            <div className="flex-1 overflow-hidden">
              {searchQuery.trim().length >= 2 ? (
                loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    <span className="ml-2 text-sm text-muted-foreground">Searching...</span>
                  </div>
                ) : getTotalResults() === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <Search className="h-8 w-8 mb-2" />
                    <p className="text-sm">No results found for "{searchQuery}"</p>
                  </div>
                ) : (
                  <div className="h-full overflow-y-auto">
                    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'users' | 'rooms')}>
                      <div className="border-b sticky top-0 bg-background z-10">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="users" className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Users ({users.length})
                          </TabsTrigger>
                          <TabsTrigger value="rooms" className="flex items-center gap-2">
                            <MessageCircle className="h-4 w-4" />
                            Rooms ({rooms.length})
                          </TabsTrigger>
                        </TabsList>
                      </div>

                      <div className="p-4">
                        <TabsContent value="users" className="m-0">
                          {users.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                              <Users className="h-6 w-6 mb-2" />
                              <p className="text-sm">No users found</p>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              {users.map((user) => (
                                <div
                                  key={user.id}
                                  onClick={() => handleUserClick(user)}
                                  className="flex items-center gap-3 p-3 hover:bg-accent cursor-pointer transition-colors rounded-lg"
                                >
                                  <Avatar className="h-10 w-10">
                                    <AvatarImage
                                      src={
                                        user.profilePicture?.type === 'upload'
                                          ? user.profilePicture.url
                                          : user.profilePicture?.type === 'avatar'
                                          ? `https://api.dicebear.com/7.x/${user.profilePicture.avatarStyle?.toLowerCase().replace(/\s+/g, '-')}/svg?seed=${user.profilePicture.seed || user.email}`
                                          : undefined
                                      }
                                    />
                                    <AvatarFallback>
                                      {user.profilePicture?.type === 'avatar'
                                        ? '🎭'
                                        : user.username?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">@{user.username}</p>
                                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </TabsContent>

                        <TabsContent value="rooms" className="m-0">
                          {rooms.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                              <MessageCircle className="h-6 w-6 mb-2" />
                              <p className="text-sm">No rooms found</p>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              {rooms.map((room) => (
                                <div
                                  key={room.id}
                                  onClick={() => handleRoomClick(room)}
                                  className="flex items-center gap-3 p-3 hover:bg-accent cursor-pointer transition-colors rounded-lg"
                                >
                                  <Avatar className="h-10 w-10">
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
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{room.name}</p>
                                    <p className="text-xs text-muted-foreground truncate">
                                      {room.description || room.roomId}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Badge variant="outline" className="text-xs">
                                        {room.members.length} members
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </TabsContent>
                      </div>
                    </Tabs>
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Search className="h-12 w-12 mb-4 opacity-50" />
                  <p className="text-lg font-medium">Search for users and rooms</p>
                  <p className="text-sm">Type at least 2 characters to start searching</p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
