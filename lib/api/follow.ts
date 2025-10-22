import { apiClient } from './client';
import { getAuthToken } from '../auth';

export interface FollowRequest {
  id: string;
  requesterId: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface FollowStatus {
  isFollowing: boolean;
  isFollowedBy: boolean;
  followRequestSent: boolean;
  followRequestReceived: boolean;
}

export interface FollowerData {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: string;
  updatedAt: string;
}

export interface FollowCounts {
  followers: number;
  following: number;
}

// Send follow request
export const sendFollowRequest = async (userId: string): Promise<FollowRequest> => {
  const token = getAuthToken();
  const response = await apiClient.post(`/user/follow/${userId}`, undefined, token || undefined) as any;
  return response.data;
};

// Unfollow user
export const unfollowUser = async (userId: string): Promise<boolean> => {
  const token = getAuthToken();
  const response = await apiClient.delete(`/user/follow/${userId}`, token || undefined) as any;
  return response.data;
};

// Remove follower
export const removeFollower = async (followerId: string): Promise<boolean> => {
  const token = getAuthToken();
  const response = await apiClient.delete(`/user/follow/follower/${followerId}`, token || undefined) as any;
  return response.data;
};

// Cancel follow request
export const cancelFollowRequest = async (userId: string): Promise<boolean> => {
  const token = getAuthToken();
  const response = await apiClient.delete(`/user/follow/request/${userId}`, token || undefined) as any;
  return response.data;
};

// Accept follow request
export const acceptFollowRequest = async (requestId: string): Promise<boolean> => {
  const token = getAuthToken();
  const response = await apiClient.post(`/user/follow/request/${requestId}/accept`, undefined, token || undefined) as any;
  return response.data;
};

// Reject follow request
export const rejectFollowRequest = async (requestId: string): Promise<boolean> => {
  const token = getAuthToken();
  const response = await apiClient.post(`/user/follow/request/${requestId}/reject`, undefined, token || undefined) as any;
  return response.data;
};

// Get follow requests
export const getFollowRequests = async (): Promise<FollowRequest[]> => {
  const token = getAuthToken();
  const response = await apiClient.get('/user/follow/requests', token || undefined) as any;
  return response?.requests || [];
};

// Get follow status
export const getFollowStatus = async (userId: string): Promise<FollowStatus> => {
  const token = getAuthToken();
  const response = await apiClient.get(`/user/follow/status/${userId}`, token || undefined) as any;
  return response?.status || { isFollowing: false, isFollowedBy: false, followRequestSent: false, followRequestReceived: false };
};

// Get followers list
export const getFollowers = async (userId: string): Promise<any[]> => {
  const token = getAuthToken();
  const response = await apiClient.get(`/user/follow/followers/${userId}`, token || undefined) as any;
  return response?.followers || [];
};

// Get following list
export const getFollowing = async (userId: string): Promise<any[]> => {
  const token = getAuthToken();
  const response = await apiClient.get(`/user/follow/following/${userId}`, token || undefined) as any;
  return response?.following || [];
};

// Get follow counts
export const getFollowCounts = async (userId: string): Promise<FollowCounts> => {
  const token = getAuthToken();
  const response = await apiClient.get(`/user/follow/counts/${userId}`, token || undefined) as any;
  return response?.counts || { followers: 0, following: 0 };
};
