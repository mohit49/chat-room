// MongoDB User Model with optimized operations

import { UserModel, UserDocument } from '../database/schemas/user.schema';
import { User, UserProfile, OnlineStatus } from '../../types';
import { ConflictError, NotFoundError } from '../utils/errors';

export class UserModelDB {
  async createUser(data: { mobileNumber: string; profile: Partial<UserProfile>; username?: string }): Promise<User> {
    try {
      const user = await UserModel.create({
        mobileNumber: data.mobileNumber,
        username: data.username,
        profile: {
          birthDate: data.profile.birthDate || '',
          age: data.profile.age || 0,
          gender: data.profile.gender || '',
          location: data.profile.location || {
            latitude: 0,
            longitude: 0,
            address: '',
            area: '',
            city: '',
            state: '',
            isVisible: true
          },
          profilePicture: data.profile.profilePicture,
          theme: data.profile.theme || 'system'
        },
      });

      return this.documentToUser(user);
    } catch (error: any) {
      if (error.code === 11000) {
        throw new ConflictError('Mobile number already exists');
      }
      throw error;
    }
  }

  async getUserById(id: string): Promise<User | null> {
    const user = await UserModel.findById(id);
    return user ? this.documentToUser(user) : null;
  }

  async getUserByMobile(mobileNumber: string): Promise<User | null> {
    const user = await UserModel.findOne({ mobileNumber });
    return user ? this.documentToUser(user) : null;
  }

  async getUserByUsername(username: string): Promise<User | null> {
    const user = await UserModel.findOne({ 
      username: username.toLowerCase() 
    });
    return user ? this.documentToUser(user) : null;
  }

  async isUsernameAvailable(username: string, excludeUserId?: string): Promise<boolean> {
    const query: any = { username: username.toLowerCase() };
    if (excludeUserId) {
      query._id = { $ne: excludeUserId };
    }
    
    const existingUser = await UserModel.findOne(query);
    return !existingUser;
  }

  async updateUsername(userId: string, username: string): Promise<User> {
    try {
      const user = await UserModel.findByIdAndUpdate(
        userId,
        { username: username.toLowerCase() },
        { new: true, runValidators: true }
      );

      if (!user) {
        throw new NotFoundError('User not found');
      }

      return this.documentToUser(user);
    } catch (error: any) {
      if (error.code === 11000) {
        throw new ConflictError('Username already taken');
      }
      throw error;
    }
  }

  async updateUserProfile(id: string, profile: UserProfile): Promise<User> {
    console.log('MongoDB: Updating profile for ID:', id);
    
    // Ensure we have a plain object, not a Mongoose document
    const plainProfile = {
      birthDate: profile.birthDate || '',
      age: profile.age || 0,
      gender: profile.gender || '',
      location: {
        latitude: profile.location?.latitude || 0,
        longitude: profile.location?.longitude || 0,
        address: profile.location?.address || '',
        area: profile.location?.area || '',
        city: profile.location?.city || '',
        state: profile.location?.state || '',
        isVisible: profile.location?.isVisible ?? true
      },
      profilePicture: profile.profilePicture ? {
        type: profile.profilePicture.type,
        url: profile.profilePicture.url,
        avatarStyle: profile.profilePicture.avatarStyle,
        seed: profile.profilePicture.seed,
      } : undefined,
      theme: profile.theme || 'system'
    };

    console.log('MongoDB: Plain profile data:', JSON.stringify(plainProfile, null, 2));

    const user = await UserModel.findByIdAndUpdate(
      id,
      { $set: { profile: plainProfile } },
      { new: true, runValidators: false } // Disable validators for now
    );

    if (!user) {
      throw new NotFoundError('User not found');
    }

    console.log('MongoDB: Profile updated successfully');
    console.log('MongoDB: New profile:', JSON.stringify(user.profile, null, 2));
    return this.documentToUser(user);
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await UserModel.findByIdAndDelete(id);
    return !!result;
  }

  async getAllUsers(): Promise<User[]> {
    const users = await UserModel.find().sort({ createdAt: -1 }).limit(100);
    return users.map(user => this.documentToUser(user));
  }

  async searchUsers(query: string): Promise<User[]> {
    // If query is empty, return all users (with limit)
    if (!query || query.trim() === '') {
      const users = await UserModel.find().sort({ username: 1 }).limit(50);
      return users.map(user => this.documentToUser(user));
    }
    
    const searchTerm = query.toLowerCase();
    const users = await UserModel.find({
      $or: [
        { username: { $regex: searchTerm, $options: 'i' } },
        { mobileNumber: { $regex: searchTerm, $options: 'i' } }
      ]
    }).sort({ username: 1 }).limit(20);
    
    return users.map(user => this.documentToUser(user));
  }

  async clearAll(): Promise<void> {
    await UserModel.deleteMany({});
  }

  async findByMobileNumber(mobileNumber: string): Promise<User | null> {
    const user = await UserModel.findOne({ mobileNumber });
    return user ? this.documentToUser(user) : null;
  }

  async updateUserMobileNumber(userId: string, newMobileNumber: string): Promise<User | null> {
    const user = await UserModel.findByIdAndUpdate(
      userId,
      { mobileNumber: newMobileNumber },
      { new: true }
    );
    return user ? this.documentToUser(user) : null;
  }

  // Helper to convert Mongoose document to User type
  async updateUserStatus(userId: string, updateData: Partial<User>): Promise<User> {
    try {
      const user = await UserModel.findByIdAndUpdate(
        userId,
        { $set: updateData },
        { new: true, runValidators: false }
      );

      if (!user) {
        throw new NotFoundError('User not found');
      }

      return this.documentToUser(user);
    } catch (error) {
      console.error('MongoDB: Error updating user status:', error);
      throw error;
    }
  }

  async getUsersWithStatus(): Promise<User[]> {
    try {
      const users = await UserModel.find({})
        .select('mobileNumber username profile lastSeen onlineStatus createdAt updatedAt')
        .sort({ onlineStatus: 1, lastSeen: -1 }); // Sort by status (online first), then by lastSeen

      return users.map(user => this.documentToUser(user));
    } catch (error) {
      console.error('MongoDB: Error getting users with status:', error);
      throw error;
    }
  }

  private documentToUser(doc: UserDocument): User {
    return {
      id: doc._id.toString(),
      mobileNumber: doc.mobileNumber,
      username: doc.username,
      profile: doc.profile,
      lastSeen: doc.lastSeen,
      onlineStatus: doc.onlineStatus,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }
}

export const userModelDB = new UserModelDB();

