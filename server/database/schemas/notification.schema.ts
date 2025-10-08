import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  _id: string;
  type: 'room_invitation' | 'room_approved' | 'room_rejected' | 'room_removed' | 'role_changed' | 'direct_message' | 'follow_request' | 'follow_accepted' | 'message_received';
  title: string;
  message: string;
  recipientId: string; // User ID who receives the notification
  senderId: string; // User ID who sent the notification
  roomId?: string; // Room ID if notification is room-related
  roomName?: string; // Room name for display
  messageId?: string; // Direct message ID if notification is message-related
  followRequestId?: string; // Follow request ID if notification is follow-related
  status: 'pending' | 'approved' | 'rejected' | 'read' | 'unread';
  metadata?: {
    invitationId?: string; // For room invitations
    newRole?: string; // For role changes
    messagePreview?: string; // For message notifications
    senderUsername?: string; // For message/follow notifications
    [key: string]: any;
  };
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date; // Optional expiration date
}

const NotificationSchema = new Schema<INotification>({
  type: {
    type: String,
    enum: ['room_invitation', 'room_approved', 'room_rejected', 'room_removed', 'role_changed', 'direct_message', 'follow_request', 'follow_accepted', 'message_received'],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  recipientId: {
    type: String,
    required: true,
    ref: 'User'
  },
  senderId: {
    type: String,
    required: true,
    ref: 'User'
  },
  roomId: {
    type: String,
    ref: 'Room',
    required: function() {
      return ['room_invitation', 'room_approved', 'room_rejected', 'room_removed', 'role_changed'].includes(this.type);
    }
  },
  roomName: {
    type: String,
    trim: true,
    maxlength: 100
  },
  messageId: {
    type: String,
    ref: 'DirectMessage'
  },
  followRequestId: {
    type: String,
    ref: 'FollowRequest'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'read', 'unread'],
    default: 'unread'
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  },
  expiresAt: {
    type: Date,
    default: function() {
      // Set expiration to 7 days from now for invitations
      if (this.type === 'room_invitation') {
        return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      }
      return undefined;
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

// Indexes for efficient queries
NotificationSchema.index({ recipientId: 1, status: 1 });
NotificationSchema.index({ senderId: 1 });
NotificationSchema.index({ roomId: 1 });
NotificationSchema.index({ type: 1 });
NotificationSchema.index({ createdAt: -1 });
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Compound index for user notifications
NotificationSchema.index({ recipientId: 1, status: 1, createdAt: -1 });

const Notification = mongoose.model<INotification>('Notification', NotificationSchema);

export default Notification;


