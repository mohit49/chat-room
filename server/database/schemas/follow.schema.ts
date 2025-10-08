import mongoose, { Schema, Document } from 'mongoose';

export interface IFollowRequest extends Document {
  _id: string;
  requesterId: string; // User who sent the follow request
  receiverId: string; // User who received the follow request
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date; // Optional expiration for pending requests
}

export interface IFollowRelationship extends Document {
  _id: string;
  followerId: string; // User who is following
  followingId: string; // User being followed
  createdAt: Date;
  updatedAt: Date;
}

const FollowRequestSchema = new Schema<IFollowRequest>({
  requesterId: {
    type: String,
    required: true,
    ref: 'User'
  },
  receiverId: {
    type: String,
    required: true,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'cancelled'],
    default: 'pending'
  },
  expiresAt: {
    type: Date,
    default: function() {
      // Set expiration to 30 days from now for pending requests
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

const FollowRelationshipSchema = new Schema<IFollowRelationship>({
  followerId: {
    type: String,
    required: true,
    ref: 'User'
  },
  followingId: {
    type: String,
    required: true,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes for efficient queries
FollowRequestSchema.index({ requesterId: 1, receiverId: 1 }, { unique: true });
FollowRequestSchema.index({ receiverId: 1, status: 1 });
FollowRequestSchema.index({ status: 1, createdAt: -1 });
FollowRequestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

FollowRelationshipSchema.index({ followerId: 1, followingId: 1 }, { unique: true });
FollowRelationshipSchema.index({ followerId: 1 });
FollowRelationshipSchema.index({ followingId: 1 });

// Prevent self-following
FollowRequestSchema.pre('save', function(next) {
  if (this.requesterId === this.receiverId) {
    const error = new Error('Cannot follow yourself');
    return next(error);
  }
  next();
});

FollowRelationshipSchema.pre('save', function(next) {
  if (this.followerId === this.followingId) {
    const error = new Error('Cannot follow yourself');
    return next(error);
  }
  next();
});

export const FollowRequestModel = mongoose.model<IFollowRequest>('FollowRequest', FollowRequestSchema);
export const FollowRelationshipModel = mongoose.model<IFollowRelationship>('FollowRelationship', FollowRelationshipSchema);
