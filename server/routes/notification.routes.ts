import express from 'express';
import { notificationController } from '../controllers/notification.controller';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Notification routes
router.get('/', notificationController.getNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.put('/read-all', notificationController.markAllAsRead);
router.delete('/clear-all', notificationController.clearAllNotifications);
router.put('/:notificationId/read', notificationController.markNotificationAsRead);
router.delete('/:notificationId', notificationController.deleteNotification);

export default router;