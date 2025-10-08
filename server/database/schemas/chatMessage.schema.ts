import mongoose, { Schema, Document } from 'mongoose';

export interface IChatMessage extends Document {
  roomId: string;
  userId: string;
  username: string;
  message: string;
  messageType: 'text' | 'image';
  imageUrl?: string;
  timestamp: Date;
  userProfilePicture?: {
    type: 'upload' | 'avatar';
    url?: string;
    avatarStyle?: string;
    seed?: string;
  };
}

const ChatMessageSchema = new Schema<IChatMessage>({
  roomId: {
    type: String,
    required: true,
    ref: 'Room'
  },
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  username: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true,
    maxlength: 1000
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
  userProfilePicture: {
    type: {
      type: String,
      enum: ['upload', 'avatar']
    },
    url: String,
    avatarStyle: String,
    seed: String
  }
}, {
  timestamps: true
});

// Index for efficient queries
ChatMessageSchema.index({ roomId: 1, timestamp: -1 });
ChatMessageSchema.index({ userId: 1 });

export const ChatMessageModel = mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);




