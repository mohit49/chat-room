import { storage } from '../models/storage.model';
import { User } from '../../types';
import { NotFoundError, ConflictError } from '../utils/errors';

export class UsernameService {
  async checkAvailability(username: string, userId?: string): Promise<{ available: boolean; message?: string }> {
    const isAvailable = await storage.isUsernameAvailable(username, userId);
    
    if (isAvailable) {
      return {
        available: true,
        message: 'Username is available',
      };
    }

    return {
      available: false,
      message: 'Username is already taken',
    };
  }

  async updateUsername(userId: string, username: string): Promise<User> {
    const user = await storage.getUserById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Check if username is available (excluding current user)
    const availability = await this.checkAvailability(username, userId);
    if (!availability.available) {
      throw new ConflictError('Username is already taken');
    }

    return await storage.updateUsername(userId, username);
  }
}

export const usernameService = new UsernameService();

