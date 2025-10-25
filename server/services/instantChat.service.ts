import InstantChatModel, { IInstantChat, IInstantChatParticipant, IInstantChatMessage } from '../database/schemas/instantChat.schema';
import { nanoid } from 'nanoid';

class InstantChatService {
  // Generate unique chat ID
  generateChatId(): string {
    return nanoid(12); // 12 character unique ID
  }

  // Generate anonymous user ID
  generateAnonymousUserId(): string {
    return `anon_${nanoid(10)}`;
  }

  // Create instant chat
  async createInstantChat(creatorId?: string, creatorName?: string, storeHistory: boolean = false): Promise<IInstantChat> {
    const chatId = this.generateChatId();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Expires in 24 hours

    const instantChat = new InstantChatModel({
      chatId,
      creatorId,
      creatorName,
      storeHistory,
      participants: [],
      messages: [],
      isActive: true,
      expiresAt
    });

    await instantChat.save();
    return instantChat;
  }

  // Get instant chat by ID
  async getInstantChatById(chatId: string): Promise<IInstantChat | null> {
    const chat = await InstantChatModel.findOne({ chatId, isActive: true });
    return chat;
  }

  // Join instant chat
  async joinInstantChat(chatId: string, userName: string, userId?: string): Promise<{ chat: IInstantChat; participantId: string }> {
    const chat = await this.getInstantChatById(chatId);
    
    if (!chat) {
      throw new Error('Instant chat not found or expired');
    }

    // First, check if a participant with the same name already exists
    const existingParticipantByName = chat.participants.find(p => 
      p.name.toLowerCase().trim() === userName.toLowerCase().trim()
    );
    
    if (existingParticipantByName) {
      // Return existing participant ID for user with same name
      console.log(`👤 User with name "${userName}" already exists, reusing participant ID: ${existingParticipantByName.id}`);
      return { chat, participantId: existingParticipantByName.id };
    }

    // Generate participant ID
    const participantId = userId || this.generateAnonymousUserId();
    const isAnonymous = !userId;

    // Check if participant already exists by ID (shouldn't happen after name check, but keep for safety)
    const existingParticipantById = chat.participants.find(p => p.id === participantId);
    if (existingParticipantById) {
      return { chat, participantId };
    }

    // Add new participant
    const newParticipant: IInstantChatParticipant = {
      id: participantId,
      name: userName,
      isAnonymous,
      joinedAt: new Date()
    };

    chat.participants.push(newParticipant);
    await chat.save();

    console.log(`✅ New participant added: ${userName} (${participantId})`);
    return { chat, participantId };
  }

  // Send message in instant chat
  async sendMessage(
    chatId: string,
    senderId: string,
    senderName: string,
    message: string,
    messageType: 'text' | 'image' | 'audio' = 'text',
    imageUrl?: string,
    audioUrl?: string
  ): Promise<IInstantChatMessage> {
    const chat = await this.getInstantChatById(chatId);
    
    if (!chat) {
      throw new Error('Instant chat not found or expired');
    }

    const newMessage: IInstantChatMessage = {
      id: nanoid(),
      senderId,
      senderName,
      message,
      messageType,
      imageUrl,
      audioUrl,
      timestamp: new Date()
    };

    // Only store message if storeHistory is enabled
    if (chat.storeHistory) {
      chat.messages.push(newMessage);
      await chat.save();
    }

    return newMessage;
  }

  // Get chat messages (only if storeHistory is enabled)
  async getChatMessages(chatId: string): Promise<IInstantChatMessage[]> {
    const chat = await this.getInstantChatById(chatId);
    
    if (!chat) {
      throw new Error('Instant chat not found or expired');
    }

    if (!chat.storeHistory) {
      return [];
    }

    return chat.messages;
  }

  // Get chat participants
  async getChatParticipants(chatId: string): Promise<IInstantChatParticipant[]> {
    const chat = await this.getInstantChatById(chatId);
    
    if (!chat) {
      throw new Error('Instant chat not found or expired');
    }

    return chat.participants;
  }

  // End instant chat
  async endInstantChat(chatId: string, userId?: string): Promise<boolean> {
    const chat = await this.getInstantChatById(chatId);
    
    if (!chat) {
      throw new Error('Instant chat not found');
    }

    // Only creator can end the chat
    if (userId && chat.creatorId && chat.creatorId !== userId) {
      throw new Error('Only the creator can end this chat');
    }

    chat.isActive = false;
    await chat.save();

    return true;
  }

  // Delete message from instant chat
  async deleteMessage(chatId: string, messageId: string, senderId: string): Promise<boolean> {
    const chat = await this.getInstantChatById(chatId);
    
    if (!chat) {
      throw new Error('Instant chat not found or expired');
    }

    // Find the message
    const messageIndex = chat.messages.findIndex(m => m.id === messageId);
    
    if (messageIndex === -1) {
      throw new Error('Message not found');
    }

    const message = chat.messages[messageIndex];

    // Check if the user is the sender of the message
    if (message.senderId !== senderId) {
      throw new Error('You can only delete your own messages');
    }

    // Remove the message
    chat.messages.splice(messageIndex, 1);
    await chat.save();

    return true;
  }
}

export const instantChatService = new InstantChatService();

