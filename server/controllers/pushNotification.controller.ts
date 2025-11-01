import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { pushNotificationService } from '../services/pushNotification.service';

export const pushNotificationController = {
  async subscribe(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId;
      const { subscription } = req.body;

      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      if (!subscription) {
        return res.status(400).json({ success: false, error: 'Subscription data required' });
      }

      const success = await pushNotificationService.subscribe(userId, subscription);

      if (success) {
        res.json({ success: true, message: 'Subscribed to push notifications' });
      } else {
        res.status(500).json({ success: false, error: 'Failed to subscribe' });
      }
    } catch (error) {
      console.error('Error in push subscription:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  },

  async unsubscribe(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId;

      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const success = await pushNotificationService.unsubscribe(userId);

      if (success) {
        res.json({ success: true, message: 'Unsubscribed from push notifications' });
      } else {
        res.status(500).json({ success: false, error: 'Failed to unsubscribe' });
      }
    } catch (error) {
      console.error('Error in push unsubscription:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  },

  async sendTestPush(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId;

      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const success = await pushNotificationService.sendPushToUser(userId, {
        title: 'Test Push Notification',
        body: 'This is a test push notification from Chat App!',
        icon: '/logo-icon.png',
        data: {
          type: 'test',
          timestamp: Date.now()
        }
      });

      if (success) {
        res.json({ success: true, message: 'Test push notification sent' });
      } else {
        res.status(404).json({ success: false, error: 'No active push subscriptions found' });
      }
    } catch (error) {
      console.error('Error sending test push:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
};

