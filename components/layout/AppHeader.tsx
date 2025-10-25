'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useProfileCompletion } from '@/hooks/useProfileCompletion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Edit3, Settings, Trash2, LogOut, ChevronDown, Users, UserPlus, Home, Search, ArrowLeft } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import CreateRoomModal from '@/components/room/CreateRoomModal';
import NotificationIcon from '@/components/ui/notification-icon';
import MessageIcon from '@/components/layout/MessageIcon';
import SearchBox from '@/components/layout/SearchBox';
import { api } from '@/lib/api';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  showNavigation?: boolean;
  showCreateRoom?: boolean;
  showJoinRoom?: boolean;
  showBackButton?: boolean;
  onCreateRoom?: () => void;
}

export default function AppHeader({ 
  title, 
  subtitle, 
  showNavigation = true,
  showCreateRoom = true,
  showJoinRoom = true,
  showBackButton = true,
  onCreateRoom
}: AppHeaderProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { isComplete } = useProfileCompletion();
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const handleDeleteAccount = async () => {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        // TODO: Implement delete account API call
        console.log('Delete account functionality to be implemented');
        alert('Delete account functionality will be implemented soon.');
      } catch (error) {
        console.error('Error deleting account:', error);
        alert('Failed to delete account. Please try again.');
      }
    }
  };

  const handleCreateRoom = () => {
    if (onCreateRoom) {
      onCreateRoom();
    } else {
      setShowCreateRoomModal(true);
    }
  };

  const handleCreateRoomSubmit = async (roomData: {
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
        alert('Room created successfully!');
        // TODO: Navigate to the new room or refresh room list
      } else {
        alert(response.error || 'Failed to create room');
      }
    } catch (error: any) {
      console.error('Error creating room:', error);
      alert(error.message || 'Failed to create room');
    }
  };

  const handleJoinRoom = () => {
    // TODO: Navigate to join room page
    alert('Join Room functionality will be implemented soon.');
  };

  if (!user) {
    return null;
  }

  return (
    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-8 gap-4">
      {/* Top Row - Mobile: Icons only, Desktop: All sections */}
      <div className="flex items-center justify-between w-full lg:justify-start gap-4">
        {/* Logo - Both Mobile and Desktop */}
        <div className="flex items-center gap-2">
          {/* Back Icon - Mobile only (conditionally shown) */}
          {showBackButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="lg:hidden h-10 w-10 px-0 hover:bg-accent"
            >
              <ArrowLeft className="h-10 w-10" />
            </Button>
          )}
          
          <Image 
            src="/logo-icon.png" 
            alt="Flipy Chat Logo" 
            width={32} 
            height={32} 
            className="w-8 h-8 rounded-lg"
          />
          <span className="font-bold text-lg text-foreground hidden sm:block">Flipy Chat</span>
        </div>

        {/* Left Section - Navigation (Desktop only) */}
        <div className="hidden lg:flex items-center gap-6">
        {/* Navigation Menu - Only show if profile is complete */}
        {showNavigation && isComplete && (
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Users className="h-4 w-4" />
                  Rooms
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
               
                <DropdownMenuItem onClick={() => router.push('/rooms')}>
                  <Users className="mr-2 h-4 w-4" />
                  View All Rooms
                </DropdownMenuItem>
                {showCreateRoom && (
                  <DropdownMenuItem onClick={handleCreateRoom}>
                    <Users className="mr-2 h-4 w-4" />
                    Create Room
                  </DropdownMenuItem>
                )}
                {showJoinRoom && (
                  <DropdownMenuItem onClick={handleJoinRoom}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Join Room
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
        </div>
        
        {/* Right Section - Icons and Profile */}
        <div className="flex items-center gap-2 lg:gap-4 ml-auto">
          {/* Search - Desktop & Mobile */}
          <SearchBox />
          
          {/* Theme Toggle - Desktop & Mobile */}
          <ThemeToggle />
          
          <MessageIcon />
          <NotificationIcon />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 lg:gap-3 px-2 lg:px-3 py-2 h-auto rounded-full hover:bg-accent">
                <Avatar className="h-8 w-8 lg:h-10 lg:w-10">
                  <AvatarImage 
                    src={
                      user.profile.profilePicture?.type === 'upload' 
                        ? user.profile.profilePicture.url 
                        : user.profile.profilePicture?.type === 'avatar'
                        ? `https://api.dicebear.com/7.x/${user.profile.profilePicture.avatarStyle?.toLowerCase().replace(/\s+/g, '-')}/svg?seed=${user.profile.profilePicture.seed || user.mobileNumber}`
                        : undefined
                    }
                  />
                  <AvatarFallback className="text-sm bg-primary text-primary-foreground">
                    {user.profile.profilePicture?.type === 'avatar' 
                      ? '🎭' 
                      : user.username?.charAt(0).toUpperCase() || user.mobileNumber?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:flex flex-col items-start">
                  <span className="text-sm font-medium text-foreground">@{user.username}</span>
                  <span className="text-xs text-muted-foreground">{user.mobileNumber}</span>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">@{user.username}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.mobileNumber}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/profile')}>
                <Edit3 className="mr-2 h-4 w-4" />
                <span>Edit Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/profile')}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleDeleteAccount}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Delete Account</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Navigation Row */}
      <div className="lg:hidden flex items-center justify-between w-full">
        {/* Mobile Navigation Menu - Only show if profile is complete */}
        {showNavigation && isComplete && (
          <div className="flex items-center gap-2 w-full">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Users className="h-4 w-4" />
                  Rooms
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => router.push('/rooms')}>
                  <Users className="mr-2 h-4 w-4" />
                  View All Rooms
                </DropdownMenuItem>
                {showCreateRoom && (
                  <DropdownMenuItem onClick={handleCreateRoom}>
                    <Users className="mr-2 h-4 w-4" />
                    Create Room
                  </DropdownMenuItem>
                )}
                {showJoinRoom && (
                  <DropdownMenuItem onClick={handleJoinRoom}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Join Room
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>


      {/* Create Room Modal */}
      <CreateRoomModal
        isOpen={showCreateRoomModal}
        onClose={() => setShowCreateRoomModal(false)}
        onCreateRoom={handleCreateRoomSubmit}
      />
    </div>
  );
}
