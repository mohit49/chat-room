'use client';

import { useCallback } from 'react';
import { useSocketEvents } from '@/hooks/useSocketEvents';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export default function GlobalFollowListener() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Handle notifications (including follow-related ones)
  const handleNotification = useCallback(async (notification: any) => {
    if (!user) return;
    
    // Only show toast for follow-related notifications
    if (notification.type === 'follow_request') {
      toast({
        title: 'New Follow Request',
        description: notification.message || `@${notification.metadata?.senderUsername} sent you a follow request`,
        duration: 5000,
      });
      console.log('Follow request received:', notification);
    } else if (notification.type === 'follow_accepted') {
      toast({
        title: 'Follow Request Accepted',
        description: notification.message || `@${notification.metadata?.senderUsername} accepted your follow request`,
        duration: 5000,
      });
      console.log('Follow request accepted:', notification);
    }
  }, [user, toast]);

  // Register socket event handlers
  useSocketEvents({
    onNotification: handleNotification,
  }, 'GlobalFollowListener');

  // This component doesn't render anything
  return null;
}



