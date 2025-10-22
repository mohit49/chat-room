import { apiClient } from './client';

export interface Notification {
  id: string;
  type: 'room_invitation' | 'room_approved' | 'room_rejected' | 'room_removed' | 'role_changed' | 'follow_request' | 'follow_accepted';
  title: string;
  message: string;
  recipientId: string;
  senderId: string;
  roomId?: string;
  roomName?: string;
  status: 'pending' | 'approved' | 'rejected' | 'read' | 'unread';
  metadata?: {
    invitationId?: string;
    newRole?: string;
    followRequestId?: string;
    senderUsername?: string;
    senderProfilePicture?: any;
    [key: string]: any;
  };
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  sender?: {
    username: string;
    mobileNumber: string;
    profile: {
      profilePicture?: {
        type: 'upload' | 'avatar';
        url?: string;
        avatarStyle?: string;
        seed?: string;
      };
    };
  };
  room?: {
    name: string;
    roomId: string;
    profilePicture?: {
      type: 'upload' | 'avatar';
      url?: string;
      avatarStyle?: string;
      seed?: string;
    };
  };
}

export const notificationApi = {
  // Get user notifications
  getNotifications: async (limit: number = 20, offset: number = 0) => {
    const response = await apiClient.get(`/notifications?limit=${limit}&offset=${offset}`);
    return response;
  },

  // Get unread notification count
  getUnreadCount: async () => {
    const response = await apiClient.get('/notifications/unread-count');
    return response;
  },

  // Mark notification as read
  markAsRead: async (notificationId: string) => {
    const response = await apiClient.put(`/notifications/${notificationId}/read`);
    return response;
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    const response = await apiClient.put('/notifications/read-all');
    return response;
  },

  // Approve room invitation (this should be in room routes, not notification routes)
  approveInvitation: async (notificationId: string) => {
    const response = await apiClient.post(`/rooms/approve-invitation`);
    return response;
  },

  // Reject room invitation (this should be in room routes, not notification routes)
  rejectInvitation: async (notificationId: string) => {
    const response = await apiClient.post(`/rooms/reject-invitation`);
    return response;
  },

  // Delete notification
  deleteNotification: async (notificationId: string) => {
    const response = await apiClient.delete(`/notifications/${notificationId}`);
    return response;
  },

  // Clear all notifications
  clearAllNotifications: async () => {
    const response = await apiClient.delete('/notifications/clear-all');
    return response;
  }
};



