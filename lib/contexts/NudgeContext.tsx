'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { NudgeNotificationData } from '@/components/ui/nudge-notification';

interface NudgeContextType {
  notifications: NudgeNotificationData[];
  showNudge: (notification: Omit<NudgeNotificationData, 'id' | 'timestamp'>) => void;
  hideNudge: (id: string) => void;
  clearAllNudges: () => void;
}

const NudgeContext = createContext<NudgeContextType | undefined>(undefined);

export const useNudge = () => {
  const context = useContext(NudgeContext);
  if (!context) {
    throw new Error('useNudge must be used within a NudgeProvider');
  }
  return context;
};

export const NudgeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NudgeNotificationData[]>([]);

  const showNudge = useCallback((notification: Omit<NudgeNotificationData, 'id' | 'timestamp'>) => {
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
  }, []);

  const hideNudge = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  }, []);

  const clearAllNudges = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <NudgeContext.Provider value={{
      notifications,
      showNudge,
      hideNudge,
      clearAllNudges
    }}>
      {children}
    </NudgeContext.Provider>
  );
};

