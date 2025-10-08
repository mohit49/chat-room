import { apiClient } from './client';
import { getAuthToken } from '../auth';

export interface CreateRoomData {
  name: string;
  description?: string;
  profilePicture?: {
    type: 'upload' | 'avatar';
    url?: string;
    avatarStyle?: string;
    seed?: string;
  };
}

export interface UpdateRoomData {
  name?: string;
  description?: string;
  profilePicture?: {
    type: 'upload' | 'avatar';
    url?: string;
    avatarStyle?: string;
    seed?: string;
  };
}

export interface RoomMember {
  userId: string;
  username: string;
  mobileNumber: string;
  role: 'admin' | 'editor' | 'viewer';
  status: 'active' | 'pending';
  joinedAt: string;
  profilePicture?: {
    type: 'upload' | 'avatar';
    url?: string;
    avatarStyle?: string;
    seed?: string;
  };
}

export interface Room {
  id: string;
  roomId: string; // Add the missing roomId field
  name: string;
  description?: string;
  profilePicture?: {
    type: 'upload' | 'avatar';
    url?: string;
    avatarStyle?: string;
    seed?: string;
  };
  members: RoomMember[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export const roomApi = {
  // Create a new room
  createRoom: async (data: CreateRoomData) => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication token not found');
    }
    const response = await apiClient.post('/rooms', data, token);
    return response;
  },

  // Get all rooms for the current user
  getRooms: async () => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication token not found');
    }
    const response = await apiClient.get('/rooms', token);
    return response;
  },

  // Get a specific room by ID
  getRoomById: async (id: string) => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication token not found');
    }
    const response = await apiClient.get(`/rooms/${id}`, token);
    return response;
  },

  // Update room details
  updateRoom: async (id: string, data: UpdateRoomData) => {
    console.log('API updateRoom called with id:', id);
    console.log('API updateRoom data:', data);
    const url = `/rooms/${id}`;
    console.log('API updateRoom URL:', url);
    const token = getAuthToken();
    console.log('API updateRoom token:', token ? 'Token found' : 'No token');
    if (!token) {
      throw new Error('Authentication token not found');
    }
    const response = await apiClient.put(url, data, token);
    console.log('API updateRoom response:', response);
    return response;
  },

  // Delete a room
  deleteRoom: async (id: string) => {
    const response = await apiClient.delete(`/rooms/${id}`);
    return response;
  },

  // Add a member to the room
  addMember: async (roomId: string, username: string) => {
    const response = await apiClient.post(`/rooms/${roomId}/members`, {
      username
    });
    return response;
  },

  // Get room members
  getRoomMembers: async (roomId: string) => {
    const response = await apiClient.get(`/rooms/${roomId}/members`);
    return response;
  },

  // Change member role
  changeMemberRole: async (roomId: string, memberId: string, newRole: 'admin' | 'editor' | 'viewer') => {
    const response = await apiClient.put(`/rooms/${roomId}/members/${memberId}/role`, {
      newRole
    });
    return response;
  },

  // Remove a member from the room
  removeMember: async (roomId: string, memberId: string) => {
    const response = await apiClient.delete(`/rooms/${roomId}/members/${memberId}`);
    return response;
  },

  // Get pending invitations for a room
  getPendingInvitations: async (roomId: string) => {
    const response = await apiClient.get(`/rooms/${roomId}/pending-invitations`);
    return response;
  },

  // Approve room invitation
  approveRoomInvitation: async (roomId: string, userId: string) => {
    const response = await apiClient.post('/rooms/approve-invitation', {
      roomId,
      userId
    });
    return response;
  },

  // Reject room invitation
  rejectRoomInvitation: async (roomId: string, userId: string) => {
    const response = await apiClient.post('/rooms/reject-invitation', {
      roomId,
      userId
    });
    return response;
  },

  // Leave room
  leaveRoom: async (roomId: string) => {
    const response = await apiClient.post(`/rooms/${roomId}/leave`);
    return response;
  }
};
