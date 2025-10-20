"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { pushNotificationService, PushNotificationData } from '@/lib/services/pushNotificationService';

interface PushNotificationContextType {
  isSupported: boolean;
  permission: NotificationPermission;
  isSubscribed: boolean;
  isInitialized: boolean;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
  sendTestNotification: () => Promise<void>;
  requestPermission: () => Promise<NotificationPermission>;
}

const PushNotificationContext = createContext<PushNotificationContextType | undefined>(undefined);

interface PushNotificationProviderProps {
  children: ReactNode;
}

export function PushNotificationProvider({ children }: PushNotificationProviderProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializePushNotifications = async () => {
      const supported = pushNotificationService.isSupported();
      setIsSupported(supported);

      if (supported) {
        const initialized = await pushNotificationService.initialize();
        setIsInitialized(initialized);

        if (initialized) {
          const currentPermission = pushNotificationService.getPermissionStatus();
          setPermission(currentPermission);

          const subscribed = pushNotificationService.isSubscribed();
          setIsSubscribed(subscribed);
        }
      }
    };

    initializePushNotifications();
  }, []);

  const subscribe = async (): Promise<boolean> => {
    if (!isSupported || !isInitialized) {
      console.log('❌ Cannot subscribe: not supported or not initialized');
      return false;
    }

    console.log('📱 Starting push subscription...');
    const subscription = await pushNotificationService.subscribeToPush();
    const success = subscription !== null;
    
    console.log('📱 Subscription result:', success ? '✅ Success' : '❌ Failed');
    
    setIsSubscribed(success);
    
    if (success) {
      setPermission('granted');
      console.log('✅ Push notifications enabled successfully');
    } else {
      console.error('❌ Failed to create push subscription');
    }

    return success;
  };

  const unsubscribe = async (): Promise<boolean> => {
    if (!isSupported) {
      return false;
    }

    const success = await pushNotificationService.unsubscribeFromPush();
    setIsSubscribed(!success);
    return success;
  };

  const sendTestNotification = async (): Promise<void> => {
    if (!isSupported || !isInitialized) {
      return;
    }

    await pushNotificationService.sendTestNotification();
  };

  const requestPermission = async (): Promise<NotificationPermission> => {
    if (!isSupported) {
      return 'denied';
    }

    const newPermission = await pushNotificationService.requestPermission();
    setPermission(newPermission);
    return newPermission;
  };

  const value: PushNotificationContextType = {
    isSupported,
    permission,
    isSubscribed,
    isInitialized,
    subscribe,
    unsubscribe,
    sendTestNotification,
    requestPermission,
  };

  return (
    <PushNotificationContext.Provider value={value}>
      {children}
    </PushNotificationContext.Provider>
  );
}

export function usePushNotifications(): PushNotificationContextType {
  const context = useContext(PushNotificationContext);
  if (context === undefined) {
    throw new Error('usePushNotifications must be used within a PushNotificationProvider');
  }
  return context;
}
