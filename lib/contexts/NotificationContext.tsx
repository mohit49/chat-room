'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { api } from '@/lib/api';

interface GlobalNotification {
  id: string;
  type: 'message' | 'follow' | 'room' | 'general';
  title: string;
  message: string;
  senderId?: string;
  senderUsername?: string;
  senderProfilePicture?: {
    type: 'upload' | 'avatar';
    url?: string;
    avatarStyle?: string;
    seed?: string;
  };
  timestamp: string;
  data?: any;
}

interface NotificationContextType {
  notifications: GlobalNotification[];
  showNotification: (notification: Omit<GlobalNotification, 'id' | 'timestamp'>) => void;
  hideNotification: (id: string) => void;
  clearAllNotifications: () => void;
  markAsRead: (id: string) => void;
  reloadNotifications: () => Promise<void>;
  loading: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useGlobalNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useGlobalNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<GlobalNotification[]>([]);
  const [loading, setLoading] = useState(false);

  // Load notifications from database when user changes
  useEffect(() => {
    if (user) {
      loadNotifications();
    } else {
      setNotifications([]);
    }
  }, [user]);

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.getNotifications() as any;
      if (response.success && response.notifications) {
        // Convert database notifications to global notification format
        console.log('📨 Loading notifications from database:', response.notifications.length, 'total');
        const unreadNotifications = response.notifications.filter((notif: any) => notif.status !== 'read');
        console.log('📨 Unread notifications:', unreadNotifications.length);
        
        const allNotifications: GlobalNotification[] = unreadNotifications
          .map((notif: any) => ({
            id: notif.id,
            type: notif.type === 'direct_message' ? 'message' : 
                  notif.type === 'follow_request' ? 'follow' : 
                  notif.type.includes('room') ? 'room' : 'general',
            title: notif.title,
            message: notif.message,
            senderId: notif.senderId,
            senderUsername: notif.senderUsername || notif.metadata?.senderUsername,
            senderProfilePicture: notif.senderProfilePicture || notif.metadata?.senderProfilePicture,
            timestamp: notif.createdAt || notif.timestamp,
            data: notif.data || notif.metadata
          }));

        setNotifications(allNotifications);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const showNotification = useCallback(async (notification: Omit<GlobalNotification, 'id' | 'timestamp'>) => {
    // Create new notifications
    const tempNotification: GlobalNotification = {
      ...notification,
      id: `global_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    };

    setNotifications(prev => [...prev, tempNotification]);

    // Auto-hide after 5 seconds
    setTimeout(() => {
      hideNotification(tempNotification.id);
    }, 5000);
  }, []);

  const hideNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await api.markNotificationAsRead(id);
      setNotifications(prev => prev.filter(notif => notif.id !== id));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, []);

  const clearAllNotifications = useCallback(async () => {
    try {
      await api.clearAllNotifications();
      setNotifications([]);
    } catch (error) {
      console.error('Failed to clear all notifications:', error);
    }
  }, []);

  return (
    <NotificationContext.Provider value={{
      notifications,
      showNotification,
      hideNotification,
      clearAllNotifications,
      markAsRead,
      reloadNotifications: loadNotifications,
      loading
    }}>
      {children}
    </NotificationContext.Provider>
  );
};
