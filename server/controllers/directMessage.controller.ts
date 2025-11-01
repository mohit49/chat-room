import { Request, Response, NextFunction } from 'express';
import { directMessageService } from '../services/directMessage.service';
import { AuthRequest } from '../middleware/auth';
import { sendNotificationToUser, connectedUsers, isDirectChatOpen } from '../socket/socketHandlers';
import { pushNotificationService } from '../services/pushNotification.service';
import { UserModel } from '../database/schemas/user.schema';
import { io } from '../index';

export const directMessageController = {
  // Send direct message
  sendDirectMessage: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { receiverId, message, messageType = 'text', imageUrl, audioUrl } = req.body;
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

      // Check if there's a block relationship (both ways)
      const { blockService } = await import('../services/block.service');
      const [isBlocked, isBlockedBy] = await Promise.all([
        blockService.isUserBlocked(senderId, receiverId),
        blockService.isUserBlocked(receiverId, senderId)
      ]);

      if (isBlocked || isBlockedBy) {
        return res.status(403).json({
          success: false,
          error: 'You cannot send messages to this user'
        });
      }

      const result = await directMessageService.sendDirectMessage(senderId, receiverId, message, messageType, imageUrl, audioUrl);
      
      // Check if receiver has push notifications enabled AND chat is NOT open
      const receiver = await UserModel.findById(receiverId);
      const hasPushEnabled = receiver?.profile?.notificationSettings?.pushEnabled && 
                            receiver?.profile?.notificationSettings?.directMessages;
      const isChatOpen = isDirectChatOpen(receiverId, senderId);
      
      console.log('📱 Push notification check:', {
        receiverId,
        hasPushEnabled,
        isChatOpen,
        shouldSend: hasPushEnabled && !isChatOpen
      });
      
      // Send push notification ONLY if enabled AND chat is NOT open
      if (hasPushEnabled && !isChatOpen) {
        try {
          await pushNotificationService.sendPushToUser(receiverId, {
            title: `New message from ${result.senderUsername}`,
            body: message.substring(0, 100),
            icon: '/logo-icon.png',
            data: {
              type: 'direct_message',
              senderId,
              messageId: result.id,
              senderUsername: result.senderUsername
            }
          });
          console.log('✅ Push notification sent for direct message (chat not open)');
        } catch (pushError) {
          console.error('❌ Failed to send push notification:', pushError);
          // Don't fail the request if push fails
        }
      } else if (isChatOpen) {
        console.log('ℹ️ Skipping push notification - chat is currently open');
      }
      
      // Send notification to receiver
      try {
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
        
        // Also emit direct_message event for real-time chat updates
        try {
          const messageData = {
            id: result.id,
            senderId: senderId,
            receiverId: receiverId,
            message: result.message,
            messageType: result.messageType,
            imageUrl: result.imageUrl,
            audioUrl: result.audioUrl,
            timestamp: result.timestamp,
            senderUsername: result.senderUsername,
            senderProfilePicture: result.senderProfilePicture
          };

          // Send to both sender and receiver for real-time updates
          io.to(`user_${receiverId}`).emit('direct_message', messageData);
          io.to(`user_${senderId}`).emit('direct_message', messageData);
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
  },

  // Delete a specific message
  deleteMessage: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { messageId } = req.params;
      const userId = req.userId!;

      if (!messageId) {
        return res.status(400).json({
          success: false,
          error: 'Message ID is required'
        });
      }

      const success = await directMessageService.deleteMessage(messageId, userId);
      
      if (success) {
        res.json({
          success: true,
          message: 'Message deleted successfully'
        });
      } else {
        res.status(404).json({
          success: false,
          error: 'Message not found or you do not have permission to delete it'
        });
      }
    } catch (error: any) {
      next(error);
    }
  },

  // Delete entire conversation
  deleteConversation: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { userId: otherUserId } = req.params;
      const userId = req.userId!;

      if (!otherUserId) {
        return res.status(400).json({
          success: false,
          error: 'User ID is required'
        });
      }

      const success = await directMessageService.deleteConversation(userId, otherUserId);
      
      if (success) {
        res.json({
          success: true,
          message: 'Conversation deleted successfully'
        });
      } else {
        res.status(404).json({
          success: false,
          error: 'Conversation not found'
        });
      }
    } catch (error: any) {
      next(error);
    }
  }
};
