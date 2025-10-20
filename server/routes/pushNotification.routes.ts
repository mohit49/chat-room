import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { pushNotificationController } from '../controllers/pushNotification.controller';
import { notificationSettingsController } from '../controllers/notificationSettings.controller';

const router = express.Router();

// Subscribe to push notifications
router.post('/subscribe',
  authenticateToken,
  pushNotificationController.subscribe
);

// Unsubscribe from push notifications
router.post('/unsubscribe',
  authenticateToken,
  pushNotificationController.unsubscribe
);

// Send test push notification
router.post('/test-push',
  authenticateToken,
  pushNotificationController.sendTestPush
);

// Notification settings
router.put('/settings',
  authenticateToken,
  notificationSettingsController.updateSettings
);

router.get('/settings',
  authenticateToken,
  notificationSettingsController.getSettings
);

export default router;

