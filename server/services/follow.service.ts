import { storage } from '../models/storage.model';
import { NotFoundError, ConflictError } from '../utils/errors';

export interface FollowRequest {
  id: string;
  requesterId: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface FollowStatus {
  isFollowing: boolean;
  isFollowedBy: boolean;
  followRequestSent: boolean;
  followRequestReceived: boolean;
}

class FollowServiceImpl {
  async sendFollowRequest(requesterId: string, receiverId: string): Promise<FollowRequest> {
    // Check if users exist
    const requester = await storage.getUserById(requesterId);
    const receiver = await storage.getUserById(receiverId);
    
    if (!requester) {
      throw new NotFoundError('Requester not found');
    }
    if (!receiver) {
      throw new NotFoundError('Receiver not found');
    }

    // Check if already following
    const existingFollow = await this.getFollowStatus(requesterId, receiverId);
    if (existingFollow.isFollowing) {
      throw new ConflictError('Already following this user');
    }

    // Check if follow request already exists
    if (existingFollow.followRequestSent) {
      throw new ConflictError('Follow request already sent');
    }

    // Create follow request
    const followRequest: FollowRequest = {
      id: `follow_${Date.now()}_${requesterId}_${receiverId}`,
      requesterId,
      receiverId,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Store in database (you'll need to implement this in your storage model)
    await storage.createFollowRequest(followRequest);

    return followRequest;
  }

  async unfollowUser(requesterId: string, receiverId: string): Promise<boolean> {
    // Remove follow relationship
    const result = await storage.removeFollow(requesterId, receiverId);
    return result;
  }

  async cancelFollowRequest(requesterId: string, receiverId: string): Promise<boolean> {
    // Cancel pending follow request
    const result = await storage.cancelFollowRequest(requesterId, receiverId);
    return result;
  }

  async acceptFollowRequest(requestId: string, accepterId: string): Promise<boolean> {
    // Get the follow request
    const request = await storage.getFollowRequestById(requestId);
    if (!request) {
      throw new NotFoundError('Follow request not found');
    }

    if (request.receiverId !== accepterId) {
      throw new ConflictError('Not authorized to accept this request');
    }

    if (request.status !== 'pending') {
      throw new ConflictError('Follow request is not pending');
    }

    // Accept the request and create follow relationship
    const result = await storage.acceptFollowRequest(requestId);
    return result;
  }

  async rejectFollowRequest(requestId: string, rejecterId: string): Promise<boolean> {
    // Get the follow request
    const request = await storage.getFollowRequestById(requestId);
    if (!request) {
      throw new NotFoundError('Follow request not found');
    }

    if (request.receiverId !== rejecterId) {
      throw new ConflictError('Not authorized to reject this request');
    }

    // Reject the request
    const result = await storage.rejectFollowRequest(requestId);
    return result;
  }

  async getFollowRequests(userId: string): Promise<FollowRequest[]> {
    const requests = await storage.getFollowRequestsForUser(userId);
    return requests;
  }

  async getFollowStatus(requesterId: string, receiverId: string): Promise<FollowStatus> {
    const status = await storage.getFollowStatus(requesterId, receiverId);
    return status;
  }
}

export const followService = new FollowServiceImpl();
