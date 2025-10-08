import { storage } from '../models/storage.model';
import { NotFoundError } from '../utils/errors';

export interface Notification {
  id: string;
  recipientId: string;
  type: 'direct_message' | 'follow_request' | 'follow_accepted' | 'message_received';
  title: string;
  message: string;
  senderId?: string;
  messageId?: string;
  status: 'pending' | 'approved' | 'rejected' | 'read' | 'unread';
  metadata?: {
    senderUsername?: string;
    senderProfilePicture?: {
      type: 'upload' | 'avatar';
      url?: string;
      avatarStyle?: string;
      seed?: string;
    };
    conversationId?: string;
    [key: string]: any;
  };
  createdAt: string;
  updatedAt: string;
}

class NotificationServiceImpl {
  async getNotifications(userId: string): Promise<Notification[]> {
    const notifications = await storage.getNotifications(userId);
    return notifications;
  }

  async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    const result = await storage.markNotificationAsRead(notificationId, userId);
    return result;
  }

  async markAllAsRead(userId: string): Promise<boolean> {
    const result = await storage.markAllNotificationsAsRead(userId);
    return result;
  }

  async deleteNotification(notificationId: string, userId: string): Promise<boolean> {
    const result = await storage.deleteNotification(notificationId, userId);
    return result;
  }

  async createNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'updatedAt'>): Promise<Notification> {
    const newNotification: Notification = {
      ...notification,
      id: `notif_${Date.now()}_${notification.recipientId}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await storage.createNotification(newNotification);
    return newNotification;
  }

  async clearAllNotifications(userId: string): Promise<boolean> {
    const result = await storage.clearAllNotifications(userId);
    return result;
  }

  async getNotificationById(notificationId: string, userId: string): Promise<Notification | null> {
    const notification = await storage.getNotificationById(notificationId, userId);
    return notification;
  }
}

export const notificationService = new NotificationServiceImpl();