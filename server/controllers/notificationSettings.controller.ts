import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { UserModel } from '../database/schemas/user.schema';

export const notificationSettingsController = {
  async updateSettings(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId;
      const settings = req.body;

      console.log('📝 Updating notification settings for user:', userId);
      console.log('📝 Settings received:', settings);

      if (!userId) {
        console.error('❌ No userId found in request');
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const user = await UserModel.findById(userId);
      if (!user) {
        console.error('❌ User not found:', userId);
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      console.log('✅ User found, current settings:', user.profile.notificationSettings);

      // Initialize notificationSettings if it doesn't exist
      if (!user.profile.notificationSettings) {
        user.profile.notificationSettings = {
          pushEnabled: true,
          emailEnabled: false,
          directMessages: true,
          roomMessages: true,
          follows: true,
          roomInvites: true
        };
      }

      // Update notification settings
      user.profile.notificationSettings = {
        pushEnabled: settings.pushEnabled !== undefined ? settings.pushEnabled : user.profile.notificationSettings.pushEnabled,
        emailEnabled: settings.emailEnabled !== undefined ? settings.emailEnabled : user.profile.notificationSettings.emailEnabled,
        directMessages: settings.directMessages !== undefined ? settings.directMessages : user.profile.notificationSettings.directMessages,
        roomMessages: settings.roomMessages !== undefined ? settings.roomMessages : user.profile.notificationSettings.roomMessages,
        follows: settings.follows !== undefined ? settings.follows : user.profile.notificationSettings.follows,
        roomInvites: settings.roomInvites !== undefined ? settings.roomInvites : user.profile.notificationSettings.roomInvites,
      };

      await user.save();

      console.log('✅ Notification settings updated successfully');
      console.log('✅ New settings:', user.profile.notificationSettings);

      res.json({
        success: true,
        settings: user.profile.notificationSettings
      });
    } catch (error: any) {
      console.error('❌ Error updating notification settings:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack
      });
      res.status(500).json({ success: false, error: 'Failed to update settings', details: error.message });
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

