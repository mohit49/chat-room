import RandomChatSessionModel from '../database/schemas/randomChat.schema';
import { UserModel } from '../database/schemas/user.schema';
import { v4 as uuidv4 } from 'uuid';

class RandomChatService {
  // Get available users for random chat matching
  async getAvailableUsers(filters?: {
    gender?: string;
    country?: string;
    state?: string;
    city?: string;
  }) {
    try {
      const query: any = {
        onlineStatus: 'online'
      };

      // Apply filters if provided
      if (filters) {
        if (filters.gender && filters.gender !== '') {
          query['profile.gender'] = filters.gender;
        }
        if (filters.country) {
          query['profile.location.country'] = filters.country;
        }
        if (filters.state) {
          query['profile.location.state'] = filters.state;
        }
        if (filters.city) {
          query['profile.location.city'] = filters.city;
        }
      }

      const users = await UserModel.find(query)
        .select('username mobileNumber profile')
        .lean();

      return users.map(user => ({
        id: user._id.toString(),
        username: user.username || user.mobileNumber,
        profile: {
          profilePicture: user.profile?.profilePicture,
          gender: user.profile?.gender,
          location: {
            city: user.profile?.location?.city,
            state: user.profile?.location?.state,
            country: user.profile?.location?.country
          }
        }
      }));
    } catch (error) {
      console.error('Error getting available users:', error);
      return [];
    }
  }

  // Create a new random chat session
  async createSession(user1Id: string, user2Id: string) {
    try {
      const sessionId = uuidv4();
      const session = new RandomChatSessionModel({
        sessionId,
        user1Id,
        user2Id,
        status: 'connecting',
        messages: [],
        startedAt: new Date()
      });

      await session.save();
      return session;
    } catch (error) {
      console.error('Error creating random chat session:', error);
      throw error;
    }
  }

  // Update session status
  async updateSessionStatus(
    sessionId: string,
    status: 'connecting' | 'connected' | 'disconnected'
  ) {
    try {
      const updateData: any = { status, updatedAt: new Date() };
      
      if (status === 'disconnected') {
        updateData.endedAt = new Date();
      }

      const session = await RandomChatSessionModel.findOneAndUpdate(
        { sessionId },
        updateData,
        { new: true }
      );

      return session;
    } catch (error) {
      console.error('Error updating session status:', error);
      throw error;
    }
  }

  // Get active session for user
  async getActiveSession(userId: string) {
    try {
      const session = await RandomChatSessionModel.findOne({
        $or: [{ user1Id: userId }, { user2Id: userId }],
        status: { $in: ['connecting', 'connected'] }
      }).lean();

      return session;
    } catch (error) {
      console.error('Error getting active session:', error);
      return null;
    }
  }

  // Save message to session
  async saveMessage(sessionId: string, message: {
    id: string;
    senderId: string;
    senderName: string;
    message: string;
    messageType: 'text' | 'image' | 'audio';
    imageUrl?: string;
    audioUrl?: string;
  }) {
    try {
      const session = await RandomChatSessionModel.findOneAndUpdate(
        { sessionId },
        {
          $push: {
            messages: {
              ...message,
              timestamp: new Date()
            }
          },
          updatedAt: new Date()
        },
        { new: true }
      );

      return session;
    } catch (error) {
      console.error('Error saving message:', error);
      throw error;
    }
  }

  // Get session messages
  async getSessionMessages(sessionId: string) {
    try {
      const session = await RandomChatSessionModel.findOne({ sessionId })
        .select('messages')
        .lean();

      return session?.messages || [];
    } catch (error) {
      console.error('Error getting session messages:', error);
      return [];
    }
  }

  // End session
  async endSession(sessionId: string) {
    try {
      await this.updateSessionStatus(sessionId, 'disconnected');
    } catch (error) {
      console.error('Error ending session:', error);
      throw error;
    }
  }

  // Check if user is in active session
  async isUserInActiveSession(userId: string): Promise<boolean> {
    try {
      const session = await this.getActiveSession(userId);
      return session !== null;
    } catch (error) {
      console.error('Error checking if user is in active session:', error);
      return false;
    }
  }
}

export const randomChatService = new RandomChatService();


