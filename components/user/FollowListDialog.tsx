'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getFollowers, getFollowing, unfollowUser, removeFollower } from '@/lib/api/follow';
import { UserMinus, Loader2, Users, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { User } from '@/types';
import { useAuth } from '@/lib/contexts/AuthContext';

interface FollowListDialogProps {
  userId: string;
  followerCount: number;
  followingCount: number;
  trigger?: React.ReactNode;
  defaultTab?: 'followers' | 'following';
}

interface FollowerItem {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: string;
  user?: User;
}

export function FollowListDialog({
  userId,
  followerCount,
  followingCount,
  trigger,
  defaultTab = 'followers'
}: FollowListDialogProps) {
  const { user } = useAuth();
  const isOwnProfile = user?.id === userId; // Check if viewing own profile
  
  const [open, setOpen] = useState(false);
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [loadingFollowers, setLoadingFollowers] = useState(false);
  const [loadingFollowing, setLoadingFollowing] = useState(false);
  const [unfollowUserId, setUnfollowUserId] = useState<string | null>(null);
  const [removeFollowerId, setRemoveFollowerId] = useState<string | null>(null);
  const [unfollowLoading, setUnfollowLoading] = useState(false);
  const [removeFollowerLoading, setRemoveFollowerLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchFollowers();
      fetchFollowing();
    }
  }, [open]);

  const fetchFollowers = async () => {
    setLoadingFollowers(true);
    try {
      const data = await getFollowers(userId);
      console.log('✅ Followers data received:', data);
      console.log('✅ Followers data length:', data?.length);
      console.log('✅ Followers data sample:', data?.[0]);
      setFollowers(data);
    } catch (error: any) {
      console.error('Error fetching followers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load followers',
        variant: 'destructive',
      });
    } finally {
      setLoadingFollowers(false);
    }
  };

  const fetchFollowing = async () => {
    setLoadingFollowing(true);
    try {
      const data = await getFollowing(userId);
      console.log('✅ Following data received:', data);
      console.log('✅ Following data length:', data?.length);
      console.log('✅ Following data sample:', data?.[0]);
      setFollowing(data);
    } catch (error: any) {
      console.error('Error fetching following:', error);
      toast({
        title: 'Error',
        description: 'Failed to load following',
        variant: 'destructive',
      });
    } finally {
      setLoadingFollowing(false);
    }
  };

  const handleUnfollow = async () => {
    if (!unfollowUserId) return;

    setUnfollowLoading(true);
    try {
      await unfollowUser(unfollowUserId);
      
      // Update both lists to reflect the change
      setFollowing(prev => prev.filter(item => {
        const targetId = typeof item.followingId === 'object' ? item.followingId?.id : item.followingId;
        return targetId !== unfollowUserId;
      }));
      
      // Refresh followers list to update follow status
      fetchFollowers();
      
      toast({
        title: 'Unfollowed',
        description: 'You have unfollowed this user',
      });
    } catch (error: any) {
      console.error('Error unfollowing user:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to unfollow user',
        variant: 'destructive',
      });
    } finally {
      setUnfollowLoading(false);
      setUnfollowUserId(null);
    }
  };

  const handleRemoveFollower = async () => {
    if (!removeFollowerId) return;

    setRemoveFollowerLoading(true);
    try {
      // Use the new removeFollower API endpoint
      await removeFollower(removeFollowerId);
      
      // Update followers list
      setFollowers(prev => prev.filter(item => {
        const targetId = typeof item.followerId === 'object' ? item.followerId?.id || item.followerId?._id : item.followerId;
        return targetId !== removeFollowerId;
      }));
      
      toast({
        title: 'Follower Removed',
        description: 'You have removed this follower',
      });
    } catch (error: any) {
      console.error('Error removing follower:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to remove follower',
        variant: 'destructive',
      });
    } finally {
      setRemoveFollowerLoading(false);
      setRemoveFollowerId(null);
    }
  };

  const getProfilePictureUrl = (user: any) => {
    if (!user) return null;
    
    const profilePicture = user.profile?.profilePicture;
    if (!profilePicture) return null;

    if (profilePicture.type === 'upload' && profilePicture.url) {
      return profilePicture.url;
    } else if (profilePicture.type === 'avatar' && profilePicture.seed) {
      return `https://api.dicebear.com/7.x/${profilePicture.avatarStyle || 'avataaars'}/svg?seed=${profilePicture.seed}`;
    }
    
    return null;
  };

  const getUserInitials = (user: any) => {
    if (!user) return '?';
    if (user.username) {
      return user.username.substring(0, 2).toUpperCase();
    }
    if (user.mobileNumber) {
      return user.mobileNumber.substring(0, 2);
    }
    return '?';
  };

  const renderUserList = (users: any[], loading: boolean, isFollowing: boolean = false) => {
    console.log(`📋 Rendering ${isFollowing ? 'FOLLOWING' : 'FOLLOWERS'} tab with ${users.length} users`);
    
    if (loading) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (users.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Users className="h-12 w-12 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            {isFollowing ? 'Not following anyone yet' : 'No followers yet'}
          </p>
        </div>
      );
    }

    return (
      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-2">
          {users.map((item: any) => {
            // Extract the user object and ID
            const userField = isFollowing ? item.followingId : item.followerId;
            const displayUser = typeof userField === 'object' ? userField : item;
            
            // Try multiple ways to get the user ID
            let actualUserId = null;
            if (typeof userField === 'string') {
              actualUserId = userField;
            } else if (typeof userField === 'object' && userField) {
              actualUserId = userField._id || userField.id;
            }
            
            // Convert ObjectId to string if needed
            if (actualUserId && typeof actualUserId === 'object') {
              actualUserId = actualUserId.toString();
            }
            
            console.log('Debug:', { 
              isFollowing, 
              userField: typeof userField, 
              actualUserId,
              hasButton: isFollowing && actualUserId 
            });
            
            return (
              <div
                key={item._id || item.id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors border"
              >
                <Link 
                  href={`/users/${actualUserId}`}
                  className="flex items-center space-x-3 flex-1 min-w-0"
                  onClick={() => setOpen(false)}
                >
                  <Avatar className="h-12 w-12 border-2 border-background">
                    <AvatarImage src={getProfilePictureUrl(displayUser) || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {getUserInitials(displayUser)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate text-base">
                      {displayUser?.username ? `@${displayUser.username}` : displayUser?.mobileNumber || 'Unknown User'}
                    </p>
                    {displayUser?.profile?.location?.city && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        📍 {displayUser.profile.location.city}
                        {displayUser.profile.location.state && `, ${displayUser.profile.location.state}`}
                      </p>
                    )}
                  </div>
                </Link>
                
                {/* Show unfollow button in Following tab (only on own profile) */}
                {isOwnProfile && isFollowing && actualUserId && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setUnfollowUserId(actualUserId)}
                    className="ml-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <UserMinus className="h-4 w-4 mr-1" />
                    Unfollow
                  </Button>
                )}
                
                {/* Show remove button in Followers tab (only on own profile) */}
                {isOwnProfile && !isFollowing && actualUserId && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setRemoveFollowerId(actualUserId)}
                    className="ml-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    title="Remove follower"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="ghost" className="text-sm">
              <span className="font-semibold">{followerCount}</span>
              <span className="text-muted-foreground ml-1">followers</span>
              <span className="mx-2">•</span>
              <span className="font-semibold">{followingCount}</span>
              <span className="text-muted-foreground ml-1">following</span>
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Connections</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="followers">
                Followers ({followerCount})
              </TabsTrigger>
              <TabsTrigger value="following">
                Following ({followingCount})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="followers" className="mt-4">
              {renderUserList(followers, loadingFollowers, false)}
            </TabsContent>
            
            <TabsContent value="following" className="mt-4">
              {renderUserList(following, loadingFollowing, true)}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Unfollow Confirmation Dialog */}
      <AlertDialog open={!!unfollowUserId} onOpenChange={(open) => !open && setUnfollowUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unfollow user?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unfollow this user? You will need to send another follow request to follow them again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={unfollowLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnfollow} disabled={unfollowLoading}>
              {unfollowLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Unfollowing...
                </>
              ) : (
                'Unfollow'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove Follower Confirmation Dialog */}
      <AlertDialog open={!!removeFollowerId} onOpenChange={(open) => !open && setRemoveFollowerId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove follower?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this follower? They will no longer be able to see your posts and will need to follow you again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removeFollowerLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveFollower} disabled={removeFollowerLoading} className="bg-destructive hover:bg-destructive/90">
              {removeFollowerLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Removing...
                </>
              ) : (
                'Remove Follower'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

