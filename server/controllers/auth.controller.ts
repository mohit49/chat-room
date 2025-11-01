import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { authService } from '../services/auth.service';
import { RegisterInput, LoginInput, VerifyEmailInput, ResendVerificationInput } from '../validators/auth.validator';
import config from '../config';

export class AuthController {
  /**
   * Register a new user
   */
  register = async (
    req: AuthRequest<{}, {}, RegisterInput>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { email, password, username } = req.body;
      const { user, token, verificationOTP } = await authService.register(email, password, username);

      // Set cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: config.env === 'production',
        maxAge: 24 * 60 * 60 * 1000, // 1 day
        sameSite: 'lax',
      });

      return res.json({
        success: true,
        message: 'Registration successful. Please check your email for verification code.',
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          emailVerified: user.emailVerified,
          profile: user.profile,
        },
        token,
        verificationOTP, // Return for development/testing
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Login with email and password
   */
  login = async (
    req: AuthRequest<{}, {}, LoginInput>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { email, password } = req.body;
      const { user, token } = await authService.login(email, password);

      // Set cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: config.env === 'production',
        maxAge: 24 * 60 * 60 * 1000, // 1 day
        sameSite: 'lax',
      });

      return res.json({
        success: true,
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          emailVerified: user.emailVerified,
          profile: user.profile,
          lastSeen: user.lastSeen,
          onlineStatus: user.onlineStatus,
        },
        token,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Verify email with OTP
   */
  verifyEmail = async (
    req: AuthRequest<{}, {}, VerifyEmailInput>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { email, otp } = req.body;
      const { user } = await authService.verifyEmail(email, otp);

      return res.json({
        success: true,
        message: 'Email verified successfully',
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          emailVerified: user.emailVerified,
          profile: user.profile,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Resend verification email
   */
  resendVerification = async (
    req: AuthRequest<{}, {}, ResendVerificationInput>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { email } = req.body;
      const { verificationOTP } = await authService.resendVerificationEmail(email);

      return res.json({
        success: true,
        message: 'Verification email sent successfully',
        verificationOTP, // Return for development/testing
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get verification status for current user
   */
  getVerificationStatus = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId = req.userId;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
      }

      // Get user from storage
      const { storage } = await import('../models/storage.model');
      const user = await storage.getUserById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }

      return res.json({
        success: true,
        emailVerified: user.emailVerified,
        email: user.email,
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


