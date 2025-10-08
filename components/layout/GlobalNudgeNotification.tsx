'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useNudge } from '@/lib/contexts/NudgeContext';
import { NudgeNotificationContainer } from '@/components/ui/nudge-notification';
import { openChat } from '@/components/layout/GlobalChatManager';

export default function GlobalNudgeNotification() {
  const { notifications, hideNudge } = useNudge();
  const router = useRouter();

  const handleNudgeClick = (notification: any) => {
    // Handle different notification types
    if (notification.type === 'message') {
      // Check if it's a room message
      if (notification.roomId) {
        // Navigate to room chat page
        router.push(`/rooms/${notification.roomId}/chat`);
      } else if (notification.senderId && notification.senderUsername) {
        // Open direct message chat
        openChat({
          id: notification.senderId,
          username: notification.senderUsername,
          profilePicture: notification.senderProfilePicture
        });
      }
    }
    
    // Hide the notification after clicking
    hideNudge(notification.id);
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <NudgeNotificationContainer
      notifications={notifications}
      onClose={hideNudge}
      onClick={handleNudgeClick}
      maxNotifications={3}
    />
  );
}
