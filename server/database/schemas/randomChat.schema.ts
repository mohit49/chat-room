import mongoose, { Schema, Document } from 'mongoose';

export interface IRandomChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  messageType: 'text' | 'image' | 'audio';
  imageUrl?: string;
  audioUrl?: string;
  timestamp: Date;
}

export interface IRandomChatSession extends Document {
  sessionId: string;
  user1Id: string;
  user2Id: string;
  status: 'connecting' | 'connected' | 'disconnected';
  messages: IRandomChatMessage[];
  startedAt: Date;
  endedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const randomChatMessageSchema = new Schema({
  id: { type: String, required: true },
  senderId: { type: String, required: true },
  senderName: { type: String, required: true },
  message: { type: String, required: true },
  messageType: { type: String, enum: ['text', 'image', 'audio'], default: 'text' },
  imageUrl: { type: String },
  audioUrl: { type: String },
  timestamp: { type: Date, default: Date.now }
});

const randomChatSessionSchema = new Schema({
  sessionId: { type: String, required: true, unique: true },
  user1Id: { type: String, required: true, index: true },
  user2Id: { type: String, required: true, index: true },
  status: { 
    type: String, 
    enum: ['connecting', 'connected', 'disconnected'], 
    default: 'connecting',
    index: true
  },
  messages: [randomChatMessageSchema],
  startedAt: { type: Date, default: Date.now },
  endedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Index for finding active sessions
randomChatSessionSchema.index({ status: 1, createdAt: -1 });

// Index for finding user's sessions
randomChatSessionSchema.index({ user1Id: 1, status: 1 });
randomChatSessionSchema.index({ user2Id: 1, status: 1 });

const RandomChatSessionModel = mongoose.model<IRandomChatSession>('RandomChatSession', randomChatSessionSchema);

export default RandomChatSessionModel;


