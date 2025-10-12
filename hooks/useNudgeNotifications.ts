"use client";

import { useEnhancedNudge } from '@/lib/contexts/EnhancedNudgeContext';
import { NudgeNotificationData } from '@/components/ui/nudge-notification';

export function useNudgeNotifications() {
  const {
    showMessageNudge,
    showFollowNudge,
    showRoomNudge,
    showGeneralNudge,
    enablePushNotifications,
    disablePushNotifications,
    isPushEnabled
  } = useEnhancedNudge();

  return {
    // Message notifications
    notifyNewMessage: async (
      senderId: string,
      senderUsername: string,
      message: string,
      senderProfilePicture?: NudgeNotificationData['senderProfilePicture'],
      roomId?: string,
      roomName?: string
    ) => {
      await showMessageNudge(senderId, senderUsername, message, senderProfilePicture, roomId, roomName);
    },

    // Follow notifications
    notifyNewFollower: async (
      followerId: string,
      followerUsername: string,
      followerProfilePicture?: NudgeNotificationData['senderProfilePicture']
    ) => {
      await showFollowNudge(followerId, followerUsername, followerProfilePicture);
    },

    // Room notifications
    notifyRoomActivity: async (
      roomId: string,
      roomName: string,
      message: string,
      senderId?: string,
      senderUsername?: string
    ) => {
      await showRoomNudge(roomId, roomName, message, senderId, senderUsername);
    },

    // General notifications
    notifyGeneral: async (title: string, message: string, data?: any) => {
      await showGeneralNudge(title, message, data);
    },

    // Push notification controls
    enablePush: async () => {
      return await enablePushNotifications();
    },

    disablePush: async () => {
      return await disablePushNotifications();
    },

    isPushEnabled: () => {
      return isPushEnabled();
    }
  };
}
