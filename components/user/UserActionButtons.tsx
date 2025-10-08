'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  MessageCircle, 
  UserPlus, 
  UserMinus, 
  UserX, 
  Check,
  X,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { api } from '@/lib/api';

interface UserActionButtonsProps {
  targetUserId: string;
  targetUsername: string;
  onMessageClick: () => void;
  className?: string;
}

interface FollowStatus {
  isFollowing: boolean;
  isFollowedBy: boolean;
  isBlocked: boolean;
  isBlockedBy: boolean;
  followRequestSent: boolean;
  followRequestReceived: boolean;
}

export default function UserActionButtons({ 
  targetUserId, 
  targetUsername, 
  onMessageClick,
  className = '' 
}: UserActionButtonsProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [followStatus, setFollowStatus] = useState<FollowStatus>({
    isFollowing: false,
    isFollowedBy: false,
    isBlocked: false,
    isBlockedBy: false,
    followRequestSent: false,
    followRequestReceived: false
  });

  // Don't show buttons for own profile
  if (!user || user.id === targetUserId) {
    return null;
  }

  const handleFollow = async () => {
    if (loading) return;
    
    try {
      setLoading(true);
      
      if (followStatus.isFollowing) {
        // Unfollow
        const response = await api.unfollowUser(targetUserId);
        if (response.success) {
          setFollowStatus(prev => ({ ...prev, isFollowing: false }));
        }
      } else if (followStatus.followRequestSent) {
        // Cancel follow request
        const response = await api.cancelFollowRequest(targetUserId);
        if (response.success) {
          setFollowStatus(prev => ({ ...prev, followRequestSent: false }));
        }
      } else {
        // Send follow request
        const response = await api.sendFollowRequest(targetUserId);
        if (response.success) {
          setFollowStatus(prev => ({ ...prev, followRequestSent: true }));
        }
      }
    } catch (error) {
      console.error('Follow action failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBlock = async () => {
    if (loading) return;
    
    try {
      setLoading(true);
      
      if (followStatus.isBlocked) {
        // Unblock
        const response = await api.unblockUser(targetUserId);
        if (response.success) {
          setFollowStatus(prev => ({ ...prev, isBlocked: false }));
        }
      } else {
        // Block user
        const response = await api.blockUser(targetUserId);
        if (response.success) {
          setFollowStatus(prev => ({ 
            ...prev, 
            isBlocked: true,
            isFollowing: false,
            followRequestSent: false
          }));
        }
      }
    } catch (error) {
      console.error('Block action failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFollowButtonContent = () => {
    if (followStatus.isBlocked || followStatus.isBlockedBy) {
      return null; // Don't show follow button if blocked
    }

    if (followStatus.isFollowing) {
      return (
        <>
          <UserMinus className="h-4 w-4" />
          Unfollow
        </>
      );
    }

    if (followStatus.followRequestSent) {
      return (
        <>
          <X className="h-4 w-4" />
          Cancel Request
        </>
      );
    }

    if (followStatus.followRequestReceived) {
      return (
        <>
          <Check className="h-4 w-4" />
          Accept Request
        </>
      );
    }

    return (
      <>
        <UserPlus className="h-4 w-4" />
        Follow
      </>
    );
  };

  const getBlockButtonContent = () => {
    if (followStatus.isBlocked) {
      return (
        <>
          <UserX className="h-4 w-4" />
          Unblock
        </>
      );
    }

    return (
      <>
        <UserX className="h-4 w-4" />
        Block
      </>
    );
  };

  const getFollowButtonVariant = () => {
    if (followStatus.isFollowing) {
      return 'outline';
    }
    if (followStatus.followRequestSent) {
      return 'secondary';
    }
    return 'default';
  };

  const getBlockButtonVariant = () => {
    return followStatus.isBlocked ? 'outline' : 'destructive';
  };

  return (
    <div className={`flex gap-2 ${className}`}>
      {/* Send Message Button */}
      <Button
        onClick={onMessageClick}
        disabled={loading || followStatus.isBlocked || followStatus.isBlockedBy}
        className="flex-1"
      >
        <MessageCircle className="h-4 w-4 mr-2" />
        Send Message
      </Button>

      {/* Follow Button */}
      {!followStatus.isBlocked && !followStatus.isBlockedBy && (
        <Button
          onClick={handleFollow}
          disabled={loading}
          variant={getFollowButtonVariant()}
          className="flex-1"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            getFollowButtonContent()
          )}
        </Button>
      )}

      {/* Block Button */}
      <Button
        onClick={handleBlock}
        disabled={loading}
        variant={getBlockButtonVariant()}
        className="flex-1"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          getBlockButtonContent()
        )}
      </Button>
    </div>
  );
}
