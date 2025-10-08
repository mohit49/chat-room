import mongoose, { Document, Schema } from 'mongoose';

export interface IRoomMember {
  userId: string;
  username: string;
  mobileNumber: string;
  role: 'admin' | 'editor' | 'viewer';
  status: 'active' | 'pending';
  joinedAt: Date;
  profilePicture?: {
    type: 'upload' | 'avatar';
    url?: string;
    avatarStyle?: string;
    seed?: string;
  };
}

export interface IRoom extends Document {
  _id: string;
  roomId: string; // Custom room ID like #ABC123
  name: string;
  description?: string;
  profilePicture?: {
    type: 'upload' | 'avatar';
    url?: string;
    avatarStyle?: string;
    seed?: string;
  };
  members: IRoomMember[];
  createdBy: string; // User ID who created the room
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

const RoomMemberSchema = new Schema<IRoomMember>({
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  username: {
    type: String,
    required: true
  },
  mobileNumber: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'editor', 'viewer'],
    default: 'viewer'
  },
  status: {
    type: String,
    enum: ['active', 'pending'],
    default: 'active'
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  profilePicture: {
    type: {
      type: String,
      enum: ['upload', 'avatar']
    },
    url: String,
    avatarStyle: String,
    seed: String
  }
}, { _id: false });

const RoomSchema = new Schema<IRoom>({
  roomId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  profilePicture: {
    type: {
      type: String,
      enum: ['upload', 'avatar']
    },
    url: String,
    avatarStyle: String,
    seed: String
  },
  members: [RoomMemberSchema],
  createdBy: {
    type: String,
    required: true,
    ref: 'User'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id.toString();
      ret.roomId = ret.roomId; // Explicitly set roomId
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Index for efficient queries
RoomSchema.index({ createdBy: 1 });
RoomSchema.index({ 'members.userId': 1 });
RoomSchema.index({ isActive: 1 });

// Ensure at least one admin exists
RoomSchema.pre('save', function(next) {
  const admins = this.members.filter(member => member.role === 'admin');
  if (admins.length === 0) {
    return next(new Error('Room must have at least one admin'));
  }
  next();
});

export default mongoose.model<IRoom>('Room', RoomSchema);
