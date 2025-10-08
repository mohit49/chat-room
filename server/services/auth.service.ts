import jwt from 'jsonwebtoken';
import { storage } from '../models/storage.model';
import { User } from '../../types';
import config from '../config';
import { BadRequestError, UnauthorizedError } from '../utils/errors';
import { otpStorageService } from './otpStorage.service';

export class AuthService {

  async sendOTP(mobileNumber: string): Promise<{ mockOTP?: string }> {
    try {
      // In production, integrate with SMS service (Twilio, AWS SNS, etc.)
      // For local development, generate a random 6-digit OTP for any mobile number
      
      // Generate a random 6-digit OTP
      const mockOTP = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Store OTP with 5-minute expiry
      otpStorageService.storeOTP(mobileNumber, mockOTP, 5);
      
      // OTP generated successfully - only return to frontend
      
      return {
        success: true,
        message: 'OTP sent successfully',
        mockOTP: mockOTP, // Always return mockOTP in development
      };
    } catch (error) {
      console.error('Error generating OTP:', error);
      throw new Error('Failed to generate OTP');
    }
  }

  private isValidOTP(mobileNumber: string, otp: string): boolean {
    return otpStorageService.verifyOTP(mobileNumber, otp);
  }

  async login(mobileNumber: string, otp: string): Promise<{ user: User; token: string }> {
    if (!mobileNumber) {
      throw new BadRequestError('Mobile number is required');
    }

    if (!otp) {
      throw new BadRequestError('OTP is required');
    }

    // Validate OTP
    if (!this.isValidOTP(mobileNumber, otp)) {
      throw new BadRequestError('Invalid or expired OTP');
    }

    // OTP is automatically removed after verification in otpStorageService

    // Check if user exists
    let user = await storage.getUserByMobile(mobileNumber);

    if (!user) {
      // Create new user
      user = await storage.createUser({
        mobileNumber,
        profile: {
          birthDate: '',
          age: 0,
          gender: '',
          location: {
            latitude: 0,
            longitude: 0,
            address: '',
          },
        },
      });
    }

    // Generate JWT token
    const token = this.generateToken(user.id);

    return { user, token };
  }

  generateToken(userId: string): string {
    return jwt.sign({ userId }, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });
  }

  verifyToken(token: string): { userId: string } {
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as { userId: string };
      return decoded;
    } catch (error) {
      throw new UnauthorizedError('Invalid or expired token');
    }
  }
}

export const authService = new AuthService();


