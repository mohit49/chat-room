import { storage } from '../models/storage.model';
import { User, UserProfile } from '../../types';
import { NotFoundError } from '../utils/errors';

export class UserService {
  async getUser(userId: string): Promise<User> {
    const user = await storage.getUserById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return user;
  }

  async updateProfile(userId: string, profileData: Partial<UserProfile>): Promise<User> {
    const user = await this.getUser(userId);
    
    // Convert to plain object to avoid Mongoose document issues
    const currentProfile = JSON.parse(JSON.stringify(user.profile));
    
    const updatedProfile: UserProfile = {
      birthDate: profileData.birthDate ?? currentProfile.birthDate ?? '',
      age: profileData.age ?? currentProfile.age ?? 0,
      gender: profileData.gender ?? currentProfile.gender ?? '',
      location: profileData.location ?? currentProfile.location ?? {
        latitude: 0,
        longitude: 0,
        address: '',
        area: '',
        city: '',
        state: '',
        isVisible: true
      },
      profilePicture: profileData.profilePicture ?? currentProfile.profilePicture,
    };

    console.log('Updating profile for user:', userId);
    console.log('Updated profile data:', JSON.stringify(updatedProfile, null, 2));

    return await storage.updateUserProfile(userId, updatedProfile);
  }

  async updateLocation(
    userId: string,
    locationData: { 
      latitude?: number; 
      longitude?: number; 
      address?: string;
      area?: string;
      city?: string;
      state?: string;
      isVisible?: boolean;
    }
  ): Promise<User> {
    const user = await this.getUser(userId);
    
    const updatedProfile: UserProfile = {
      ...user.profile,
      location: {
        latitude: locationData.latitude ?? user.profile.location.latitude,
        longitude: locationData.longitude ?? user.profile.location.longitude,
        address: locationData.address ?? user.profile.location.address,
        area: locationData.area ?? user.profile.location.area,
        city: locationData.city ?? user.profile.location.city,
        state: locationData.state ?? user.profile.location.state,
        isVisible: locationData.isVisible !== undefined ? locationData.isVisible : user.profile.location.isVisible ?? true,
      },
    };

    return await storage.updateUserProfile(userId, updatedProfile);
  }

  async searchUsers(query: string): Promise<User[]> {
    return await storage.searchUsers(query);
  }

  async getUserById(userId: string): Promise<User | null> {
    const user = await storage.getUserById(userId);
    return user || null;
  }
}

export const userService = new UserService();


