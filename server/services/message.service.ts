import { directMessageModelDB } from '../models/directMessage.model';
import { ApiResponse } from '../../types';

interface MessageUser {
  id: string;
  username: string;
  profilePicture?: {
    type: 'upload' | 'avatar';
    url?: string;
    avatarStyle?: string;
    seed?: string;
  };
  latestMessage?: {
    id: string;
    message: string;
    timestamp: string;
    isRead: boolean;
  };
  unreadCount: number;
}

export const getUsersWithMessagesService = async (userId: string): Promise<ApiResponse> => {
  try {
    console.log('🔍 Fetching conversations for user:', userId);
    
    // First, let's check if there are any direct messages for this user
    const { DirectMessageModel } = await import('../database/schemas/directMessage.schema');
    const totalMessages = await DirectMessageModel.countDocuments({
      $or: [
        { senderId: userId },
        { receiverId: userId }
      ]
    });
    console.log('📊 Total direct messages for user:', totalMessages);
    
    // Let's also see some sample messages to understand the data structure
    const sampleMessages = await DirectMessageModel.find({
      $or: [
        { senderId: userId },
        { receiverId: userId }
      ]
    }).limit(3).sort({ timestamp: -1 });
    console.log('📝 Sample messages:', JSON.stringify(sampleMessages, null, 2));
    
    // Get real conversations with latest messages using the existing aggregation
    const conversations = await directMessageModelDB.getConversations(userId);
    console.log('📨 Found conversations:', conversations.length);
    console.log('📋 Conversations data:', JSON.stringify(conversations, null, 2));
    
    if (conversations.length === 0) {
      console.log('📭 No conversations found, returning empty list');
      return {
        success: true,
        data: {
          users: []
        }
      };
    }
    
    // Convert conversations to MessageUser format
    const messageUsers: MessageUser[] = conversations
      .filter(conv => {
        const hasValidUsername = conv.username && conv.username.trim() !== '';
        console.log('👤 User:', conv.username, 'Valid:', hasValidUsername);
        return hasValidUsername;
      })
      .map(conv => {
        console.log('💬 Processing conversation with:', conv.username, 'Last message:', conv.lastMessage?.message);
        console.log('🕒 Original timestamp:', conv.lastMessage?.timestamp);
        console.log('🕒 ISO timestamp:', conv.lastMessage?.timestamp?.toISOString());
        
        return {
          id: conv.userId,
          username: conv.username,
          profilePicture: conv.profilePicture || {
            type: 'avatar',
            avatarStyle: 'adventurer',
            seed: conv.username
          },
          latestMessage: conv.lastMessage ? {
            id: conv.lastMessage._id.toString(),
            message: conv.lastMessage.message,
            timestamp: conv.lastMessage.timestamp.toISOString(),
            isRead: conv.lastMessage.status === 'read'
          } : undefined,
          unreadCount: conv.unreadCount
        };
      })
      .sort((a, b) => {
        // Sort by latest message timestamp (most recent first)
        if (!a.latestMessage || !b.latestMessage) return 0;
        return new Date(b.latestMessage.timestamp).getTime() - new Date(a.latestMessage.timestamp).getTime();
      });

    console.log('✅ Returning', messageUsers.length, 'message users');
    return {
      success: true,
      data: {
        users: messageUsers
      }
    };
  } catch (error: any) {
    console.error('❌ Error in getUsersWithMessagesService:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch users with messages'
    };
  }
};
