import { Request, Response, NextFunction } from 'express';
import { followService } from '../services/follow.service';
import { AuthRequest } from '../middleware/auth';

export const followController = {
  // Send follow request
  sendFollowRequest: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;
      const requesterId = req.userId!;

      if (requesterId === userId) {
        return res.status(400).json({
          success: false,
          error: 'Cannot follow yourself'
        });
      }

      const result = await followService.sendFollowRequest(requesterId, userId);
      
      res.json({
        success: true,
        message: 'Follow request sent successfully',
        data: result
      });
    } catch (error: any) {
      next(error);
    }
  },

  // Unfollow user
  unfollowUser: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;
      const requesterId = req.userId!;

      const result = await followService.unfollowUser(requesterId, userId);
      
      res.json({
        success: true,
        message: 'Unfollowed successfully',
        data: result
      });
    } catch (error: any) {
      next(error);
    }
  },

  // Cancel follow request
  cancelFollowRequest: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;
      const requesterId = req.userId!;

      const result = await followService.cancelFollowRequest(requesterId, userId);
      
      res.json({
        success: true,
        message: 'Follow request cancelled successfully',
        data: result
      });
    } catch (error: any) {
      next(error);
    }
  },

  // Accept follow request
  acceptFollowRequest: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { requestId } = req.params;
      const accepterId = req.userId!;

      const result = await followService.acceptFollowRequest(requestId, accepterId);
      
      res.json({
        success: true,
        message: 'Follow request accepted successfully',
        data: result
      });
    } catch (error: any) {
      next(error);
    }
  },

  // Reject follow request
  rejectFollowRequest: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { requestId } = req.params;
      const rejecterId = req.userId!;

      const result = await followService.rejectFollowRequest(requestId, rejecterId);
      
      res.json({
        success: true,
        message: 'Follow request rejected successfully',
        data: result
      });
    } catch (error: any) {
      next(error);
    }
  },

  // Get follow requests
  getFollowRequests: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;
      const requests = await followService.getFollowRequests(userId);
      
      res.json({
        success: true,
        requests
      });
    } catch (error: any) {
      next(error);
    }
  },

  // Get follow status
  getFollowStatus: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;
      const requesterId = req.userId!;

      const status = await followService.getFollowStatus(requesterId, userId);
      
      res.json({
        success: true,
        status
      });
    } catch (error: any) {
      next(error);
    }
  }
};
