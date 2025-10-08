import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { authService } from '../services/auth.service';
import { SendOTPInput, LoginInput } from '../validators/auth.validator';
import config from '../config';

export class AuthController {
  sendOTP = async (
    req: AuthRequest<{}, {}, SendOTPInput>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { mobileNumber } = req.body;
      const result = await authService.sendOTP(mobileNumber);

      return res.json({
        success: true,
        message: 'OTP sent successfully',
        mockOTP: result.mockOTP,
      });
    } catch (error) {
      next(error);
    }
  };

  login = async (
    req: AuthRequest<{}, {}, LoginInput>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { mobileNumber, otp } = req.body;
      const { user, token } = await authService.login(mobileNumber, otp);

      // Set cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: config.env === 'production',
        maxAge: 24 * 60 * 60 * 1000, // 1 day
        sameSite: 'lax',
      });

      return res.json({
        success: true,
        user: {
          id: user.id,
          mobileNumber: user.mobileNumber,
          username: user.username,
          profile: user.profile,
        },
        token,
      });
    } catch (error) {
      next(error);
    }
  };

  logout = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      res.clearCookie('token');
      return res.json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  };
}

export const authController = new AuthController();


