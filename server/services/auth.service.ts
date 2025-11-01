import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { storage } from '../models/storage.model';
import { User } from '../../types';
import config from '../config';
import { BadRequestError, UnauthorizedError, ConflictError } from '../utils/errors';
import { otpStorageService } from './otpStorage.service';
import { emailService } from './email.service';

export class AuthService {

  /**
   * Register a new user with email and password
   */
  async register(email: string, password: string, username: string): Promise<{ user: User; token: string; verificationOTP?: string }> {
    // Check if email already exists
    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      throw new ConflictError('Email already registered');
    }

    // Check if username already exists
    const existingUsername = await storage.getUserByUsername(username);
    if (existingUsername) {
      throw new ConflictError('Username already taken');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with emailVerified: false
    const user = await storage.createUser({
      email,
      password: hashedPassword,
      username,
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

    // Send verification email
    const verificationOTP = await emailService.sendVerificationEmail(email);

    // Generate JWT token
    const token = this.generateToken(user.id);

    // Remove password from user object before returning
    const { password: _, ...userWithoutPassword } = user;

    return { 
      user: userWithoutPassword as User, 
      token,
      verificationOTP // Return OTP for development
    };
  }

  /**
   * Login with email and password
   */
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    if (!email) {
      throw new BadRequestError('Email is required');
    }

    if (!password) {
      throw new BadRequestError('Password is required');
    }

    // Find user by email (need to include password field for comparison)
    const user = await storage.getUserByEmailWithPassword(email);

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password!);

    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Generate JWT token
    const token = this.generateToken(user.id);

    // Remove password from user object before returning
    const { password: _, ...userWithoutPassword } = user;

    return { user: userWithoutPassword as User, token };
  }

  /**
   * Verify email with OTP
   */
  async verifyEmail(email: string, otp: string): Promise<{ user: User }> {
    if (!email) {
      throw new BadRequestError('Email is required');
    }

    if (!otp) {
      throw new BadRequestError('OTP is required');
    }

    // Validate OTP
    if (!otpStorageService.verifyOTP(email, otp)) {
      throw new BadRequestError('Invalid or expired OTP');
    }

    // Find user by email
    const user = await storage.getUserByEmail(email);

    if (!user) {
      throw new BadRequestError('User not found');
    }

    // Update user emailVerified status
    const updatedUser = await storage.updateEmailVerification(user.id, true);

    return { user: updatedUser };
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(email: string): Promise<{ verificationOTP?: string }> {
    if (!email) {
      throw new BadRequestError('Email is required');
    }

    // Find user by email
    const user = await storage.getUserByEmail(email);

    if (!user) {
      throw new BadRequestError('User not found');
    }

    if (user.emailVerified) {
      throw new BadRequestError('Email already verified');
    }

    // Send verification email
    const verificationOTP = await emailService.sendVerificationEmail(email);

    return { verificationOTP };
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


