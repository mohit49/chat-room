"use client";

import { pushNotificationService } from '@/lib/services/pushNotificationService';
import { NudgeNotificationData } from '@/components/ui/nudge-notification';

export interface EnhancedNudgeOptions {
  showInApp?: boolean;
  showPush?: boolean;
  requireInteraction?: boolean;
  silent?: boolean;
}

class EnhancedNudgeService {
  private isInitialized = false;
  private pushEnabled = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Initialize push notification service
      const pushInitialized = await pushNotificationService.initialize();
      if (pushInitialized) {
        // Check if user has subscribed to push notifications
        this.pushEnabled = pushNotificationService.isSubscribed();
      }
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize enhanced nudge service:', error);
    }
  }

  async showNudge(
    notification: Omit<NudgeNotificationData, 'id' | 'timestamp'>,
    options: EnhancedNudgeOptions = {}
  ): Promise<void> {
    const {
      showInApp = true,
      showPush = true,
      requireInteraction = false,
      silent = false
    } = options;

    // Always show in-app notification
    if (showInApp) {
      this.showInAppNudge(notification);
    }

    // Show push notification if enabled and user has subscribed
    if (showPush && this.pushEnabled && !silent) {
      await this.showPushNudge(notification, { requireInteraction });
    }
  }

  private showInAppNudge(notification: Omit<NudgeNotificationData, 'id' | 'timestamp'>): void {
    // This will be handled by the existing nudge context
    // We'll dispatch a custom event that the nudge context can listen to
    const event = new CustomEvent('showNudge', {
      detail: notification
    });
    window.dispatchEvent(event);
  }

  private async showPushNudge(
    notification: Omit<NudgeNotificationData, 'id' | 'timestamp'>,
    options: { requireInteraction?: boolean }
  ): Promise<void> {
    if (!this.pushEnabled) return;

    try {
      const pushData = this.formatNudgeForPush(notification);
      
      // Send push notification through service worker
      if ('serviceWorker' in navigator && 'Notification' in window) {
        const registration = await navigator.serviceWorker.ready;
        
        // Try to send message to service worker for background notifications
        if (registration.active) {
          registration.active.postMessage({
            type: 'SHOW_NOTIFICATION',
            title: pushData.title,
            body: pushData.body,
            data: pushData.data
          });
        }
        
        // Also show notification directly
        await registration.showNotification(pushData.title, {
          body: pushData.body,
          icon: pushData.icon,
          badge: pushData.badge,
          tag: pushData.tag,
          requireInteraction: options.requireInteraction || true,
          vibrate: [200, 100, 200], // Vibration pattern
          silent: false,
          data: pushData.data,
          actions: pushData.actions
        } as any);
      }
    } catch (error) {
      console.error('Failed to show push nudge:', error);
    }
  }

  private formatNudgeForPush(notification: Omit<NudgeNotificationData, 'id' | 'timestamp'>) {
    const getIcon = () => {
      switch (notification.type) {
        case 'message':
          return '/icon-192x192.svg';
        case 'follow':
          return '/icon-192x192.svg';
        case 'room':
          return '/icon-192x192.svg';
        default:
          return '/icon-192x192.svg';
      }
    };

    const getTag = () => {
      switch (notification.type) {
        case 'message':
          return notification.roomId ? `room-${notification.roomId}` : `dm-${notification.senderId}`;
        case 'follow':
          return `follow-${notification.senderId}`;
        case 'room':
          return `room-${notification.roomId}`;
        default:
          return 'general';
      }
    };

    const getActions = () => {
      const actions = [];
      
      if (notification.type === 'message') {
        actions.push({
          action: 'open',
          title: 'Open Chat',
          icon: '/icon-192x192.svg'
        });
      } else if (notification.type === 'follow') {
        actions.push({
          action: 'open',
          title: 'View Profile',
          icon: '/icon-192x192.svg'
        });
      } else if (notification.type === 'room') {
        actions.push({
          action: 'open',
          title: 'Join Room',
          icon: '/icon-192x192.svg'
        });
      }

      actions.push({
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icon-192x192.svg'
      });

      return actions;
    };

    return {
      title: notification.title,
      body: notification.message,
      icon: getIcon(),
      badge: '/icon-192x192.svg',
      tag: getTag(),
      data: {
        type: notification.type,
        senderId: notification.senderId,
        senderUsername: notification.senderUsername,
        roomId: notification.roomId,
        roomName: notification.roomName,
        timestamp: new Date().toISOString()
      },
      actions: getActions()
    };
  }

  async enablePushNotifications(): Promise<boolean> {
    try {
      const subscription = await pushNotificationService.subscribeToPush();
      this.pushEnabled = subscription !== null;
      return subscription !== null;
    } catch (error) {
      console.error('Failed to enable push notifications:', error);
      return false;
    }
  }

  async disablePushNotifications(): Promise<boolean> {
    try {
      const success = await pushNotificationService.unsubscribeFromPush();
      this.pushEnabled = !success;
      return success;
    } catch (error) {
      console.error('Failed to disable push notifications:', error);
      return false;
    }
  }

  isPushEnabled(): boolean {
    return this.pushEnabled;
  }

  // Method to show different types of nudges
  async showMessageNudge(
    senderId: string,
    senderUsername: string,
    message: string,
    senderProfilePicture?: NudgeNotificationData['senderProfilePicture'],
    roomId?: string,
    roomName?: string
  ): Promise<void> {
    const title = roomId ? `${senderUsername} in ${roomName}` : `${senderUsername}`;
    const notificationMessage = roomId ? message : `New message: ${message}`;

    await this.showNudge({
      type: 'message',
      title,
      message: notificationMessage,
      senderId,
      senderUsername,
      senderProfilePicture,
      roomId,
      roomName
    }, {
      showInApp: true,
      showPush: true,
      requireInteraction: false
    });
  }

  async showFollowNudge(
    followerId: string,
    followerUsername: string,
    followerProfilePicture?: NudgeNotificationData['senderProfilePicture']
  ): Promise<void> {
    await this.showNudge({
      type: 'follow',
      title: 'New Follower',
      message: `${followerUsername} started following you`,
      senderId: followerId,
      senderUsername: followerUsername,
      senderProfilePicture: followerProfilePicture
    }, {
      showInApp: true,
      showPush: true,
      requireInteraction: false
    });
  }

  async showRoomNudge(
    roomId: string,
    roomName: string,
    message: string,
    senderId?: string,
    senderUsername?: string
  ): Promise<void> {
    const title = senderUsername ? `${senderUsername} in ${roomName}` : roomName;
    
    await this.showNudge({
      type: 'room',
      title,
      message,
      senderId,
      senderUsername,
      roomId,
      roomName
    }, {
      showInApp: true,
      showPush: true,
      requireInteraction: false
    });
  }

  async showGeneralNudge(
    title: string,
    message: string,
    data?: any
  ): Promise<void> {
    await this.showNudge({
      type: 'general',
      title,
      message,
      data
    }, {
      showInApp: true,
      showPush: true,
      requireInteraction: false
    });
  }
}

// Create singleton instance
export const enhancedNudgeService = new EnhancedNudgeService();
