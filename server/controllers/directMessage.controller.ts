import { Request, Response, NextFunction } from 'express';
import { directMessageService } from '../services/directMessage.service';
import { AuthRequest } from '../middleware/auth';
import { sendNotificationToUser, connectedUsers } from '../socket/socketHandlers';
import { io } from '../index';

export const directMessageController = {
  // Send direct message
  sendDirectMessage: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { receiverId, message } = req.body;
      const senderId = req.userId!;

      if (!receiverId || !message) {
        return res.status(400).json({
          success: false,
          error: 'Receiver ID and message are required'
        });
      }

      if (senderId === receiverId) {
        return res.status(400).json({
          success: false,
          error: 'Cannot send message to yourself'
        });
      }

      const result = await directMessageService.sendDirectMessage(senderId, receiverId, message);
      
      // Send notification to receiver
      try {
        console.log('🔍 Debug - Notification senderId type:', typeof senderId, 'value:', senderId);
        console.log('🔍 Debug - Notification receiverId type:', typeof receiverId, 'value:', receiverId);

        await sendNotificationToUser(io, receiverId, {
          type: 'direct_message',
          title: 'New Message',
          message: result.message,
          senderId: senderId,
          messageId: result.id,
          senderUsername: result.senderUsername,
          senderProfilePicture: result.senderProfilePicture,
          timestamp: result.timestamp,
          metadata: {
            senderUsername: result.senderUsername,
            senderProfilePicture: result.senderProfilePicture,
            conversationId: `${senderId}_${receiverId}`
          },
          data: {
            messageId: result.id,
            conversationId: `${senderId}_${receiverId}`
          }
        });

        console.log('✅ Notification processed for direct message');
        
        // Also emit direct_message event for real-time chat updates
        try {
          // Send to receiver's personal room
          io.to(`user_${receiverId}`).emit('direct_message', {
            id: result.id,
            senderId: senderId,
            receiverId: receiverId,
            message: result.message,
            messageType: 'text',
            timestamp: result.timestamp,
            senderUsername: result.senderUsername,
            senderProfilePicture: result.senderProfilePicture
          });
        } catch (socketError) {
          console.error('❌ Failed to send direct message event:', socketError);
        }
      } catch (notificationError) {
        console.error('❌ Failed to process notification for direct message:', notificationError);
        // Don't fail the request if notification fails
      }
      
      res.json({
        success: true,
        message: 'Direct message sent successfully',
        messageId: result.id,
        data: result
      });
    } catch (error: any) {
      next(error);
    }
  },

  // Get direct messages with a user
  getDirectMessages: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;
      const requesterId = req.userId!;

      const messages = await directMessageService.getDirectMessages(requesterId, userId);
      
      res.json({
        success: true,
        messages
      });
    } catch (error: any) {
      next(error);
    }
  },

  // Get all direct message conversations
  getConversations: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;
      const conversations = await directMessageService.getConversations(userId);
      
      res.json({
        success: true,
        conversations
      });
    } catch (error: any) {
      next(error);
    }
  },

  // Mark messages as seen
  markMessagesAsSeen: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { otherUserId } = req.params;
      const userId = req.userId!;

      if (!otherUserId) {
        return res.status(400).json({
          success: false,
          error: 'Other user ID is required'
        });
      }

      const success = await directMessageService.markMessagesAsSeen(userId, otherUserId);
      
      res.json({
        success,
        message: success ? 'Messages marked as seen' : 'No messages to mark as seen'
      });
    } catch (error: any) {
      next(error);
    }
  }
};
