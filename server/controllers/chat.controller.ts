import { Request, Response } from 'express';
import { chatService } from '../services/chat.service';
import { io } from '../index';

export const chatController = {
  async getRoomMessages(req: Request, res: Response) {
    try {
      const { roomId } = req.params;
      const userId = req.userId;
      const { limit = 50, offset = 0, beforeTimestamp } = req.query;

      console.log('📥 getRoomMessages API called:', {
        roomId,
        userId,
        hasUser: !!req.user,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        beforeTimestamp
      });

      if (!userId) {
        console.log('❌ No user ID in request');
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const result = await chatService.getRoomMessages(
        roomId, 
        userId, 
        parseInt(limit as string), 
        parseInt(offset as string),
        beforeTimestamp as string
      );
      
      console.log('📤 getRoomMessages result:', {
        success: result.success,
        messageCount: result.data?.messages?.length || 0,
        hasMore: result.data?.pagination?.hasMore,
        totalCount: result.data?.pagination?.totalCount,
        error: result.error
      });
      
      if (result.success) {
        res.json({
          success: true,
          data: result.data
        });
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('❌ Error getting room messages:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  },

  async sendMessage(req: Request, res: Response) {
    try {
      const { roomId, message, messageType, imageUrl } = req.body;
      const userId = req.userId;

      console.log('📨 Chat controller received message:', {
        roomId,
        userId,
        message: message?.substring(0, 50) + '...',
        messageType,
        hasImageUrl: !!imageUrl
      });

      if (!userId) {
        console.log('❌ No user ID in request');
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const result = await chatService.sendMessage({
        roomId,
        userId,
        message,
        messageType,
        imageUrl
      });

      console.log('📤 Chat service result:', {
        success: result.success,
        error: result.error,
        hasMessage: !!result.data?.message
      });

      if (result.success) {
        // Emit message to all room members via socket
        const messageData = result.data?.message;
        if (messageData) {
          console.log('📤 Broadcasting message to room:', roomId, messageData);
          // Emit new_message event directly to room members
          io.to(`room_${roomId}`).emit('new_message', messageData);
        }

        res.json({
          success: true,
          message: messageData
        });
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  },

  async uploadImage(req: Request, res: Response) {
    try {
      const userId = req.userId;
      const { roomId } = req.body;

      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      if (!req.file) {
        return res.status(400).json({ success: false, error: 'No image file provided' });
      }

      const result = await chatService.uploadImage(req.file, roomId, userId);
      
      if (result.success) {
        res.json({
          success: true,
          imageUrl: result.data?.imageUrl
        });
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
};
