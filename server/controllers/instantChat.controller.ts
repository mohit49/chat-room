import { Request, Response } from 'express';
import { instantChatService } from '../services/instantChat.service';
import { AuthRequest } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configure multer for instant chat uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'public/uploads/instant-chat';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

export const uploadMiddleware = {
  image: upload.single('image'),
  audio: upload.single('audio')
};

export const instantChatController = {
  // Create instant chat
  createInstantChat: async (req: AuthRequest, res: Response) => {
    try {
      const { storeHistory } = req.body;
      const userId = req.userId;
      const user = req.user;
      const userName = user?.username || 'User';

      const chat = await instantChatService.createInstantChat(
        userId,
        userName,
        storeHistory || false
      );

      res.json({
        success: true,
        chat: {
          chatId: chat.chatId,
          storeHistory: chat.storeHistory,
          createdAt: chat.createdAt,
          expiresAt: chat.expiresAt
        }
      });
    } catch (error: any) {
      console.error('Error creating instant chat:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create instant chat'
      });
    }
  },

  // Get instant chat details
  getInstantChat: async (req: Request, res: Response) => {
    try {
      const { chatId } = req.params;

      const chat = await instantChatService.getInstantChatById(chatId);

      if (!chat) {
        return res.status(404).json({
          success: false,
          error: 'Instant chat not found or expired'
        });
      }

      res.json({
        success: true,
        chat: {
          chatId: chat.chatId,
          creatorName: chat.creatorName,
          storeHistory: chat.storeHistory,
          participants: chat.participants,
          createdAt: chat.createdAt,
          expiresAt: chat.expiresAt
        }
      });
    } catch (error: any) {
      console.error('Error getting instant chat:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get instant chat'
      });
    }
  },

  // Join instant chat
  joinInstantChat: async (req: Request, res: Response) => {
    try {
      const { chatId } = req.params;
      const { userName } = req.body;
      const userId = (req as AuthRequest).userId; // Optional - if user is logged in

      if (!userName || userName.trim() === '') {
        return res.status(400).json({
          success: false,
          error: 'User name is required'
        });
      }

      const result = await instantChatService.joinInstantChat(chatId, userName, userId);

      res.json({
        success: true,
        chatId: result.chat.chatId,
        participantId: result.participantId,
        participants: result.chat.participants
      });
    } catch (error: any) {
      console.error('Error joining instant chat:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to join instant chat'
      });
    }
  },

  // Get chat messages
  getChatMessages: async (req: Request, res: Response) => {
    try {
      const { chatId } = req.params;

      const messages = await instantChatService.getChatMessages(chatId);

      res.json({
        success: true,
        messages
      });
    } catch (error: any) {
      console.error('Error getting chat messages:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get messages'
      });
    }
  },

  // Send message
  sendMessage: async (req: Request, res: Response) => {
    try {
      const { chatId } = req.params;
      const { senderId, senderName, message, messageType, imageUrl, audioUrl } = req.body;

      if (!senderId || !senderName || !message) {
        return res.status(400).json({
          success: false,
          error: 'Sender ID, sender name, and message are required'
        });
      }

      const newMessage = await instantChatService.sendMessage(
        chatId,
        senderId,
        senderName,
        message,
        messageType || 'text',
        imageUrl,
        audioUrl
      );

      res.json({
        success: true,
        message: newMessage
      });
    } catch (error: any) {
      console.error('Error sending message:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to send message'
      });
    }
  },

  // End instant chat
  endInstantChat: async (req: AuthRequest, res: Response) => {
    try {
      const { chatId } = req.params;
      const userId = req.userId;

      await instantChatService.endInstantChat(chatId, userId);

      res.json({
        success: true,
        message: 'Instant chat ended successfully'
      });
    } catch (error: any) {
      console.error('Error ending instant chat:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to end instant chat'
      });
    }
  },

  // Upload image for instant chat (no auth required)
  uploadImage: async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No image file provided'
        });
      }

      const imageUrl = `/uploads/instant-chat/${req.file.filename}`;
      
      res.json({
        success: true,
        data: {
          imageUrl
        }
      });
    } catch (error: any) {
      console.error('Error uploading instant chat image:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to upload image'
      });
    }
  },

  // Upload audio for instant chat (no auth required)
  uploadAudio: async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No audio file provided'
        });
      }

      const audioUrl = `/uploads/instant-chat/${req.file.filename}`;
      
      res.json({
        success: true,
        data: {
          audioUrl
        }
      });
    } catch (error: any) {
      console.error('Error uploading instant chat audio:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to upload audio'
      });
    }
  },

  // Delete message from instant chat
  deleteMessage: async (req: Request, res: Response) => {
    try {
      const { chatId, messageId } = req.params;
      const { senderId } = req.body;

      if (!senderId) {
        return res.status(400).json({
          success: false,
          error: 'Sender ID is required'
        });
      }

      await instantChatService.deleteMessage(chatId, messageId, senderId);

      res.json({
        success: true,
        message: 'Message deleted successfully'
      });
    } catch (error: any) {
      console.error('Error deleting instant chat message:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to delete message'
      });
    }
  }
};

