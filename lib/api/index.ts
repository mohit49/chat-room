// API methods using the new client

import { apiClient } from './client';
import { API_ENDPOINTS } from '@/constants';
import {
  AuthResponse,
  ApiResponse,
  LoginRequest,
  SendOTPRequest,
  UpdateProfileRequest,
  UpdateLocationRequest,
} from '@/types';
import { roomApi } from './room';
import { notificationApi } from './notification';
import { getAuthToken } from '../auth';

export const api = {
  // Auth endpoints
  async sendOTP(mobileNumber: string): Promise<ApiResponse> {
    return apiClient.post(API_ENDPOINTS.AUTH.SEND_OTP, { mobileNumber });
  },

  async login(mobileNumber: string, otp: string): Promise<AuthResponse> {
    return apiClient.post(API_ENDPOINTS.AUTH.LOGIN, { mobileNumber, otp });
  },

  async logout(): Promise<ApiResponse> {
    return apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
  },

  // User endpoints
  async getProfile(token: string): Promise<ApiResponse> {
    return apiClient.get(API_ENDPOINTS.USER.PROFILE, token);
  },

  async updateProfile(token: string, data: UpdateProfileRequest): Promise<ApiResponse> {
    return apiClient.put(API_ENDPOINTS.USER.PROFILE, data, token);
  },

  async updateLocation(token: string, data: UpdateLocationRequest): Promise<ApiResponse> {
    return apiClient.put(API_ENDPOINTS.USER.LOCATION, data, token);
  },

  async updateMobileNumber(newMobileNumber: string, otp: string): Promise<ApiResponse> {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication token not found');
    }
    return apiClient.put(API_ENDPOINTS.USER.UPDATE_MOBILE, { newMobileNumber, otp }, token);
  },

  async getUsersWithMessages(): Promise<ApiResponse> {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication token not found');
    }
    return apiClient.get(API_ENDPOINTS.USER.MESSAGES, token);
  },

  async searchUsers(query: string): Promise<ApiResponse> {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication token not found');
    }
    return apiClient.get(`${API_ENDPOINTS.USER.SEARCH}?query=${encodeURIComponent(query)}`, token);
  },

  async getUserById(userId: string): Promise<ApiResponse> {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication token not found');
    }
    return apiClient.get(`${API_ENDPOINTS.USER.PROFILE.replace('/profile', '')}/${userId}`, token);
  },

  // Follow system
  async sendFollowRequest(userId: string): Promise<ApiResponse> {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication token not found');
    }
    return apiClient.post(`/user/follow/${userId}`, {}, token);
  },

  async unfollowUser(userId: string): Promise<ApiResponse> {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication token not found');
    }
    return apiClient.delete(`/user/follow/${userId}`, token);
  },

  async cancelFollowRequest(userId: string): Promise<ApiResponse> {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication token not found');
    }
    return apiClient.delete(`/user/follow/request/${userId}`, token);
  },

  async acceptFollowRequest(requestId: string): Promise<ApiResponse> {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication token not found');
    }
    return apiClient.post(`/user/follow/request/${requestId}/accept`, {}, token);
  },

  async rejectFollowRequest(requestId: string): Promise<ApiResponse> {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication token not found');
    }
    return apiClient.post(`/user/follow/request/${requestId}/reject`, {}, token);
  },

  async getFollowRequests(): Promise<ApiResponse> {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication token not found');
    }
    return apiClient.get('/user/follow/requests', token);
  },

  // Block system
  async blockUser(userId: string): Promise<ApiResponse> {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication token not found');
    }
    return apiClient.post(`/user/block/${userId}`, {}, token);
  },

  async unblockUser(userId: string): Promise<ApiResponse> {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication token not found');
    }
    return apiClient.delete(`/user/block/${userId}`, token);
  },

  // Direct messaging
  async sendDirectMessage(userId: string, message: string, messageType: 'text' | 'image' | 'audio' = 'text', imageUrl?: string, audioUrl?: string): Promise<ApiResponse> {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication token not found');
    }
    return apiClient.post('/chat/direct-message', { receiverId: userId, message, messageType, imageUrl, audioUrl }, token);
  },

  async getDirectMessages(userId: string): Promise<ApiResponse> {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication token not found');
    }
    return apiClient.get(`/chat/direct-message/${userId}`, token);
  },

  async markDirectMessagesAsSeen(otherUserId: string): Promise<ApiResponse> {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication token not found');
    }
    return apiClient.put(`/chat/direct-message/seen/${otherUserId}`, {}, token);
  },

  // Notifications
  async markNotificationAsRead(notificationId: string): Promise<ApiResponse> {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication token not found');
    }
    return apiClient.put(`/user/notifications/${notificationId}/read`, {}, token);
  },

  // Username endpoints
  async checkUsername(token: string, username: string): Promise<ApiResponse> {
    return apiClient.get(`${API_ENDPOINTS.USERNAME.CHECK}?username=${encodeURIComponent(username)}`, token);
  },

  async updateUsername(token: string, username: string): Promise<ApiResponse> {
    return apiClient.put(API_ENDPOINTS.USERNAME.UPDATE, { username }, token);
  },

  // Room endpoints
  ...roomApi,

  // Notification endpoints
  ...notificationApi,

  // Chat endpoints
  async getRoomMessages(roomId: string, limit: number = 50, offset: number = 0, beforeTimestamp?: string): Promise<ApiResponse> {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication token not found');
    }
    
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString()
    });
    
    if (beforeTimestamp) {
      params.append('beforeTimestamp', beforeTimestamp);
    }
    
    console.log('🔑 getRoomMessages - Token:', {
      hasToken: !!token,
      tokenLength: token?.length,
      roomId,
      limit,
      offset,
      beforeTimestamp
    });
    
    return apiClient.get(`/chat/messages/${roomId}?${params.toString()}`, token);
  },

  async sendMessage(data: {
    roomId: string;
    message: string;
    messageType: 'text' | 'image' | 'audio';
    imageUrl?: string;
    audioUrl?: string;
  }): Promise<ApiResponse> {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication token not found');
    }
    return apiClient.post('/chat/send', data, token);
  },

  async uploadChatImage(formData: FormData): Promise<ApiResponse> {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication token not found');
    }
    return apiClient.post('/chat/upload-image', formData, token);
  },

  async uploadChatAudio(formData: FormData): Promise<ApiResponse> {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication token not found');
    }
    return apiClient.post('/chat/upload-audio', formData, token);
  },

  async uploadDirectMessageImage(formData: FormData): Promise<ApiResponse> {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication token not found');
    }
    return apiClient.post('/chat/direct-message/upload-image', formData, token);
  },

  async uploadDirectMessageAudio(formData: FormData): Promise<ApiResponse> {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication token not found');
    }
    return apiClient.post('/chat/direct-message/upload-audio', formData, token);
  },
};


