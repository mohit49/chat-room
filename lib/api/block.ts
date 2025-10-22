import { apiClient } from './client';
import { getAuthToken } from '../auth';

export interface BlockStatus {
  isBlocked: boolean;
  isBlockedBy: boolean;
}

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

// Block a user
export const blockUser = async (userId: string): Promise<boolean> => {
  const token = getAuthToken();
  const response = await apiClient.post(`/user/block/${userId}`, undefined, token || undefined) as any;
  return response.success;
};

// Unblock a user
export const unblockUser = async (userId: string): Promise<boolean> => {
  const token = getAuthToken();
  const response = await apiClient.delete(`/user/block/${userId}`, token || undefined) as any;
  return response.success;
};

// Get list of blocked users
export const getBlockedUsers = async (): Promise<BlockedUser[]> => {
  const token = getAuthToken();
  const response = await apiClient.get('/user/block', token || undefined) as any;
  return response?.blockedUsers || [];
};

// Check if a user is blocked
export const isUserBlocked = async (userId: string): Promise<boolean> => {
  const token = getAuthToken();
  const response = await apiClient.get(`/user/block/check/${userId}`, token || undefined) as any;
  return response?.isBlocked || false;
};

// Check block status (both ways)
export const checkBlockStatus = async (userId: string): Promise<BlockStatus> => {
  const token = getAuthToken();
  const response = await apiClient.get(`/user/block/status/${userId}`, token || undefined) as any;
  return response?.blockStatus || { isBlocked: false, isBlockedBy: false };
};

