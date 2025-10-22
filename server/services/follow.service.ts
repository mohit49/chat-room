import { storage } from '../models/storage.model';
import { NotFoundError, ConflictError } from '../utils/errors';
import { notificationService } from './notification.service';
import socketService from './socket.service';

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

    // Directly create the follow relationship (auto-accept flow)
    const { FollowRequestModel, FollowRelationshipModel } = await import('../database/schemas/follow.schema');
    
    // Create follow request with accepted status
    const followRequestDoc = new FollowRequestModel({
      requesterId,
      receiverId,
      status: 'accepted'
    });
    await followRequestDoc.save();
    
    // Immediately create the follow relationship
    const followRelationship = new FollowRelationshipModel({
      followerId: requesterId,
      followingId: receiverId
    });
    await followRelationship.save();

    // Create the response object
    const followRequest: FollowRequest = {
      id: followRequestDoc._id.toString(),
      requesterId,
      receiverId,
      status: 'accepted',
      createdAt: followRequestDoc.createdAt.toISOString(),
      updatedAt: followRequestDoc.updatedAt.toISOString()
    };

    // Create notification for receiver
    const notification = await notificationService.createNotification({
      recipientId: receiverId,
      senderId: requesterId,
      type: 'follow_request',
      title: 'New Follower',
      message: `${requester.username || requester.mobileNumber} started following you`,
      status: 'unread',
      metadata: {
        followRequestId: followRequest.id,
        senderUsername: requester.username,
        senderProfilePicture: requester.profile?.profilePicture
      }
    });

    // Emit socket event
    socketService.emitToUser(receiverId, 'follow:request', {
      followRequest,
      notification
    });

    return followRequest;
  }

  async unfollowUser(requesterId: string, receiverId: string): Promise<boolean> {
    // Remove follow relationship
    const result = await storage.removeFollow(requesterId, receiverId);
    
    // Also delete the follow request from database
    const { FollowRequestModel } = await import('../database/schemas/follow.schema');
    await FollowRequestModel.deleteOne({
      requesterId,
      receiverId,
      status: 'accepted'
    });
    
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

    // Get users for notification
    const requester = await storage.getUserById(request.requesterId);
    const accepter = await storage.getUserById(accepterId);

    if (requester && accepter) {
      // Create notification for requester
      const notification = await notificationService.createNotification({
        recipientId: request.requesterId,
        senderId: accepterId,
        type: 'follow_accepted',
        title: 'Follow Request Accepted',
        message: `${accepter.username || accepter.mobileNumber} accepted your follow request`,
        status: 'unread',
        metadata: {
          senderUsername: accepter.username,
          senderProfilePicture: accepter.profile?.profilePicture
        }
      });

      // Emit socket event to requester
      socketService.emitToUser(request.requesterId, 'follow:accepted', {
        followRequest: request,
        notification
      });
    }

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

  async getFollowers(userId: string): Promise<any[]> {
    const followers = await storage.getFollowers(userId);
    return followers;
  }

  async getFollowing(userId: string): Promise<any[]> {
    const following = await storage.getFollowing(userId);
    return following;
  }

  async getFollowCounts(userId: string): Promise<{ followers: number; following: number }> {
    const counts = await storage.getFollowCounts(userId);
    return counts;
  }
}

export const followService = new FollowServiceImpl();
