"use client";

import { apiClient } from '@/lib/api/client';

export interface PushNotificationData {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  requireInteraction?: boolean;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

class PushNotificationService {
  private registration: ServiceWorkerRegistration | null = null;
  private subscription: PushSubscription | null = null;

  async initialize(): Promise<boolean> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('Push messaging is not supported');
      return false;
    }

    try {
      this.registration = await navigator.serviceWorker.ready;
      return true;
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
      return false;
    }
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return 'denied';
    }

    const permission = await Notification.requestPermission();
    console.log('Notification permission:', permission);
    return permission;
  }

  async subscribeToPush(): Promise<PushSubscription | null> {
    if (!this.registration) {
      console.error('Service worker not registered');
      return null;
    }

    try {
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        console.log('Notification permission denied');
        return null;
      }

      // Check if we already have a subscription
      this.subscription = await this.registration.pushManager.getSubscription();
      
      if (this.subscription) {
        console.log('Already subscribed to push notifications');
        return this.subscription;
      }

      // Create new subscription
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        console.error('VAPID public key not found');
        return null;
      }

      this.subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey)
      });

      console.log('Subscribed to push notifications:', this.subscription);

      // Send subscription to server
      await this.sendSubscriptionToServer(this.subscription);

      return this.subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return null;
    }
  }

  async unsubscribeFromPush(): Promise<boolean> {
    if (!this.subscription) {
      return true;
    }

    try {
      const result = await this.subscription.unsubscribe();
      if (result) {
        this.subscription = null;
        // Notify server about unsubscription
        await this.removeSubscriptionFromServer();
        console.log('Unsubscribed from push notifications');
      }
      return result;
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      return false;
    }
  }

  async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    try {
      const token = this.getAuthToken();
      if (!token) {
        console.error('No auth token found');
        return;
      }

      await apiClient.post('/notifications/push/subscribe', {
        subscription: subscription.toJSON()
      }, token);
      console.log('✅ Subscription sent to server');
    } catch (error) {
      console.error('❌ Failed to send subscription to server:', error);
    }
  }

  async removeSubscriptionFromServer(): Promise<void> {
    try {
      const token = this.getAuthToken();
      if (!token) {
        console.error('No auth token found');
        return;
      }

      await apiClient.post('/notifications/push/unsubscribe', {}, token);
      console.log('✅ Unsubscription sent to server');
    } catch (error) {
      console.error('❌ Failed to remove subscription from server:', error);
    }
  }

  private getAuthToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  }

  async sendTestNotification(): Promise<void> {
    if (!this.registration) {
      console.error('Service worker not registered');
      return;
    }

    try {
      await this.registration.showNotification('Test Notification', {
        body: 'This is a test notification from Chat App',
        icon: '/logo-icon.png',
        badge: '/logo-icon.png',
        tag: 'test-notification',
        requireInteraction: true,
        vibrate: [200, 100, 200], // Vibration pattern
        silent: false,
        actions: [
          {
            action: 'open',
            title: 'Open App'
          },
          {
            action: 'dismiss',
            title: 'Dismiss'
          }
        ]
      } as any);
    } catch (error) {
      console.error('Failed to send test notification:', error);
    }
  }

  isSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  }

  getPermissionStatus(): NotificationPermission {
    if (!('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission;
  }

  isSubscribed(): boolean {
    return this.subscription !== null;
  }

  private urlBase64ToUint8Array(base64String: string): ArrayBuffer {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray.buffer;
  }
}

// Create singleton instance
export const pushNotificationService = new PushNotificationService();
