// MongoDB Block Model with optimized operations

import { BlockModel, IBlock } from '../database/schemas/block.schema';
import { NotFoundError, ConflictError } from '../utils/errors';

class BlockModelDB {
  async blockUser(data: {
    blockerId: string;
    blockedUserId: string;
    reason?: string;
  }): Promise<IBlock> {
    // Check if users exist using storage model to avoid circular imports
    const { storage } = await import('./storage.model');
    const blocker = await storage.getUserById(data.blockerId);
    const blockedUser = await storage.getUserById(data.blockedUserId);
    
    if (!blocker) {
      throw new NotFoundError('Blocker not found');
    }
    if (!blockedUser) {
      throw new NotFoundError('User to block not found');
    }

    // Check if already blocked
    const existingBlock = await BlockModel.findOne({
      blockerId: data.blockerId,
      blockedUserId: data.blockedUserId
    });

    if (existingBlock) {
      throw new ConflictError('User is already blocked');
    }

    const block = new BlockModel(data);
    return await block.save();
  }

  async unblockUser(blockerId: string, blockedUserId: string): Promise<boolean> {
    const result = await BlockModel.deleteOne({
      blockerId,
      blockedUserId
    });

    return result.deletedCount > 0;
  }

  async isUserBlocked(blockerId: string, blockedUserId: string): Promise<boolean> {
    const block = await BlockModel.findOne({
      blockerId,
      blockedUserId
    });

    return !!block;
  }

  async getBlockedUsers(userId: string): Promise<IBlock[]> {
    return await BlockModel.find({ blockerId: userId })
      .populate('blockedUserId', 'username profilePicture')
      .sort({ createdAt: -1 });
  }

  async getBlockedByUsers(userId: string): Promise<IBlock[]> {
    return await BlockModel.find({ blockedUserId: userId })
      .populate('blockerId', 'username profilePicture')
      .sort({ createdAt: -1 });
  }

  async getBlockCount(userId: string): Promise<number> {
    return await BlockModel.countDocuments({ blockerId: userId });
  }

  async isBlockedByUser(blockerId: string, blockedUserId: string): Promise<boolean> {
    const block = await BlockModel.findOne({
      blockerId: blockedUserId,
      blockedUserId: blockerId
    });

    return !!block;
  }

  async checkBlockStatus(userId1: string, userId2: string): Promise<{
    isBlocked: boolean;
    isBlockedBy: boolean;
  }> {
    const [isBlocked, isBlockedBy] = await Promise.all([
      this.isUserBlocked(userId1, userId2),
      this.isBlockedByUser(userId1, userId2)
    ]);

    return { isBlocked, isBlockedBy };
  }
}

export const blockModelDB = new BlockModelDB();
