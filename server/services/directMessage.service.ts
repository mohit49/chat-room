import { storage } from '../models/storage.model';
import { NotFoundError, ConflictError } from '../utils/errors';

export interface DirectMessage {
  id: string;
  senderId: string;
  receiverId: string;
  message: string;
  messageType: 'text' | 'image' | 'audio';
  imageUrl?: string;
  audioUrl?: string;
  timestamp: string;
  senderUsername: string;
  senderProfilePicture?: {
    type: 'upload' | 'avatar';
    url?: string;
    avatarStyle?: string;
    seed?: string;
  };
}

export interface Conversation {
  userId: string;
  username: string;
  profilePicture?: {
    type: 'upload' | 'avatar';
    url?: string;
    avatarStyle?: string;
    seed?: string;
  };
  lastMessage: DirectMessage;
  unreadCount: number;
  lastMessageTime: string;
}

class DirectMessageServiceImpl {
  async sendDirectMessage(senderId: string, receiverId: string, message: string, messageType: 'text' | 'image' | 'audio' = 'text', imageUrl?: string, audioUrl?: string): Promise<DirectMessage> {
    // Check if users exist
    const sender = await storage.getUserById(senderId);
    const receiver = await storage.getUserById(receiverId);

    if (!sender) {
      throw new NotFoundError('Sender not found');
    }
    if (!receiver) {
      throw new NotFoundError('Receiver not found');
    }

    // Check if sender is blocked by receiver
    const isBlocked = await storage.isUserBlocked(receiverId, senderId);
    if (isBlocked) {
      throw new ConflictError('Cannot send message to this user');
    }

    // Create direct message
    const directMessage: DirectMessage = {
      id: `dm_${Date.now()}_${senderId}_${receiverId}`,
      senderId,
      receiverId,
      message,
      messageType,
      imageUrl,
      audioUrl,
      timestamp: new Date().toISOString(),
      senderUsername: sender.username || 'Unknown',
      senderProfilePicture: sender.profile?.profilePicture
    };

    // Store in database
    await storage.createDirectMessage(directMessage);

    return directMessage;
  }

  async getDirectMessages(requesterId: string, otherUserId: string): Promise<DirectMessage[]> {
    // Check if users exist
    const requester = await storage.getUserById(requesterId);
    const otherUser = await storage.getUserById(otherUserId);
    
    if (!requester) {
      throw new NotFoundError('Requester not found');
    }
    if (!otherUser) {
      throw new NotFoundError('Other user not found');
    }

    // Get direct messages between the two users
    const messages = await storage.getDirectMessages(requesterId, otherUserId);
    return messages;
  }

  async getConversations(userId: string): Promise<Conversation[]> {
    // Get all conversations for the user
    const conversations = await storage.getDirectMessageConversations(userId);
    return conversations;
  }

  async markMessagesAsSeen(userId: string, otherUserId: string): Promise<boolean> {
    // Import the model to avoid circular dependency
    const { directMessageModelDB } = await import('../models/directMessage.model');
    return await directMessageModelDB.markMessagesAsSeen(userId, otherUserId);
  }

  async deleteMessage(messageId: string, userId: string): Promise<boolean> {
    // Import the model to avoid circular dependency
    const { directMessageModelDB } = await import('../models/directMessage.model');
    return await directMessageModelDB.deleteMessage(messageId, userId);
  }

  async deleteConversation(userId1: string, userId2: string): Promise<boolean> {
    // Import the model to avoid circular dependency
    const { directMessageModelDB } = await import('../models/directMessage.model');
    return await directMessageModelDB.deleteConversation(userId1, userId2);
  }
}

export const directMessageService = new DirectMessageServiceImpl();
