import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { UserModel } from '../database/schemas/user.schema';

export const notificationSettingsController = {
  async updateSettings(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId;
      const settings = req.body;

      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const user = await UserModel.findById(userId);
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      // Update notification settings
      user.profile.notificationSettings = {
        pushEnabled: settings.pushEnabled !== undefined ? settings.pushEnabled : user.profile.notificationSettings?.pushEnabled || false,
        emailEnabled: settings.emailEnabled !== undefined ? settings.emailEnabled : user.profile.notificationSettings?.emailEnabled || false,
        directMessages: settings.directMessages !== undefined ? settings.directMessages : user.profile.notificationSettings?.directMessages !== false,
        roomMessages: settings.roomMessages !== undefined ? settings.roomMessages : user.profile.notificationSettings?.roomMessages !== false,
        follows: settings.follows !== undefined ? settings.follows : user.profile.notificationSettings?.follows !== false,
        roomInvites: settings.roomInvites !== undefined ? settings.roomInvites : user.profile.notificationSettings?.roomInvites !== false,
      };

      await user.save();

      console.log('✅ Notification settings updated for user:', userId);

      res.json({
        success: true,
        settings: user.profile.notificationSettings
      });
    } catch (error) {
      console.error('❌ Error updating notification settings:', error);
      res.status(500).json({ success: false, error: 'Failed to update settings' });
    }
  },

  async getSettings(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId;

      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const user = await UserModel.findById(userId);
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      res.json({
        success: true,
        settings: user.profile.notificationSettings || {
          pushEnabled: false,
          emailEnabled: false,
          directMessages: true,
          roomMessages: true,
          follows: true,
          roomInvites: true
        }
      });
    } catch (error) {
      console.error('❌ Error getting notification settings:', error);
      res.status(500).json({ success: false, error: 'Failed to get settings' });
    }
  }
};

