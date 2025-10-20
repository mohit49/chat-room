import webpush from 'web-push';
import PushSubscription from '../database/schemas/pushSubscription.schema';
import config from '../config';

// Configure web-push with VAPID keys
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidEmail = process.env.VAPID_EMAIL || 'mailto:admin@chatapp.com';

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    vapidEmail,
    vapidPublicKey,
    vapidPrivateKey
  );
  console.log('✅ VAPID keys configured for push notifications');
} else {
  console.warn('⚠️ VAPID keys not found - push notifications will not work');
}

class PushNotificationService {
  async subscribe(userId: string, subscription: any): Promise<boolean> {
    try {
      console.log('📱 Subscribing user to push notifications:', userId);
      
      // Check if subscription already exists
      const existing = await PushSubscription.findOne({ userId });
      
      if (existing) {
        // Update existing subscription
        existing.endpoint = subscription.endpoint;
        existing.keys = subscription.keys;
        existing.expirationTime = subscription.expirationTime;
        await existing.save();
        console.log('✅ Updated existing push subscription');
      } else {
        // Create new subscription
        await PushSubscription.create({
          userId,
          endpoint: subscription.endpoint,
          keys: subscription.keys,
          expirationTime: subscription.expirationTime
        });
        console.log('✅ Created new push subscription');
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error subscribing to push:', error);
      return false;
    }
  }

  async unsubscribe(userId: string): Promise<boolean> {
    try {
      await PushSubscription.deleteMany({ userId });
      console.log('✅ Unsubscribed user from push notifications');
      return true;
    } catch (error) {
      console.error('❌ Error unsubscribing from push:', error);
      return false;
    }
  }

  async sendPushToUser(userId: string, payload: {
    title: string;
    body: string;
    icon?: string;
    data?: any;
  }): Promise<boolean> {
    try {
      const subscriptions = await PushSubscription.find({ userId });
      
      if (subscriptions.length === 0) {
        console.log('ℹ️ No push subscriptions found for user:', userId);
        return false;
      }

      const pushPayload = JSON.stringify({
        title: payload.title,
        body: payload.body,
        icon: payload.icon || '/icon-192x192.svg',
        badge: '/icon-192x192.svg',
        data: payload.data,
        requireInteraction: true,
        vibrate: [200, 100, 200]
      });

      const results = await Promise.allSettled(
        subscriptions.map(async (sub) => {
          try {
            await webpush.sendNotification(
              {
                endpoint: sub.endpoint,
                keys: {
                  p256dh: sub.keys.p256dh,
                  auth: sub.keys.auth
                }
              },
              pushPayload
            );
            console.log('✅ Push notification sent to:', userId);
            return true;
          } catch (error: any) {
            // If subscription is invalid, remove it
            if (error.statusCode === 404 || error.statusCode === 410) {
              console.log('🗑️ Removing invalid push subscription');
              await PushSubscription.findByIdAndDelete(sub._id);
            } else {
              console.error('❌ Error sending push notification:', error);
            }
            throw error;
          }
        })
      );

      const successCount = results.filter(r => r.status === 'fulfilled').length;
      console.log(`✅ Sent push to ${successCount}/${subscriptions.length} subscriptions`);
      
      return successCount > 0;
    } catch (error) {
      console.error('❌ Error in sendPushToUser:', error);
      return false;
    }
  }

  async sendPushToMultipleUsers(userIds: string[], payload: {
    title: string;
    body: string;
    icon?: string;
    data?: any;
  }): Promise<void> {
    await Promise.all(
      userIds.map(userId => this.sendPushToUser(userId, payload))
    );
  }
}

export const pushNotificationService = new PushNotificationService();

