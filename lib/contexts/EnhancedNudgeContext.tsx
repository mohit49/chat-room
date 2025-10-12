"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { NudgeNotificationData } from '@/components/ui/nudge-notification';
import { enhancedNudgeService, EnhancedNudgeOptions } from '@/lib/services/enhancedNudgeService';

interface EnhancedNudgeContextType {
  notifications: NudgeNotificationData[];
  showNudge: (notification: Omit<NudgeNotificationData, 'id' | 'timestamp'>, options?: EnhancedNudgeOptions) => Promise<void>;
  hideNudge: (id: string) => void;
  clearAllNudges: () => void;
  // Enhanced methods for different notification types
  showMessageNudge: (senderId: string, senderUsername: string, message: string, senderProfilePicture?: NudgeNotificationData['senderProfilePicture'], roomId?: string, roomName?: string) => Promise<void>;
  showFollowNudge: (followerId: string, followerUsername: string, followerProfilePicture?: NudgeNotificationData['senderProfilePicture']) => Promise<void>;
  showRoomNudge: (roomId: string, roomName: string, message: string, senderId?: string, senderUsername?: string) => Promise<void>;
  showGeneralNudge: (title: string, message: string, data?: any) => Promise<void>;
  // Push notification controls
  enablePushNotifications: () => Promise<boolean>;
  disablePushNotifications: () => Promise<boolean>;
  isPushEnabled: () => boolean;
}

const EnhancedNudgeContext = createContext<EnhancedNudgeContextType | undefined>(undefined);

export const useEnhancedNudge = () => {
  const context = useContext(EnhancedNudgeContext);
  if (!context) {
    throw new Error('useEnhancedNudge must be used within an EnhancedNudgeProvider');
  }
  return context;
};

export const EnhancedNudgeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NudgeNotificationData[]>([]);

  useEffect(() => {
    // Initialize the enhanced nudge service
    enhancedNudgeService.initialize();

    // Listen for custom nudge events from the enhanced service
    const handleShowNudge = (event: CustomEvent) => {
      const notification = event.detail;
      const newNudge: NudgeNotificationData = {
        ...notification,
        id: `nudge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString()
      };

      setNotifications(prev => {
        // Remove any existing nudges of the same type to avoid duplicates
        const filtered = prev.filter(n => n.type !== notification.type || n.senderId !== notification.senderId);
        return [...filtered, newNudge];
      });
    };

    window.addEventListener('showNudge', handleShowNudge as EventListener);

    return () => {
      window.removeEventListener('showNudge', handleShowNudge as EventListener);
    };
  }, []);

  const showNudge = useCallback(async (
    notification: Omit<NudgeNotificationData, 'id' | 'timestamp'>,
    options: EnhancedNudgeOptions = {}
  ) => {
    await enhancedNudgeService.showNudge(notification, options);
  }, []);

  const hideNudge = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  }, []);

  const clearAllNudges = useCallback(() => {
    setNotifications([]);
  }, []);

  // Enhanced methods for different notification types
  const showMessageNudge = useCallback(async (
    senderId: string,
    senderUsername: string,
    message: string,
    senderProfilePicture?: NudgeNotificationData['senderProfilePicture'],
    roomId?: string,
    roomName?: string
  ) => {
    await enhancedNudgeService.showMessageNudge(
      senderId,
      senderUsername,
      message,
      senderProfilePicture,
      roomId,
      roomName
    );
  }, []);

  const showFollowNudge = useCallback(async (
    followerId: string,
    followerUsername: string,
    followerProfilePicture?: NudgeNotificationData['senderProfilePicture']
  ) => {
    await enhancedNudgeService.showFollowNudge(
      followerId,
      followerUsername,
      followerProfilePicture
    );
  }, []);

  const showRoomNudge = useCallback(async (
    roomId: string,
    roomName: string,
    message: string,
    senderId?: string,
    senderUsername?: string
  ) => {
    await enhancedNudgeService.showRoomNudge(
      roomId,
      roomName,
      message,
      senderId,
      senderUsername
    );
  }, []);

  const showGeneralNudge = useCallback(async (
    title: string,
    message: string,
    data?: any
  ) => {
    await enhancedNudgeService.showGeneralNudge(title, message, data);
  }, []);

  // Push notification controls
  const enablePushNotifications = useCallback(async () => {
    return await enhancedNudgeService.enablePushNotifications();
  }, []);

  const disablePushNotifications = useCallback(async () => {
    return await enhancedNudgeService.disablePushNotifications();
  }, []);

  const isPushEnabled = useCallback(() => {
    return enhancedNudgeService.isPushEnabled();
  }, []);

  return (
    <EnhancedNudgeContext.Provider value={{
      notifications,
      showNudge,
      hideNudge,
      clearAllNudges,
      showMessageNudge,
      showFollowNudge,
      showRoomNudge,
      showGeneralNudge,
      enablePushNotifications,
      disablePushNotifications,
      isPushEnabled
    }}>
      {children}
    </EnhancedNudgeContext.Provider>
  );
};
