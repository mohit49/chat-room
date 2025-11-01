import RoomModel from '../database/schemas/room.schema';
import { UserModel } from '../database/schemas/user.schema';
import { ChatMessageModel } from '../database/schemas/chatMessage.schema';
import { uploadFile } from '../utils/fileStorage';
import { ApiResponse } from '../../types';

interface SendMessageData {
  roomId: string;
  userId: string;
  message: string;
  messageType: 'text' | 'image' | 'audio';
  imageUrl?: string;
  audioUrl?: string;
}

export const chatService = {
  async getRoomMessages(roomId: string, userId: string, limit: number = 50, offset: number = 0, beforeTimestamp?: string): Promise<ApiResponse> {
    try {
      console.log('🔍 getRoomMessages called with:', { roomId, userId, limit, offset, beforeTimestamp });

      // Check if user is a member of the room
      const room = await RoomModel.findById(roomId);
      if (!room) {
        console.log('❌ Room not found for ID:', roomId);
        return { success: false, error: 'Room not found' };
      }

      console.log('✅ Room found:', {
        roomId: room._id.toString(),
        roomName: room.name,
        memberCount: room.members.length
      });

      const isMember = room.members.some(member => member.userId === userId);
      if (!isMember) {
        console.log('❌ User not a member of room:', {
          userId,
          roomMembers: room.members.map(m => ({ userId: m.userId, role: m.role }))
        });
        return { success: false, error: 'You are not a member of this room' };
      }

      console.log('✅ User is member of room');

      // Build query for messages
      let query: any = { roomId };
      
      // If beforeTimestamp is provided, get messages before that timestamp
      if (beforeTimestamp) {
        query.timestamp = { $lt: new Date(beforeTimestamp) };
      }

      // Get total count for pagination info
      const totalCount = await ChatMessageModel.countDocuments({ roomId });

      // Get messages for the room with pagination
      console.log('🔍 Searching for messages with query:', query);
      const messages = await ChatMessageModel.find(query)
        .sort({ timestamp: -1 }) // Sort by newest first for pagination
        .skip(offset)
        .limit(limit);

      console.log(`📖 Retrieved ${messages.length} messages from database for room ${roomId} (offset: ${offset}, limit: ${limit})`);
      console.log('📖 Sample messages:', messages.slice(0, 3).map(msg => ({
        id: (msg as any)._id.toString(),
        roomId: msg.roomId,
        username: msg.username,
        message: msg.message.substring(0, 30) + '...',
        timestamp: msg.timestamp
      })));

      // Check if there are more messages
      const hasMore = offset + messages.length < totalCount;
      const nextOffset = hasMore ? offset + messages.length : null;

      return {
        success: true,
        data: {
          messages: messages.reverse().map(msg => ({ // Reverse to show oldest first in chat
            id: (msg as any)._id.toString(),
            roomId: msg.roomId,
            userId: msg.userId,
            username: msg.username,
            message: msg.message,
            messageType: msg.messageType,
            imageUrl: msg.imageUrl,
            audioUrl: msg.audioUrl,
            timestamp: msg.timestamp,
            userProfilePicture: msg.userProfilePicture
          })),
          pagination: {
            totalCount,
            hasMore,
            nextOffset,
            currentOffset: offset,
            limit
          }
        }
      };
    } catch (error) {
      console.error('❌ Error getting room messages:', error);
      return { success: false, error: 'Failed to get messages' };
    }
  },

  async sendMessage(data: SendMessageData): Promise<ApiResponse> {
    try {
      const { roomId, userId, message, messageType, imageUrl, audioUrl } = data;

      console.log('🔍 sendMessage called with:', {
        roomId,
        userId,
        message: message,
        messageType,
        imageUrl,
        audioUrl
      });

      // Check if user is a member of the room
      const room = await RoomModel.findById(roomId);
      if (!room) {
        console.log('❌ Room not found for ID:', roomId);
        return { success: false, error: 'Room not found' };
      }

      console.log('✅ Room found:', {
        roomId: room._id.toString(),
        roomName: room.name,
        memberCount: room.members.length
      });

      const member = room.members.find(m => m.userId === userId);
      if (!member) {
        console.log('❌ User not found in room members:', {
          userId,
          roomMembers: room.members.map(m => ({ userId: m.userId, role: m.role }))
        });
        return { success: false, error: 'You are not a member of this room' };
      }

      console.log('✅ User found in room:', {
        userId: member.userId,
        role: member.role,
        status: member.status
      });

      // Check if user has permission to send messages (admin or editor only)
      if (member.role !== 'admin' && member.role !== 'editor') {
        console.log('❌ User does not have permission to send messages:', member.role);
        return { success: false, error: 'You do not have permission to send messages' };
      }

      // Get user details
      const user = await UserModel.findById(userId);
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      // Create message
      const chatMessage = new ChatMessageModel({
        roomId,
        userId,
        username: user.username,
        message,
        messageType,
        imageUrl,
        audioUrl,
        timestamp: new Date(),
        userProfilePicture: user.profile?.profilePicture
      });

      console.log('💾 Saving message to database:', {
        roomId,
        userId,
        username: user.username,
        message: message.substring(0, 50) + '...',
        messageType
      });

      await chatMessage.save();
      
      console.log('✅ Message saved to database with ID:', (chatMessage as any)._id.toString());

      return {
        success: true,
        data: {
          message: {
            id: (chatMessage as any)._id.toString(),
            roomId: chatMessage.roomId,
            userId: chatMessage.userId,
            username: chatMessage.username,
            message: chatMessage.message,
            messageType: chatMessage.messageType,
            imageUrl: chatMessage.imageUrl,
            audioUrl: chatMessage.audioUrl,
            timestamp: chatMessage.timestamp,
            userProfilePicture: chatMessage.userProfilePicture
          }
        }
      };
    } catch (error) {
      console.error('Error sending message:', error);
      return { success: false, error: 'Failed to send message' };
    }
  },

  async uploadImage(file: Express.Multer.File, roomId: string, userId: string): Promise<ApiResponse> {
    try {
      // Check if user is a member of the room
      const room = await RoomModel.findById(roomId);
      if (!room) {
        return { success: false, error: 'Room not found' };
      }

      const member = room.members.find(m => m.userId === userId);
      if (!member) {
        return { success: false, error: 'You are not a member of this room' };
      }

      // Check if user has permission to send messages
      if (member.role !== 'admin' && member.role !== 'editor') {
        return { success: false, error: 'You do not have permission to send messages' };
      }

      // Upload file
      const uploadResult = await uploadFile(file, 'chat-images');
      if (!uploadResult.success) {
        return { success: false, error: 'Failed to upload image' };
      }

      return {
        success: true,
        data: {
          imageUrl: uploadResult.url
        }
      };
    } catch (error) {
      console.error('Error uploading image:', error);
      return { success: false, error: 'Failed to upload image' };
    }
  },

  async uploadAudio(file: Express.Multer.File, roomId: string, userId: string): Promise<ApiResponse> {
    try {
      // Check if user is a member of the room
      const room = await RoomModel.findById(roomId);
      if (!room) {
        return { success: false, error: 'Room not found' };
      }

      const member = room.members.find(m => m.userId === userId);
      if (!member) {
        return { success: false, error: 'You are not a member of this room' };
      }

      // Check if user has permission to send messages
      if (member.role !== 'admin' && member.role !== 'editor') {
        return { success: false, error: 'You do not have permission to send messages' };
      }

      // Upload file
      const uploadResult = await uploadFile(file, 'chat-audio');
      if (!uploadResult.success) {
        return { success: false, error: 'Failed to upload audio' };
      }

      return {
        success: true,
        data: {
          audioUrl: uploadResult.url
        }
      };
    } catch (error) {
      console.error('Error uploading audio:', error);
      return { success: false, error: 'Failed to upload audio' };
    }
  },

  async deleteMessage(roomId: string, messageId: string, userId: string): Promise<ApiResponse> {
    try {
      // Validate MongoDB ObjectId
      if (!messageId || messageId === 'undefined' || messageId.length !== 24) {
        return { success: false, error: 'Invalid message ID' };
      }

      // Find the message
      const message = await ChatMessageModel.findById(messageId);
      if (!message) {
        return { success: false, error: 'Message not found' };
      }

      // Check if user is the owner of the message
      if (message.userId !== userId) {
        return { success: false, error: 'You can only delete your own messages' };
      }

      // Check if message belongs to the room
      if (message.roomId !== roomId) {
        return { success: false, error: 'Message does not belong to this room' };
      }

      // Delete the message
      await ChatMessageModel.findByIdAndDelete(messageId);

      // Delete associated files if they exist
      if (message.imageUrl || message.audioUrl) {
        const { deleteFile } = await import('../utils/fileDelete');
        if (message.imageUrl) await deleteFile(message.imageUrl);
        if (message.audioUrl) await deleteFile(message.audioUrl);
      }

      return { success: true, message: 'Message deleted successfully' };
    } catch (error) {
      console.error('Error deleting message:', error);
      return { success: false, error: 'Failed to delete message' };
    }
  }
};
