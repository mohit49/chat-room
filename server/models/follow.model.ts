// MongoDB Follow Model with optimized operations

import { FollowRequestModel, FollowRelationshipModel, IFollowRequest, IFollowRelationship } from '../database/schemas/follow.schema';
import { NotFoundError, ConflictError } from '../utils/errors';

class FollowModelDB {
  // Follow Request Operations
  async createFollowRequest(data: {
    requesterId: string;
    receiverId: string;
  }): Promise<IFollowRequest> {
    // Check if users exist using storage model to avoid circular imports
    const { storage } = await import('./storage.model');
    const requester = await storage.getUserById(data.requesterId);
    const receiver = await storage.getUserById(data.receiverId);
    
    if (!requester) {
      throw new NotFoundError('Requester not found');
    }
    if (!receiver) {
      throw new NotFoundError('Receiver not found');
    }

    // Check if follow request already exists
    const existingRequest = await FollowRequestModel.findOne({
      requesterId: data.requesterId,
      receiverId: data.receiverId
    });

    if (existingRequest) {
      if (existingRequest.status === 'pending') {
        throw new ConflictError('Follow request already sent');
      }
      if (existingRequest.status === 'accepted') {
        throw new ConflictError('Already following this user');
      }
    }

    // Check if already following
    const existingFollow = await FollowRelationshipModel.findOne({
      followerId: data.requesterId,
      followingId: data.receiverId
    });

    if (existingFollow) {
      throw new ConflictError('Already following this user');
    }

    const followRequest = new FollowRequestModel(data);
    return await followRequest.save();
  }

  async getFollowRequestById(requestId: string): Promise<IFollowRequest | null> {
    return await FollowRequestModel.findById(requestId);
  }

  async getFollowRequestsForUser(userId: string): Promise<IFollowRequest[]> {
    return await FollowRequestModel.find({
      receiverId: userId,
      status: 'pending'
    }).populate('requesterId', 'username profilePicture').sort({ createdAt: -1 });
  }

  async acceptFollowRequest(requestId: string): Promise<boolean> {
    const request = await FollowRequestModel.findById(requestId);
    if (!request) {
      throw new NotFoundError('Follow request not found');
    }

    if (request.status !== 'pending') {
      throw new ConflictError('Follow request is not pending');
    }

    // Update request status
    request.status = 'accepted';
    await request.save();

    // Create follow relationship
    const followRelationship = new FollowRelationshipModel({
      followerId: request.requesterId,
      followingId: request.receiverId
    });
    await followRelationship.save();

    return true;
  }

  async rejectFollowRequest(requestId: string): Promise<boolean> {
    const request = await FollowRequestModel.findById(requestId);
    if (!request) {
      throw new NotFoundError('Follow request not found');
    }

    if (request.status !== 'pending') {
      throw new ConflictError('Follow request is not pending');
    }

    request.status = 'rejected';
    await request.save();
    return true;
  }

  async cancelFollowRequest(requesterId: string, receiverId: string): Promise<boolean> {
    const request = await FollowRequestModel.findOne({
      requesterId,
      receiverId,
      status: 'pending'
    });

    if (!request) {
      throw new NotFoundError('Follow request not found');
    }

    request.status = 'cancelled';
    await request.save();
    return true;
  }

  // Follow Relationship Operations
  async removeFollow(followerId: string, followingId: string): Promise<boolean> {
    const result = await FollowRelationshipModel.deleteOne({
      followerId,
      followingId
    });

    return result.deletedCount > 0;
  }

  async getFollowStatus(requesterId: string, receiverId: string): Promise<{
    isFollowing: boolean;
    isFollowedBy: boolean;
    followRequestSent: boolean;
    followRequestReceived: boolean;
  }> {
    const [followRelationship, reverseFollowRelationship, followRequest, reverseFollowRequest] = await Promise.all([
      FollowRelationshipModel.findOne({ followerId: requesterId, followingId: receiverId }),
      FollowRelationshipModel.findOne({ followerId: receiverId, followingId: requesterId }),
      FollowRequestModel.findOne({ requesterId, receiverId, status: 'pending' }),
      FollowRequestModel.findOne({ requesterId: receiverId, receiverId: requesterId, status: 'pending' })
    ]);

    return {
      isFollowing: !!followRelationship,
      isFollowedBy: !!reverseFollowRelationship,
      followRequestSent: !!followRequest,
      followRequestReceived: !!reverseFollowRequest
    };
  }

  async getFollowers(userId: string): Promise<IFollowRelationship[]> {
    return await FollowRelationshipModel.find({ followingId: userId })
      .populate('followerId', 'username profilePicture')
      .sort({ createdAt: -1 });
  }

  async getFollowing(userId: string): Promise<IFollowRelationship[]> {
    return await FollowRelationshipModel.find({ followerId: userId })
      .populate('followingId', 'username profilePicture')
      .sort({ createdAt: -1 });
  }

  async getFollowCounts(userId: string): Promise<{ followers: number; following: number }> {
    const [followers, following] = await Promise.all([
      FollowRelationshipModel.countDocuments({ followingId: userId }),
      FollowRelationshipModel.countDocuments({ followerId: userId })
    ]);

    return { followers, following };
  }
}

export const followModelDB = new FollowModelDB();
