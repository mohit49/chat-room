import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { getUsersWithMessagesService } from '../services/message.service';

export const messageController = {
  async getUsersWithMessages(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
      }

      const result = await getUsersWithMessagesService(userId);

      if (result.success) {
        return res.json({
          success: true,
          data: {
            users: result.data?.users || []
          }
        });
      } else {
        return res.status(400).json({
          success: false,
          error: result.error || 'Failed to fetch users with messages'
        });
      }
    } catch (error: any) {
      console.error('Error fetching users with messages:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Internal server error'
      });
    }
  }
};

