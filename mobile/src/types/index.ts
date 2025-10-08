// Mobile types - importing from shared types
// In a monorepo setup, you'd use a shared package
// For now, we'll duplicate to keep it simple

export interface User {
  id: string;
  mobileNumber: string;
  username?: string;
  profile: UserProfile;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  birthDate: string;
  age: number;
  gender: Gender;
  location: Location;
  profilePicture?: ProfilePicture;
  theme?: 'light' | 'dark' | 'system';
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

export interface UpdateLocationRequest {
  latitude?: number;
  longitude?: number;
  address?: string;
}

