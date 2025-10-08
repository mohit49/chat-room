import mongoose, { Schema, Document } from 'mongoose';

export interface IDirectMessage extends Document {
  _id: string;
  senderId: string; // User who sent the message
  receiverId: string; // User who received the message
  message: string;
  messageType: 'text' | 'image';
  imageUrl?: string;
  timestamp: Date;
  senderUsername: string;
  senderProfilePicture?: {
    type: 'upload' | 'avatar';
    url?: string;
    avatarStyle?: string;
    seed?: string;
  };
  status: 'sent' | 'delivered' | 'read';
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DirectMessageSchema = new Schema<IDirectMessage>({
  senderId: {
    type: String,
    required: true,
    ref: 'User'
  },
  receiverId: {
    type: String,
    required: true,
    ref: 'User'
  },
  message: {
    type: String,
    required: true,
    maxlength: 1000,
    trim: true
  },
  messageType: {
    type: String,
    enum: ['text', 'image'],
    required: true,
    default: 'text'
  },
  imageUrl: {
    type: String,
    required: function() {
      return this.messageType === 'image';
    }
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  senderUsername: {
    type: String,
    required: true
  },
  senderProfilePicture: {
    type: {
      type: String,
      enum: ['upload', 'avatar']
    },
    url: String,
    avatarStyle: String,
    seed: String
  },
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read'],
    default: 'sent'
  },
  readAt: {
    type: Date
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
DirectMessageSchema.index({ senderId: 1, receiverId: 1, timestamp: -1 });
DirectMessageSchema.index({ receiverId: 1, status: 1 });
DirectMessageSchema.index({ senderId: 1, timestamp: -1 });
DirectMessageSchema.index({ timestamp: -1 });

// Prevent self-messaging
DirectMessageSchema.pre('save', function(next) {
  if (this.senderId === this.receiverId) {
    const error = new Error('Cannot send message to yourself');
    return next(error);
  }
  next();
});

export const DirectMessageModel = mongoose.model<IDirectMessage>('DirectMessage', DirectMessageSchema);
