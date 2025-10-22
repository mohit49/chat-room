'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  sendFollowRequest, 
  unfollowUser, 
  cancelFollowRequest, 
  getFollowStatus,
  FollowStatus
} from '@/lib/api/follow';
import { UserPlus, UserMinus, Clock, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface FollowButtonProps {
  userId: string;
  username?: string;
  onFollowStatusChange?: (status: FollowStatus) => void;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

export function FollowButton({ 
  userId, 
  username,
  onFollowStatusChange,
  variant = 'default',
  size = 'default',
  className = ''
}: FollowButtonProps) {
  const [followStatus, setFollowStatus] = useState<FollowStatus>({
    isFollowing: false,
    isFollowedBy: false,
    followRequestSent: false,
    followRequestReceived: false
  });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showUnfollowDialog, setShowUnfollowDialog] = useState(false);
  const { toast } = useToast();

  // Fetch initial follow status
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const status = await getFollowStatus(userId);
        setFollowStatus(status);
        onFollowStatusChange?.(status);
      } catch (error: any) {
        console.error('Error fetching follow status:', error);
      } finally {
        setInitialLoading(false);
      }
    };

    fetchStatus();
  }, [userId, onFollowStatusChange]);

  // Refresh status when component becomes visible (handles browser back/forward)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && !initialLoading) {
        try {
          const status = await getFollowStatus(userId);
          setFollowStatus(status);
          onFollowStatusChange?.(status);
        } catch (error: any) {
          console.error('Error refreshing follow status:', error);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [userId, initialLoading, onFollowStatusChange]);

  const handleFollow = async () => {
    setLoading(true);
    try {
      await sendFollowRequest(userId);
      
      // After successful API response, set to following directly (not requested)
      const newStatus = {
        ...followStatus,
        isFollowing: true,
        followRequestSent: false
      };
      setFollowStatus(newStatus);
      onFollowStatusChange?.(newStatus);
      
      toast({
        title: 'Now Following',
        description: `You are now following ${username || 'this user'}`,
      });
    } catch (error: any) {
      console.error('Error sending follow request:', error);
      
      // If the error is "already sent" or "already following", refresh the status
      const errorMessage = error.response?.data?.error || error.message || 'Failed to send follow request';
      if (errorMessage.includes('already sent') || errorMessage.includes('Already following')) {
        try {
          // Refresh the follow status from server
          const status = await getFollowStatus(userId);
          setFollowStatus(status);
          onFollowStatusChange?.(status);
          
          // Show appropriate message based on status
          if (status.isFollowing) {
            toast({
              title: 'Already Following',
              description: `You are already following ${username || 'this user'}`,
            });
          } else if (status.followRequestSent) {
            toast({
              title: 'Request Already Sent',
              description: 'Your follow request is pending approval',
            });
          }
        } catch (refreshError) {
          console.error('Error refreshing follow status:', refreshError);
        }
      } else {
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRequest = async () => {
    setLoading(true);
    try {
      await cancelFollowRequest(userId);
      const newStatus = {
        ...followStatus,
        followRequestSent: false
      };
      setFollowStatus(newStatus);
      onFollowStatusChange?.(newStatus);
      
      toast({
        title: 'Request cancelled',
        description: 'Your follow request has been cancelled',
      });
    } catch (error: any) {
      console.error('Error cancelling follow request:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to cancel follow request',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUnfollow = async () => {
    setLoading(true);
    try {
      await unfollowUser(userId);
      const newStatus = {
        ...followStatus,
        isFollowing: false
      };
      setFollowStatus(newStatus);
      onFollowStatusChange?.(newStatus);
      
      toast({
        title: 'Unfollowed',
        description: `You have unfollowed ${username || 'this user'}`,
      });
    } catch (error: any) {
      console.error('Error unfollowing user:', error);
      
      // Refresh status in case of error
      try {
        const status = await getFollowStatus(userId);
        setFollowStatus(status);
        onFollowStatusChange?.(status);
      } catch (refreshError) {
        console.error('Error refreshing follow status:', refreshError);
      }
      
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to unfollow user',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setShowUnfollowDialog(false);
    }
  };

  if (initialLoading) {
    return (
      <Button variant={variant} size={size} disabled className={className}>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  // If already following, show unfollow button
  if (followStatus.isFollowing) {
    return (
      <>
        <Button
          variant={variant}
          size={size}
          onClick={() => setShowUnfollowDialog(true)}
          disabled={loading}
          className={className}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <UserMinus className="h-4 w-4 mr-2" />
          )}
          Following
        </Button>

        <AlertDialog open={showUnfollowDialog} onOpenChange={setShowUnfollowDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Unfollow {username || 'this user'}?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to unfollow this user? You will need to send another follow request to follow them again.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleUnfollow}>
                Unfollow
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  // If follow request is pending, show cancel button
  if (followStatus.followRequestSent) {
    return (
      <Button
        variant="outline"
        size={size}
        onClick={handleCancelRequest}
        disabled={loading}
        className={className}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Clock className="h-4 w-4 mr-2" />
        )}
        Requested
      </Button>
    );
  }

  // Default: show follow button
  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleFollow}
      disabled={loading}
      className={className}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <UserPlus className="h-4 w-4 mr-2" />
      )}
      Follow
    </Button>
  );
}

