import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { userService } from '../services/user.service';
import { UpdateProfileInput, UpdateLocationInput } from '../validators/user.validator';

export class UserController {
  getProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;
      const user = await userService.getUser(userId);

      return res.json({
        success: true,
        user: {
          id: user.id,
          mobileNumber: user.mobileNumber,
          username: user.username,
          profile: user.profile,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  updateProfile = async (
    req: AuthRequest<{}, {}, UpdateProfileInput>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId = req.userId!;
      const profileData = req.body;
      
      console.log('=== USER PROFILE UPDATE CONTROLLER DEBUG ===');
      console.log('User ID:', userId);
      console.log('Profile Data:', JSON.stringify(profileData, null, 2));
      console.log('Profile Picture:', profileData.profilePicture);

      const user = await userService.updateProfile(userId, profileData);

      return res.json({
        success: true,
        user: {
          id: user.id,
          mobileNumber: user.mobileNumber,
          username: user.username,
          profile: user.profile,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  updateLocation = async (
    req: AuthRequest<{}, {}, UpdateLocationInput>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId = req.userId!;
      const locationData = req.body;

      const user = await userService.updateLocation(userId, locationData);

      return res.json({
        success: true,
        user: {
          id: user.id,
          mobileNumber: user.mobileNumber,
          username: user.username,
          profile: user.profile,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  searchUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { query } = req.query;
      
      if (!query || typeof query !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Search query is required'
        });
      }

      const users = await userService.searchUsers(query);

      return res.json({
        success: true,
        users: users.map(user => ({
          id: user.id,
          username: user.username,
          mobileNumber: user.mobileNumber,
          profilePicture: user.profile.profilePicture,
        })),
      });
    } catch (error) {
      next(error);
    }
  };

  getUserById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      
      console.log('🔍 getUserById - req.params:', req.params);
      console.log('🔍 getUserById - id type:', typeof id, 'value:', id);
      
      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'User ID is required'
        });
      }

      const user = await userService.getUserById(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      return res.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          mobileNumber: user.mobileNumber,
          profile: user.profile,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}

export const userController = new UserController();


