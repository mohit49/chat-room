import { storage } from '../models/storage.model';
import { NotFoundError, ConflictError } from '../utils/errors';

export interface BlockedUser {
  id: string;
  blockerId: string;
  blockedUserId: string;
  blockedAt: string;
  blockedUser: {
    id: string;
    username: string;
    profilePicture?: {
      type: 'upload' | 'avatar';
      url?: string;
      avatarStyle?: string;
      seed?: string;
    };
  };
}

class BlockServiceImpl {
  async blockUser(blockerId: string, blockedUserId: string): Promise<boolean> {
    // Check if users exist
    const blocker = await storage.getUserById(blockerId);
    const blockedUser = await storage.getUserById(blockedUserId);
    
    if (!blocker) {
      throw new NotFoundError('Blocker not found');
    }
    if (!blockedUser) {
      throw new NotFoundError('User to block not found');
    }

    // Check if already blocked
    const isAlreadyBlocked = await this.isUserBlocked(blockerId, blockedUserId);
    if (isAlreadyBlocked) {
      throw new ConflictError('User is already blocked');
    }

    // Block the user
    const result = await storage.blockUser(blockerId, blockedUserId);
    return result;
  }

  async unblockUser(blockerId: string, blockedUserId: string): Promise<boolean> {
    // Check if user is blocked
    const isBlocked = await this.isUserBlocked(blockerId, blockedUserId);
    if (!isBlocked) {
      throw new ConflictError('User is not blocked');
    }

    // Unblock the user
    const result = await storage.unblockUser(blockerId, blockedUserId);
    return result;
  }

  async getBlockedUsers(userId: string): Promise<BlockedUser[]> {
    const blockedUsers = await storage.getBlockedUsers(userId);
    return blockedUsers;
  }

  async isUserBlocked(blockerId: string, blockedUserId: string): Promise<boolean> {
    const isBlocked = await storage.isUserBlocked(blockerId, blockedUserId);
    return isBlocked;
  }
}

export const blockService = new BlockServiceImpl();
