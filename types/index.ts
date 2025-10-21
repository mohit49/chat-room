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
  isVisible?: boolean; // Privacy control - if false, location won't be shown in app
}

export type Gender = 'male' | 'female' | 'other' | '';

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
  isVisible?: boolean;
}

