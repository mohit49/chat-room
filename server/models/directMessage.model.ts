// MongoDB Direct Message Model with optimized operations

import { DirectMessageModel, IDirectMessage } from '../database/schemas/directMessage.schema';
import { NotFoundError, ConflictError } from '../utils/errors';

class DirectMessageModelDB {
  async createDirectMessage(data: {
    senderId: string;
    receiverId: string;
    message: string;
    messageType: 'text' | 'image' | 'audio';
    imageUrl?: string;
    audioUrl?: string;
    senderUsername: string;
    senderProfilePicture?: {
      type: 'upload' | 'avatar';
      url?: string;
      avatarStyle?: string;
      seed?: string;
    };
  }): Promise<IDirectMessage> {
    // Check if users exist using storage model to avoid circular imports
    const { storage } = await import('./storage.model');
    const sender = await storage.getUserById(data.senderId);
    const receiver = await storage.getUserById(data.receiverId);
    
    if (!sender) {
      throw new NotFoundError('Sender not found');
    }
    if (!receiver) {
      throw new NotFoundError('Receiver not found');
    }

    // Check if sender is blocked by receiver
    const isBlocked = await storage.isUserBlocked(data.receiverId, data.senderId);
    if (isBlocked) {
      throw new ConflictError('Cannot send message to this user');
    }

    const directMessage = new DirectMessageModel(data);
    return await directMessage.save();
  }

  async getDirectMessages(userId1: string, userId2: string, limit: number = 50, offset: number = 0): Promise<{
    messages: IDirectMessage[];
    hasMore: boolean;
    totalCount: number;
  }> {
    const totalCount = await DirectMessageModel.countDocuments({
      $or: [
        { senderId: userId1, receiverId: userId2 },
        { senderId: userId2, receiverId: userId1 }
      ]
    });

    const messages = await DirectMessageModel.find({
      $or: [
        { senderId: userId1, receiverId: userId2 },
        { senderId: userId2, receiverId: userId1 }
      ]
    })
    .sort({ timestamp: -1 })
    .skip(offset)
    .limit(limit);

    const hasMore = offset + messages.length < totalCount;

    return {
      messages: messages.reverse(), // Reverse to show oldest first
      hasMore,
      totalCount
    };
  }

  async getConversations(userId: string): Promise<{
    userId: string;
    username: string;
    profilePicture?: any;
    lastMessage: IDirectMessage;
    unreadCount: number;
    lastMessageTime: string;
  }[]> {
    console.log('🔍 Starting aggregation for userId:', userId);
    
    // Get all unique conversation partners
    const conversations = await DirectMessageModel.aggregate([
      {
        $match: {
          $or: [
            { senderId: userId },
            { receiverId: userId }
          ]
        }
      },
      {
        $addFields: {
          otherUserId: {
            $cond: [
              { $eq: ['$senderId', userId] },
              '$receiverId',
              '$senderId'
            ]
          }
        }
      },
      {
        $sort: { timestamp: -1 }
      },
      {
        $group: {
          _id: '$otherUserId',
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$receiverId', userId] },
                    { $ne: ['$status', 'read'] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $addFields: {
          otherUserIdObj: { $toObjectId: '$_id' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'otherUserIdObj',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: {
          path: '$user',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          userId: '$_id',
          username: '$user.username',
          profilePicture: {
            $cond: {
              if: { $ne: ['$user.profile.profilePicture', null] },
              then: '$user.profile.profilePicture',
              else: {
                type: 'avatar',
                avatarStyle: 'adventurer',
                seed: '$user.username'
              }
            }
          },
          lastMessage: 1,
          unreadCount: 1,
          lastMessageTime: '$lastMessage.timestamp'
        }
      },
      {
        $sort: { lastMessageTime: -1 }
      }
    ]);

    console.log('📊 Aggregation result count:', conversations.length);
    console.log('📋 Aggregation result:', JSON.stringify(conversations, null, 2));

    return conversations;
  }

  async markAsRead(messageId: string, userId: string): Promise<boolean> {
    const message = await DirectMessageModel.findOne({
      _id: messageId,
      receiverId: userId
    });

    if (!message) {
      return false;
    }

    message.status = 'read';
    message.readAt = new Date();
    await message.save();

    return true;
  }

  async markConversationAsRead(senderId: string, receiverId: string): Promise<boolean> {
    const result = await DirectMessageModel.updateMany(
      {
        senderId,
        receiverId,
        status: { $ne: 'read' }
      },
      {
        $set: {
          status: 'read',
          readAt: new Date()
        }
      }
    );

    return result.modifiedCount > 0;
  }

  async markMessagesAsSeen(userId: string, otherUserId: string): Promise<boolean> {
    const result = await DirectMessageModel.updateMany(
      {
        $or: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId }
        ],
        status: { $in: ['sent', 'delivered'] }
      },
      {
        $set: {
          status: 'read',
          readAt: new Date()
        }
      }
    );

    console.log(`📖 Marked ${result.modifiedCount} messages as seen for conversation between ${userId} and ${otherUserId}`);
    return result.modifiedCount > 0;
  }

  async getUnreadCount(userId: string): Promise<number> {
    return await DirectMessageModel.countDocuments({
      receiverId: userId,
      status: { $ne: 'read' }
    });
  }

  async deleteMessage(messageId: string, userId: string): Promise<boolean> {
    const message = await DirectMessageModel.findOne({
      _id: messageId,
      senderId: userId
    });

    if (!message) {
      return false;
    }

    await DirectMessageModel.deleteOne({ _id: messageId });
    return true;
  }

  async deleteConversation(userId1: string, userId2: string): Promise<boolean> {
    const result = await DirectMessageModel.deleteMany({
      $or: [
        { senderId: userId1, receiverId: userId2 },
        { senderId: userId2, receiverId: userId1 }
      ]
    });

    return result.deletedCount > 0;
  }
}

export const directMessageModelDB = new DirectMessageModelDB();
