import { Request, Response, NextFunction } from 'express';
import { notificationService } from '../services/notification.service';
import { AuthRequest } from '../middleware/auth';

export const notificationController = {
  // Get notifications
  getNotifications: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;
      const notifications = await notificationService.getNotifications(userId);
      
      res.json({
        success: true,
        notifications
      });
    } catch (error: any) {
      next(error);
    }
  },

  // Get unread notification count
  getUnreadCount: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;
      const count = await notificationService.getUnreadCount(userId);
      
      res.json({
        success: true,
        count
      });
    } catch (error: any) {
      next(error);
    }
  },

  // Mark notification as read
  markNotificationAsRead: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { notificationId } = req.params;
      const userId = req.userId!;

      const result = await notificationService.markAsRead(notificationId, userId);
      
      res.json({
        success: true,
        message: 'Notification marked as read',
        data: result
      });
    } catch (error: any) {
      next(error);
    }
  },

  // Mark all notifications as read
  markAllAsRead: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;
      const result = await notificationService.markAllAsRead(userId);
      
      res.json({
        success: true,
        message: 'All notifications marked as read',
        data: result
      });
    } catch (error: any) {
      next(error);
    }
  },

  // Delete notification
  deleteNotification: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { notificationId } = req.params;
      const userId = req.userId!;

      const result = await notificationService.deleteNotification(notificationId, userId);
      
      res.json({
        success: true,
        message: 'Notification deleted',
        data: result
      });
    } catch (error: any) {
      next(error);
    }
  },

  // Clear all notifications
  clearAllNotifications: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;
      const result = await notificationService.clearAllNotifications(userId);
      
      res.json({
        success: true,
        message: 'All notifications cleared',
        data: result
      });
    } catch (error: any) {
      next(error);
    }
  }
};