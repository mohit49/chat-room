'use client';

import { useCallback } from 'react';
import { useSocketEvents } from '@/hooks/useSocketEvents';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export default function GlobalFollowListener() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Handle follow request received
  const handleFollowRequest = useCallback(async (data: { followRequest: any; notification: any }) => {
    if (!user) return;
    
    const { followRequest, notification } = data;
    
    // Show toast notification
    toast({
      title: 'New Follow Request',
      description: notification.message,
      duration: 5000,
    });

    // You can also trigger push notification here if needed
    console.log('Follow request received:', followRequest);
  }, [user, toast]);

  // Handle follow request accepted
  const handleFollowAccepted = useCallback(async (data: { followRequest: any; notification: any }) => {
    if (!user) return;
    
    const { followRequest, notification } = data;
    
    // Show toast notification
    toast({
      title: 'Follow Request Accepted',
      description: notification.message,
      duration: 5000,
    });

    // You can also trigger push notification here if needed
    console.log('Follow request accepted:', followRequest);
  }, [user, toast]);

  // Register socket event handlers
  useSocketEvents({
    onFollowRequest: handleFollowRequest,
    onFollowAccepted: handleFollowAccepted,
  }, 'GlobalFollowListener');

  // This component doesn't render anything
  return null;
}


