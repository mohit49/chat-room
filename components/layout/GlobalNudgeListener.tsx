'use client';

import { useCallback, useState, useEffect } from 'react';
import { useSocket } from '@/lib/contexts/SocketContext';
import { useSocketEvents } from '@/hooks/useSocketEvents';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useNudge } from '@/lib/contexts/NudgeContext';
import { useEnhancedNudge } from '@/lib/contexts/EnhancedNudgeContext';
import { isAnyChatOpen } from '@/components/layout/GlobalChatManager';
import { api } from '@/lib/api';

export default function GlobalNudgeListener() {
  const { user } = useAuth();
  const { socket, connected, connectionConfirmed } = useSocket();
  const { showNudge } = useNudge();
  const { showMessageNudge, showFollowNudge, showRoomNudge } = useEnhancedNudge();
  const [userRooms, setUserRooms] = useState<Set<string>>(new Set());

  // Fetch user's rooms on mount
  useEffect(() => {
    const fetchUserRooms = async () => {
      if (!user) return;
      
      try {
        const response = await api.getRooms() as any;
        if (response.success && response.rooms) {
          const roomIds = new Set<string>(response.rooms.map((room: any) => room.id as string));
          setUserRooms(roomIds);
        }
      } catch (error) {
        console.error('Failed to fetch user rooms:', error);
      }
    };

    fetchUserRooms();
  }, [user]);

  // Memoize the handlers to prevent unnecessary re-renders
  const handleDirectMessage = useCallback(async (message: any) => {
    // Only show nudge if user is not in a chat and message is not from current user
    if (user && message.senderId !== user.id && !isAnyChatOpen()) {
      // Use enhanced nudge system for push notifications
      await showMessageNudge(
        message.senderId,
        message.senderUsername,
        message.message || 'You have a new message',
        message.senderProfilePicture
      );
      
      // Also show in-app nudge for backward compatibility
      showNudge({
        type: 'message',
        title: 'New Message',
        message: message.message || 'You have a new message',
        senderId: message.senderId,
        senderUsername: message.senderUsername,
        senderProfilePicture: message.senderProfilePicture,
        data: message
      });
    }
  }, [user, showNudge, showMessageNudge]);

  const handleNewMessage = useCallback(async (message: any) => {
    // Only show nudge if:
    // 1. Message is not from current user
    // 2. User is not in any active chat
    // 3. User is a member of the room (has access)
    if (user && 
        message.userId !== user.id && 
        !isAnyChatOpen() && 
        message.roomId && 
        userRooms.has(message.roomId)) {
      
      // Use enhanced nudge system for push notifications
      await showRoomNudge(
        message.roomId,
        message.roomName || 'Room',
        message.message || 'New message in room',
        message.userId,
        message.username
      );
      
      // Also show in-app nudge for backward compatibility
      showNudge({
        type: 'message',
        title: 'New Room Message',
        message: message.message || 'New message in room',
        senderId: message.userId,
        senderUsername: message.username,
        senderProfilePicture: message.userProfilePicture,
        roomId: message.roomId,
        roomName: message.roomName,
        data: message
      });
    }
  }, [user, showNudge, showRoomNudge, userRooms]);

  const handleMessageNotification = useCallback(async (notification: any) => {
    // Show nudge for message notifications
    if (user && notification.senderId !== user.id) {
      // Use enhanced nudge system for push notifications
      if (notification.roomId) {
        await showRoomNudge(
          notification.roomId,
          notification.roomName || 'Room',
          notification.message || 'You have a new message',
          notification.senderId,
          notification.senderUsername
        );
      } else {
        await showMessageNudge(
          notification.senderId,
          notification.senderUsername,
          notification.message || 'You have a new message',
          notification.senderProfilePicture
        );
      }
      
      // Also show in-app nudge for backward compatibility
      showNudge({
        type: 'message',
        title: notification.title || 'New Message',
        message: notification.message || 'You have a new message',
        senderId: notification.senderId,
        senderUsername: notification.senderUsername,
        senderProfilePicture: notification.senderProfilePicture,
        data: notification
      });
    }
  }, [user, showNudge, showMessageNudge, showRoomNudge]);

  // Handle room updates (when user joins or is added to a room)
  const handleRoomUpdate = useCallback((data: any) => {
    if (data.roomId) {
      setUserRooms(prev => new Set([...prev, data.roomId]));
    }
  }, []);

  // Socket events for nudges
  useSocketEvents({
    onDirectMessage: handleDirectMessage,
    onNewMessage: handleNewMessage,
    onMessageNotification: handleMessageNotification,
    onNotification: (notification: any) => {
      // Update room list if user is invited/added to a room
      if (notification.type === 'room_invitation' && notification.data?.roomId) {
        handleRoomUpdate(notification.data);
      }
    }
  }, 'GlobalNudgeListener');

  // This component doesn't render anything, it just listens for notifications
  return null;
}
