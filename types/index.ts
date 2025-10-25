// Shared types between frontend and backend

export interface User {
  id: string;
  mobileNumber: string;
  username?: string;
  profile: UserProfile;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationSettings {
  pushEnabled: boolean;
  emailEnabled: boolean;
  directMessages: boolean;
  roomMessages: boolean;
  follows: boolean;
  roomInvites: boolean;
}

export interface UserProfile {
  birthDate: string;
  age: number;
  gender: Gender;
  location: Location;
  profilePicture?: ProfilePicture;
  theme?: 'light' | 'dark' | 'system';
  notificationSettings?: NotificationSettings;
}

export interface ProfilePicture {
  type: 'upload' | 'avatar';
  url?: string;
  avatarStyle?: string;
  seed?: string;
}

export interface Location {
  latitude: number;
  longitude: number;
  address: string;
  area?: string;
  city?: string;
  state?: string;
  country?: string;
  isVisible?: boolean; // Privacy control - if false, location won't be shown in app
}

export type Gender = 'male' | 'female' | 'other' | '';

export type OnlineStatus = 'online' | 'away' | 'offline';

export interface User {
  id: string;
  mobileNumber: string;
  username?: string;
  profile: UserProfile;
  lastSeen?: Date;
  onlineStatus?: OnlineStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  user?: User;
  token?: string;
  mockOTP?: string;
}

export interface AuthResponse extends ApiResponse {
  user?: User;
  token?: string;
}

export interface LoginRequest {
  mobileNumber: string;
  otp: string;
}

export interface SendOTPRequest {
  mobileNumber: string;
}

export interface UpdateProfileRequest {
  birthDate?: string;
  age?: number;
  gender?: Gender;
  profilePicture?: ProfilePicture;
}

export interface UpdateUsernameRequest {
  username: string;
}

export interface CheckUsernameResponse {
  available: boolean;
  message?: string;
}

export interface UpdateLocationRequest {
  latitude?: number;
  longitude?: number;
  address?: string;
  area?: string;
  city?: string;
  state?: string;
  country?: string;
  isVisible?: boolean;
}

// Random Connect Types
export interface RandomChatSession {
  id: string;
  user1Id: string;
  user2Id: string;
  user1: RandomChatUser;
  user2: RandomChatUser;
  status: 'connecting' | 'connected' | 'disconnected';
  startedAt: Date;
  endedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface RandomChatUser {
  id: string;
  username: string;
  profile: {
    profilePicture?: ProfilePicture;
    gender: Gender;
    location: {
      city?: string;
      state?: string;
      country?: string;
    };
  };
}

export interface RandomChatMessage {
  id: string;
  sessionId: string;
  senderId: string;
  senderName: string;
  message: string;
  messageType: 'text' | 'image' | 'audio';
  imageUrl?: string;
  audioUrl?: string;
  timestamp: Date;
}

export interface RandomChatFilter {
  gender?: Gender;
  country?: string;
  state?: string;
  city?: string;
}

export interface RandomChatAvailableUser {
  id: string;
  socketId: string;
  username: string;
  profile: {
    profilePicture?: ProfilePicture;
    gender: Gender;
    location: {
      city?: string;
      state?: string;
      country?: string;
    };
  };
  filters?: RandomChatFilter;
  joinedAt: Date;
}
