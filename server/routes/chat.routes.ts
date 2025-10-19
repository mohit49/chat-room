import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { chatController } from '../controllers/chat.controller';
import { chatValidator } from '../validators/chat.validator';

const router = express.Router();

// Get room messages
router.get('/messages/:roomId', 
  authenticateToken,
  chatController.getRoomMessages
);

// Send message
router.post('/send',
  authenticateToken,
  validate(chatValidator.sendMessage),
  chatController.sendMessage
);

// Upload chat image
router.post('/upload-image',
  authenticateToken,
  (req, res, next) => {
    if (req.upload) {
      req.upload.single('image')(req, res, next);
    } else {
      res.status(500).json({ success: false, error: 'Upload middleware not configured' });
    }
  },
  chatController.uploadImage
);

// Upload chat audio
router.post('/upload-audio',
  authenticateToken,
  (req, res, next) => {
    if (req.upload) {
      req.upload.single('audio')(req, res, next);
    } else {
      res.status(500).json({ success: false, error: 'Upload middleware not configured' });
    }
  },
  chatController.uploadAudio
);

// Direct message upload routes
router.post('/direct-message/upload-image',
  authenticateToken,
  (req, res, next) => {
    if (req.upload) {
      req.upload.single('image')(req, res, next);
    } else {
      res.status(500).json({ success: false, error: 'Upload middleware not configured' });
    }
  },
  async (req, res) => {
    try {
      const userId = req.userId;
      const { receiverId } = req.body;
      
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }
      if (!req.file) {
        return res.status(400).json({ success: false, error: 'No image file provided' });
      }
      if (!receiverId) {
        return res.status(400).json({ success: false, error: 'Receiver ID is required' });
      }
      
      const { uploadChatFile } = await import('../utils/fileStorage');
      const uploadResult = await uploadChatFile(req.file, userId, receiverId, 'images');
      
      if (uploadResult.success) {
        res.json({ success: true, data: { imageUrl: uploadResult.url } });
      } else {
        res.status(400).json({ success: false, error: 'Failed to upload image' });
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

router.post('/direct-message/upload-audio',
  authenticateToken,
  (req, res, next) => {
    if (req.upload) {
      req.upload.single('audio')(req, res, next);
    } else {
      res.status(500).json({ success: false, error: 'Upload middleware not configured' });
    }
  },
  async (req, res) => {
    try {
      const userId = req.userId;
      const { receiverId } = req.body;
      
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }
      if (!req.file) {
        return res.status(400).json({ success: false, error: 'No audio file provided' });
      }
      if (!receiverId) {
        return res.status(400).json({ success: false, error: 'Receiver ID is required' });
      }
      
      const { uploadChatFile } = await import('../utils/fileStorage');
      const uploadResult = await uploadChatFile(req.file, userId, receiverId, 'audio');
      
      if (uploadResult.success) {
        res.json({ success: true, data: { audioUrl: uploadResult.url } });
      } else {
        res.status(400).json({ success: false, error: 'Failed to upload audio' });
      }
    } catch (error) {
      console.error('Error uploading audio:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

export default router;
