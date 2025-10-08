import mongoose, { Schema, Document } from 'mongoose';

export interface IBlock extends Document {
  _id: string;
  blockerId: string; // User who blocked
  blockedUserId: string; // User who was blocked
  reason?: string; // Optional reason for blocking
  createdAt: Date;
  updatedAt: Date;
}

const BlockSchema = new Schema<IBlock>({
  blockerId: {
    type: String,
    required: true,
    ref: 'User'
  },
  blockedUserId: {
    type: String,
    required: true,
    ref: 'User'
  },
  reason: {
    type: String,
    maxlength: 500,
    trim: true
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
BlockSchema.index({ blockerId: 1, blockedUserId: 1 }, { unique: true });
BlockSchema.index({ blockerId: 1 });
BlockSchema.index({ blockedUserId: 1 });
BlockSchema.index({ createdAt: -1 });

// Prevent self-blocking
BlockSchema.pre('save', function(next) {
  if (this.blockerId === this.blockedUserId) {
    const error = new Error('Cannot block yourself');
    return next(error);
  }
  next();
});

export const BlockModel = mongoose.model<IBlock>('Block', BlockSchema);
