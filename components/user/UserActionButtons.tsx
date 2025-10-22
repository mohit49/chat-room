'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  MessageCircle, 
  UserX, 
  Loader2,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { FollowButton } from './FollowButton';
import { checkBlockStatus, blockUser as blockUserAPI, unblockUser as unblockUserAPI, BlockStatus } from '@/lib/api/block';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface UserActionButtonsProps {
  targetUserId: string;
  targetUsername: string;
  onMessageClick: () => void;
  className?: string;
}

export default function UserActionButtons({ 
  targetUserId, 
  targetUsername, 
  onMessageClick,
  className = '' 
}: UserActionButtonsProps) {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [blockStatus, setBlockStatus] = useState<BlockStatus>({
    isBlocked: false,
    isBlockedBy: false
  });
  const [loadingBlockStatus, setLoadingBlockStatus] = useState(true);

  // Don't show buttons for own profile
  if (!user || user.id === targetUserId) {
    return null;
  }

  useEffect(() => {
    fetchBlockStatus();
  }, [targetUserId]);

  const fetchBlockStatus = async () => {
    try {
      setLoadingBlockStatus(true);
      const status = await checkBlockStatus(targetUserId);
      setBlockStatus(status);
    } catch (error) {
      console.error('Error checking block status:', error);
    } finally {
      setLoadingBlockStatus(false);
    }
  };

  const handleBlock = async () => {
    if (loading) return;
    
    try {
      setLoading(true);
      
      if (blockStatus.isBlocked) {
        // Unblock
        await unblockUserAPI(targetUserId);
        setBlockStatus({ isBlocked: false, isBlockedBy: false });
        toast({
          title: "User unblocked",
          description: `You have unblocked @${targetUsername}`,
        });
      } else {
        // Block user
        await blockUserAPI(targetUserId);
        setBlockStatus({ isBlocked: true, isBlockedBy: false });
        toast({
          title: "User blocked",
          description: `You have blocked @${targetUsername}. They can no longer interact with you.`,
        });
        
        // Optionally redirect back
        // router.push('/home');
      }
    } catch (error: any) {
      console.error('Block action failed:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update block status",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // If blocked by the other user, show a message
  if (blockStatus.isBlockedBy) {
    return (
      <div className={`flex flex-col items-center gap-2 p-4 border rounded-lg ${className}`}>
        <ShieldAlert className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground text-center">
          This user has restricted their profile
        </p>
      </div>
    );
  }

  if (loadingBlockStatus) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const getBlockButtonContent = () => {
    if (blockStatus.isBlocked) {
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

  const getBlockButtonVariant = () => {
    return blockStatus.isBlocked ? 'outline' : 'destructive';
  };

  return (
    <div className={`flex gap-2 ${className}`}>
      {/* Send Message Button */}
      {!blockStatus.isBlocked && (
        <Button
          onClick={onMessageClick}
          disabled={loading}
          className="flex-1"
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          Send Message
        </Button>
      )}

      {/* Follow Button */}
      {!blockStatus.isBlocked && (
        <FollowButton
          userId={targetUserId}
          username={targetUsername}
          className="flex-1"
        />
      )}

      {/* Block Button */}
      <Button
        onClick={handleBlock}
        disabled={loading}
        variant={getBlockButtonVariant()}
        className={blockStatus.isBlocked ? 'flex-1' : 'flex-1'}
        title={blockStatus.isBlocked ? 'Unblock this user' : 'Block this user'}
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
