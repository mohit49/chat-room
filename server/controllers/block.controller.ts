import { Request, Response, NextFunction } from 'express';
import { blockService } from '../services/block.service';
import { AuthRequest } from '../middleware/auth';

export const blockController = {
  // Block user
  blockUser: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;
      const blockerId = req.userId!;

      if (blockerId === userId) {
        return res.status(400).json({
          success: false,
          error: 'Cannot block yourself'
        });
      }

      const result = await blockService.blockUser(blockerId, userId);
      
      res.json({
        success: true,
        message: 'User blocked successfully',
        data: result
      });
    } catch (error: any) {
      next(error);
    }
  },

  // Unblock user
  unblockUser: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;
      const blockerId = req.userId!;

      const result = await blockService.unblockUser(blockerId, userId);
      
      res.json({
        success: true,
        message: 'User unblocked successfully',
        data: result
      });
    } catch (error: any) {
      next(error);
    }
  },

  // Get blocked users
  getBlockedUsers: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;
      const blockedUsers = await blockService.getBlockedUsers(userId);
      
      res.json({
        success: true,
        blockedUsers
      });
    } catch (error: any) {
      next(error);
    }
  },

  // Check if user is blocked
  isUserBlocked: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;
      const checkerId = req.userId!;

      const isBlocked = await blockService.isUserBlocked(checkerId, userId);
      
      res.json({
        success: true,
        isBlocked
      });
    } catch (error: any) {
      next(error);
    }
  }
};
