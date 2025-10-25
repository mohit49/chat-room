import mongoose, { Document, Schema } from 'mongoose';

export interface IInstantChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  messageType: 'text' | 'image' | 'audio';
  imageUrl?: string;
  audioUrl?: string;
  timestamp: Date;
}

export interface IInstantChatParticipant {
  id: string;
  name: string;
  isAnonymous: boolean;
  joinedAt: Date;
}

export interface IInstantChat extends Document {
  chatId: string;
  creatorId?: string;
  creatorName?: string;
  storeHistory: boolean;
  participants: IInstantChatParticipant[];
  messages: IInstantChatMessage[];
  isActive: boolean;
  createdAt: Date;
  expiresAt: Date;
}

const instantChatMessageSchema = new Schema({
  id: { type: String, required: true },
  senderId: { type: String, required: true },
  senderName: { type: String, required: true },
  message: { type: String, required: true },
  messageType: { type: String, enum: ['text', 'image', 'audio'], default: 'text' },
  imageUrl: { type: String },
  audioUrl: { type: String },
  timestamp: { type: Date, default: Date.now }
});

const instantChatParticipantSchema = new Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  isAnonymous: { type: Boolean, default: false },
  joinedAt: { type: Date, default: Date.now }
});

const instantChatSchema = new Schema({
  chatId: { type: String, required: true, unique: true, index: true },
  creatorId: { type: String },
  creatorName: { type: String },
  storeHistory: { type: Boolean, default: false },
  participants: [instantChatParticipantSchema],
  messages: [instantChatMessageSchema],
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true }
}, {
  timestamps: true
});

// Auto-delete expired chats
instantChatSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const InstantChatModel = mongoose.model<IInstantChat>('InstantChat', instantChatSchema);

export default InstantChatModel;

