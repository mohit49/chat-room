import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { usernameService } from '../services/username.service';
import { UpdateUsernameInput, CheckUsernameInput } from '../validators/username.validator';

export class UsernameController {
  checkAvailability = async (
    req: AuthRequest<{}, {}, {}, CheckUsernameInput>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { username } = req.query;
      const userId = req.userId;

      const result = await usernameService.checkAvailability(username, userId);

      return res.json({
        success: true,
        available: result.available,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  };

  updateUsername = async (
    req: AuthRequest<{}, {}, UpdateUsernameInput>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId = req.userId!;
      const { username } = req.body;

      const user = await usernameService.updateUsername(userId, username);

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
}

export const usernameController = new UsernameController();

