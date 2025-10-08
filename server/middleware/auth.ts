import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { storage } from '../models/storage.model';
import { UnauthorizedError } from '../utils/errors';

export interface AuthRequest<P = any, ResBody = any, ReqBody = any, ReqQuery = any> 
  extends Request<P, ResBody, ReqBody, ReqQuery> {
  userId?: string;
  user?: any;
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

    console.log('🔐 Authentication attempt:', {
      hasCookieToken: !!req.cookies.token,
      hasAuthHeader: !!req.headers.authorization,
      tokenLength: token?.length,
      endpoint: req.path
    });

    if (!token) {
      console.log('❌ No token provided');
      throw new UnauthorizedError('Access denied. No token provided.');
    }

    const decoded = authService.verifyToken(token);
    console.log('✅ Token decoded:', { userId: decoded.userId });
    req.userId = decoded.userId;
    
    // Fetch full user details
    const user = await storage.getUserById(decoded.userId);
    if (!user) {
      console.log('❌ User not found for ID:', decoded.userId);
      throw new UnauthorizedError('User not found.');
    }
    
    console.log('✅ User authenticated:', { userId: user.id, username: user.username });
    req.user = user;
    next();
  } catch (error) {
    console.log('❌ Authentication error:', error.message);
    next(error);
  }
};
