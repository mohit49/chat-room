// Storage model - Now supports both MongoDB and in-memory
// Automatically uses MongoDB if connected, falls back to in-memory

import { User, UserProfile, ProfilePicture, OnlineStatus } from '../../types';
import { database } from '../database/connection';
import { userModelDB } from './user.model';

class StorageModel {
  private users: Map<string, User> = new Map(); // Fallback in-memory storage
  
  private useDB(): boolean {
    return database.getConnectionStatus();
  }

  async createUser(data: { email: string; password: string; username: string; profile: Partial<UserProfile> }): Promise<User> {
    if (this.useDB()) {
      return await userModelDB.createUser(data);
    }

    // Fallback: In-memory
    const id = `user_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const user: User = {
      id,
      email: data.email,
      password: data.password,
      username: data.username,
      emailVerified: false,
      profile: {
        birthDate: data.profile.birthDate || '',
        age: data.profile.age || 0,
        gender: data.profile.gender || '',
        location: data.profile.location || {
          latitude: 0,
          longitude: 0,
          address: ''
        },
        profilePicture: data.profile.profilePicture
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.users.set(id, user);
    return user;
  }

  async getUserById(id: string): Promise<User | undefined> {
    if (this.useDB()) {
      const user = await userModelDB.getUserById(id);
      return user || undefined;
    }
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    if (this.useDB()) {
      const user = await userModelDB.getUserByEmail(email);
      return user || undefined;
    }
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
  }

  async getUserByEmailWithPassword(email: string): Promise<User | undefined> {
    if (this.useDB()) {
      const user = await userModelDB.getUserByEmailWithPassword(email);
      return user || undefined;
    }
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    if (this.useDB()) {
      const user = await userModelDB.getUserByUsername(username);
      return user || undefined;
    }
    return Array.from(this.users.values()).find(
      (user) => user.username?.toLowerCase() === username.toLowerCase()
    );
  }

  async isUsernameAvailable(username: string, excludeUserId?: string): Promise<boolean> {
    if (this.useDB()) {
      return await userModelDB.isUsernameAvailable(username, excludeUserId);
    }
    const existingUser = await this.getUserByUsername(username);
    if (!existingUser) return true;
    if (excludeUserId && existingUser.id === excludeUserId) return true;
    return false;
  }

  async updateUsername(userId: string, username: string): Promise<User> {
    if (this.useDB()) {
      return await userModelDB.updateUsername(userId, username);
    }

    const user = this.users.get(userId);
    if (!user) {
      throw new Error('User not found');
    }

    user.username = username;
    user.updatedAt = new Date();
    this.users.set(userId, user);
    return user;
  }

  async updateUserProfile(id: string, profile: UserProfile): Promise<User> {
    console.log('Storage: updateUserProfile called for ID:', id);
    console.log('Storage: Using DB?', this.useDB());
    
    if (this.useDB()) {
      return await userModelDB.updateUserProfile(id, profile);
    }

    // In-memory fallback
    const user = this.users.get(id);
    if (!user) {
      throw new Error('User not found');
    }

    user.profile = profile;
    user.updatedAt = new Date();
    this.users.set(id, user);
    console.log('Storage: Profile updated in memory');
    return user;
  }

  async deleteUser(id: string): Promise<boolean> {
    if (this.useDB()) {
      return await userModelDB.deleteUser(id);
    }
    return this.users.delete(id);
  }

  async getAllUsers(): Promise<User[]> {
    if (this.useDB()) {
      return await userModelDB.getAllUsers();
    }
    return Array.from(this.users.values());
  }

  async searchUsers(query: string): Promise<User[]> {
    if (this.useDB()) {
      return await userModelDB.searchUsers(query);
    }
    
    // In-memory search
    // If query is empty, return all users
    if (!query || query.trim() === '') {
      return Array.from(this.users.values());
    }
    
    const searchTerm = query.toLowerCase();
    return Array.from(this.users.values()).filter(user => 
      user.username?.toLowerCase().includes(searchTerm) ||
      user.email.toLowerCase().includes(searchTerm)
    );
  }

  async updateEmailVerification(userId: string, verified: boolean): Promise<User> {
    if (this.useDB()) {
      return await userModelDB.updateEmailVerification(userId, verified);
    }

    // In-memory fallback
    const user = this.users.get(userId);
    if (!user) {
      throw new Error('User not found');
    }

    user.emailVerified = verified;
    user.updatedAt = new Date();
    this.users.set(userId, user);
    return user;
  }

  async clear(): Promise<void> {

    if (this.useDB()) {
      await userModelDB.clearAll();
    }
    this.users.clear();
  }

  // Follow system methods
  async createFollowRequest(request: any): Promise<boolean> {
    if (this.useDB()) {
      const { followModelDB } = await import('./follow.model');
      await followModelDB.createFollowRequest(request);
      return true;
    }
    
    // In-memory fallback
    console.log('Creating follow request (in-memory):', request);
    return true;
  }

  async removeFollow(requesterId: string, receiverId: string): Promise<boolean> {
    if (this.useDB()) {
      const { followModelDB } = await import('./follow.model');
      return await followModelDB.removeFollow(requesterId, receiverId);
    }
    
    // In-memory fallback
    console.log('Removing follow (in-memory):', { requesterId, receiverId });
    return true;
  }

  async cancelFollowRequest(requesterId: string, receiverId: string): Promise<boolean> {
    if (this.useDB()) {
      const { followModelDB } = await import('./follow.model');
      return await followModelDB.cancelFollowRequest(requesterId, receiverId);
    }
    
    // In-memory fallback
    console.log('Cancelling follow request (in-memory):', { requesterId, receiverId });
    return true;
  }

  async getFollowRequestById(requestId: string): Promise<any> {
    if (this.useDB()) {
      const { followModelDB } = await import('./follow.model');
      return await followModelDB.getFollowRequestById(requestId);
    }
    
    // In-memory fallback
    console.log('Getting follow request (in-memory):', requestId);
    return null;
  }

  async acceptFollowRequest(requestId: string): Promise<boolean> {
    if (this.useDB()) {
      const { followModelDB } = await import('./follow.model');
      return await followModelDB.acceptFollowRequest(requestId);
    }
    
    // In-memory fallback
    console.log('Accepting follow request (in-memory):', requestId);
    return true;
  }

  async rejectFollowRequest(requestId: string): Promise<boolean> {
    if (this.useDB()) {
      const { followModelDB } = await import('./follow.model');
      return await followModelDB.rejectFollowRequest(requestId);
    }
    
    // In-memory fallback
    console.log('Rejecting follow request (in-memory):', requestId);
    return true;
  }

  async getFollowRequestsForUser(userId: string): Promise<any[]> {
    if (this.useDB()) {
      const { followModelDB } = await import('./follow.model');
      return await followModelDB.getFollowRequestsForUser(userId);
    }
    
    // In-memory fallback
    console.log('Getting follow requests for user (in-memory):', userId);
    return [];
  }

  async getFollowStatus(requesterId: string, receiverId: string): Promise<any> {
    if (this.useDB()) {
      const { followModelDB } = await import('./follow.model');
      return await followModelDB.getFollowStatus(requesterId, receiverId);
    }
    
    // In-memory fallback
    console.log('Getting follow status (in-memory):', { requesterId, receiverId });
    return {
      isFollowing: false,
      isFollowedBy: false,
      followRequestSent: false,
      followRequestReceived: false
    };
  }

  async getFollowers(userId: string): Promise<any[]> {
    if (this.useDB()) {
      const { followModelDB } = await import('./follow.model');
      return await followModelDB.getFollowers(userId);
    }
    
    // In-memory fallback
    console.log('Getting followers for user (in-memory):', userId);
    return [];
  }

  async getFollowing(userId: string): Promise<any[]> {
    if (this.useDB()) {
      const { followModelDB } = await import('./follow.model');
      return await followModelDB.getFollowing(userId);
    }
    
    // In-memory fallback
    console.log('Getting following for user (in-memory):', userId);
    return [];
  }

  async getFollowCounts(userId: string): Promise<{ followers: number; following: number }> {
    if (this.useDB()) {
      const { followModelDB } = await import('./follow.model');
      return await followModelDB.getFollowCounts(userId);
    }
    
    // In-memory fallback
    console.log('Getting follow counts for user (in-memory):', userId);
    return { followers: 0, following: 0 };
  }

  // Block system methods
  async blockUser(blockerId: string, blockedUserId: string): Promise<boolean> {
    if (this.useDB()) {
      const { blockModelDB } = await import('./block.model');
      await blockModelDB.blockUser({ blockerId, blockedUserId });
      return true;
    }
    
    // In-memory fallback
    console.log('Blocking user (in-memory):', { blockerId, blockedUserId });
    return true;
  }

  async unblockUser(blockerId: string, blockedUserId: string): Promise<boolean> {
    if (this.useDB()) {
      const { blockModelDB } = await import('./block.model');
      return await blockModelDB.unblockUser(blockerId, blockedUserId);
    }
    
    // In-memory fallback
    console.log('Unblocking user (in-memory):', { blockerId, blockedUserId });
    return true;
  }

  async getBlockedUsers(userId: string): Promise<any[]> {
    if (this.useDB()) {
      const { blockModelDB } = await import('./block.model');
      return await blockModelDB.getBlockedUsers(userId);
    }
    
    // In-memory fallback
    console.log('Getting blocked users for (in-memory):', userId);
    return [];
  }

  async isUserBlocked(blockerId: string, blockedUserId: string): Promise<boolean> {
    if (this.useDB()) {
      const { blockModelDB } = await import('./block.model');
      return await blockModelDB.isUserBlocked(blockerId, blockedUserId);
    }
    
    // In-memory fallback
    console.log('Checking if user is blocked (in-memory):', { blockerId, blockedUserId });
    return false;
  }

  // Direct messaging methods
  async createDirectMessage(message: any): Promise<boolean> {
    if (this.useDB()) {
      const { directMessageModelDB } = await import('./directMessage.model');
      await directMessageModelDB.createDirectMessage(message);
      return true;
    }
    
    // In-memory fallback
    console.log('Creating direct message (in-memory):', message);
    return true;
  }

  async getDirectMessages(userId1: string, userId2: string): Promise<any[]> {
    if (this.useDB()) {
      const { directMessageModelDB } = await import('./directMessage.model');
      const result = await directMessageModelDB.getDirectMessages(userId1, userId2);
      return result.messages;
    }
    
    // In-memory fallback
    console.log('Getting direct messages between (in-memory):', { userId1, userId2 });
    return [];
  }

  async getDirectMessageConversations(userId: string): Promise<any[]> {
    if (this.useDB()) {
      const { directMessageModelDB } = await import('./directMessage.model');
      return await directMessageModelDB.getConversations(userId);
    }
    
    // In-memory fallback
    console.log('Getting conversations for user (in-memory):', userId);
    return [];
  }

  // Notification methods
  async getNotifications(userId: string): Promise<any[]> {
    if (this.useDB()) {
      const Notification = (await import('../database/schemas/notification.schema')).default;
      return await Notification.find({ recipientId: userId })
        .populate('senderId', 'username profilePicture')
        .sort({ createdAt: -1 });
    }
    
    // In-memory fallback
    console.log('Getting notifications for user (in-memory):', userId);
    return [];
  }

  async markNotificationAsRead(notificationId: string, userId: string): Promise<boolean> {
    if (this.useDB()) {
      const Notification = (await import('../database/schemas/notification.schema')).default;
      const result = await Notification.updateOne(
        { _id: notificationId, recipientId: userId },
        { status: 'read' }
      );
      return result.modifiedCount > 0;
    }
    
    // In-memory fallback
    console.log('Marking notification as read (in-memory):', { notificationId, userId });
    return true;
  }

  async markAllNotificationsAsRead(userId: string): Promise<boolean> {
    if (this.useDB()) {
      const Notification = (await import('../database/schemas/notification.schema')).default;
      const result = await Notification.updateMany(
        { recipientId: userId, status: 'unread' },
        { status: 'read' }
      );
      return result.modifiedCount > 0;
    }
    
    // In-memory fallback
    console.log('Marking all notifications as read for user (in-memory):', userId);
    return true;
  }

  async deleteNotification(notificationId: string, userId: string): Promise<boolean> {
    if (this.useDB()) {
      const Notification = (await import('../database/schemas/notification.schema')).default;
      const result = await Notification.deleteOne({
        _id: notificationId,
        recipientId: userId
      });
      return result.deletedCount > 0;
    }
    
    // In-memory fallback
    console.log('Deleting notification (in-memory):', { notificationId, userId });
    return true;
  }

  async createNotification(notification: any): Promise<boolean> {
    if (this.useDB()) {
      const Notification = (await import('../database/schemas/notification.schema')).default;
      const newNotification = new Notification(notification);
      await newNotification.save();
      return true;
    }
    
    // In-memory fallback
    console.log('Creating notification (in-memory):', notification);
    return true;
  }

  async clearAllNotifications(userId: string): Promise<boolean> {
    if (this.useDB()) {
      const Notification = (await import('../database/schemas/notification.schema')).default;
      const result = await Notification.deleteMany({ recipientId: userId });
      console.log(`Cleared ${result.deletedCount} notifications for user ${userId}`);
      return true;
    }
    
    // In-memory fallback
    console.log('Clearing all notifications (in-memory) for user:', userId);
    return true;
  }

  async getNotificationById(notificationId: string, userId: string): Promise<any | null> {
    if (this.useDB()) {
      const Notification = (await import('../database/schemas/notification.schema')).default;
      const notification = await Notification.findOne({ _id: notificationId, recipientId: userId });
      return notification;
    }
    
    // In-memory fallback
    console.log('Getting notification by ID (in-memory):', { notificationId, userId });
    return null;
  }

  async updateUserStatus(userId: string, updateData: Partial<User>): Promise<User> {
    if (this.useDB()) {
      return await userModelDB.updateUserStatus(userId, updateData);
    }

    // In-memory fallback
    const user = this.users.get(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const updatedUser = {
      ...user,
      ...updateData,
      updatedAt: new Date()
    };

    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async getUsersWithStatus(): Promise<User[]> {
    if (this.useDB()) {
      return await userModelDB.getUsersWithStatus();
    }

    // In-memory fallback
    return Array.from(this.users.values());
  }
}

export const storage = new StorageModel();


